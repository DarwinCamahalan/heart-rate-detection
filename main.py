import numpy as np
import time
import cv2
from flask import Flask, Response
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Helper Methods
def buildGauss(frame, levels):
    pyramid = [frame]
    for level in range(levels):
        frame = cv2.pyrDown(frame)
        pyramid.append(frame)
    return pyramid

def reconstructFrame(pyramid, index, levels):
    filteredFrame = pyramid[index]
    for level in range(levels):
        filteredFrame = cv2.pyrUp(filteredFrame)
    filteredFrame = filteredFrame[:videoHeight, :videoWidth]
    return filteredFrame

# Webcam Parameters
webcam = cv2.VideoCapture(0)
realWidth = 320
realHeight = 240
videoWidth = 160
videoHeight = 120
videoChannels = 3
videoFrameRate = 15
webcam.set(3, realWidth)
webcam.set(4, realHeight)
alphaColor = 0.4

# Output Videos
outputVideoFilename = "output.mov"
outputVideoWriter = cv2.VideoWriter(outputVideoFilename, cv2.VideoWriter_fourcc('M','J','P','G'), videoFrameRate, (realWidth, realHeight), True)

# Color Magnification Parameters
levels = 3
alpha = 170
minFrequency = 1.0
maxFrequency = 2.0
bufferSize = 150
bufferIndex = 0
boxColor = (0, 255, 0)
boxWeight = 1

# Initialize Gaussian Pyramid
firstFrame = np.zeros((videoHeight, videoWidth, videoChannels))
firstGauss = buildGauss(firstFrame, levels+1)[levels]
videoGauss = np.zeros((bufferSize, firstGauss.shape[0], firstGauss.shape[1], videoChannels))
fourierTransformAvg = np.zeros((bufferSize))

# Bandpass Filter for Specified Frequencies
frequencies = (1.0*videoFrameRate) * np.arange(bufferSize) / (1.0*bufferSize)
mask = (frequencies >= minFrequency) & (frequencies <= maxFrequency)

# Heart Rate Calculation Variables
bpmCalculationFrequency = 15
bpmBufferIndex = 0
bpmBufferSize = 10
bpmBuffer = np.zeros((bpmBufferSize))
# Add a global variable to track if BPM detection is complete
bpm_detection_complete = False

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Emit BPM value and bufferIndex over WebSocket
def emit_bpm(bpm, buffer_index):
    global bpm_detection_complete
    rounded_bpm = round(bpm)  # Round BPM to the nearest whole number
    socketio.emit('bpm_update', {'bpm': rounded_bpm, 'bufferIndex': buffer_index})
    # Check if BPM detection is complete
    if bpm_detection_complete:
        print("BPM detection is complete")
        # Send boolean value to next JS website
        socketio.emit('bpm_detection_complete', {'complete': True, 'bpm': rounded_bpm})
        bpm_detection_complete = False

@app.route('/bpm_detection')
def bpm_detection():
    def generate(bufferIndex, bpmBufferIndex):
        global bpm_detection_complete
        i = 0  # Initialize i outside the loop
        while True:
            ret, frame = webcam.read()
            if not ret:
                break

            detectionFrame = frame[videoHeight//2:realHeight-videoHeight//2, videoWidth//2:realWidth-videoWidth//2, :]
            
            # Perform eye detection
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            gray = cv2.cvtColor(detectionFrame, cv2.COLOR_BGR2GRAY)
            eyes = eye_cascade.detectMultiScale(gray)
            
            # Eyes detected, proceed with normal BPM detection
            videoGauss[bufferIndex] = buildGauss(detectionFrame, levels+1)[levels]
            fourierTransform = np.fft.fft(videoGauss, axis=0)
            
            # Bandpass Filter
            fourierTransform[mask == False] = 0

            # Grab a Pulse
            if bufferIndex % bpmCalculationFrequency == 0:
                for buf in range(bufferSize):
                    fourierTransformAvg[buf] = np.real(fourierTransform[buf]).mean()
                hz = frequencies[np.argmax(fourierTransformAvg)]
                bpm = 60.0 * hz
                bpmBuffer[bpmBufferIndex] = bpm
                bpmBufferIndex = (bpmBufferIndex + 1) % bpmBufferSize

            # Amplify
            filtered = np.real(np.fft.ifft(fourierTransform, axis=0))
            filtered = filtered * alpha

            # Reconstruct Resulting Frame
            filteredFrame = reconstructFrame(filtered, bufferIndex, levels)
            outputFrame = detectionFrame + filteredFrame
            outputFrame = cv2.convertScaleAbs(outputFrame)

            bufferIndex = (bufferIndex + 1) % bufferSize
            
            frame[videoHeight//2:realHeight-videoHeight//2, videoWidth//2:realWidth-videoWidth//2, :] = outputFrame
            cv2.rectangle(frame, (videoWidth//2 , videoHeight//2), (realWidth-videoWidth//2, realHeight-videoHeight//2), boxColor, boxWeight)

            if len(eyes) == 0:
                # No eyes detected, set bpm to 0 and font color to red
                bpm = 0
                bufferIndex = 0
                # Create a transparent red rectangle
                overlay = frame.copy()  # Create a copy of the frame
                cv2.rectangle(overlay, (0, 5), (143, 30), (0, 0, 255), -1)  # Draw the red rectangle on the copy

                # Blend the overlay with the frame
                cv2.addWeighted(overlay, alphaColor, frame, 1 - alphaColor, 0, frame)
                cv2.putText(frame, f"NO FACE FOUND", (5, 23), cv2.FONT_HERSHEY_PLAIN, 1, (255, 255, 255), 1)
                emit_bpm(bpm, bufferIndex)
            else:
                if bufferIndex >= bpmBufferSize:
                    # Create a transparent green rectangle
                    overlay = frame.copy()  # Create a copy of the frame
                    cv2.rectangle(overlay, (0, 5), (115, 30), (0, 255, 0), -1)  # Draw the red rectangle on the copy

                    # Blend the overlay with the frame
                    cv2.addWeighted(overlay, alphaColor, frame, 1 - alphaColor, 0, frame)
                    cv2.putText(frame, f"BPM: {round(bpmBuffer.mean())}", (5, 23), cv2.FONT_HERSHEY_PLAIN, 1, (255, 255, 255), 1)
                    
                    # Emit BPM value over WebSocket
                    emit_bpm(bpmBuffer.mean(), bufferIndex)
                    # print(bufferIndex) pass this
                    if bufferIndex == bpmBufferSize:
                        bpm_detection_complete = True
                    
            ret, jpeg = cv2.imencode('.jpg', frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate(bufferIndex, bpmBufferIndex), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/face_detection')
def face_detection():
    # Initialize face cascade classifier
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Initialize FPS variables
    fps_start_time = time.time()
    fps_frame_count = 0

    def generate():
        nonlocal fps_start_time, fps_frame_count
        while True:
            ret, frame = webcam.read()
            if not ret:
                break

            # Perform face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            for (x, y, w, h) in faces:
                # Draw rectangle around faces with specified styling
                cv2.rectangle(frame, (x, y), (x+w, y+h), (86, 51, 255), 1)
                cv2.line(frame, (x, y), (x+int(w/10), y), (225, 105, 65), 2)
                cv2.line(frame, (x, y), (x, y+int(h/10)), (225, 105, 65), 2)
                cv2.line(frame, (x+w-int(w/10), y), (x+w, y), (225, 105, 65), 2)
                cv2.line(frame, (x+w, y), (x+w, y+int(h/10)), (225, 105, 65), 2)
                cv2.line(frame, (x, y+h), (x+int(w/10), y+h), (225, 105, 65), 2)
                cv2.line(frame, (x, y+h-int(h/10)), (x, y+h), (225, 105, 65), 2)
                cv2.line(frame, (x+w-int(w/10), y+h), (x+w, y+h), (225, 105, 65), 2)
                cv2.line(frame, (x+w, y+h-int(h/10)), (x+w, y+h), (225, 105, 65), 2)

                # Create a transparent green rectangle for the 'HEAD' label
                overlay = frame.copy()  
                cv2.rectangle(overlay, (x, y - 15), (x + 35, y), (86, 51, 255), -1)  
                cv2.addWeighted(overlay, alphaColor, frame, 1 - alphaColor, 0, frame)
                cv2.putText(frame, 'HEAD', (x + 3, y - 4), cv2.FONT_HERSHEY_PLAIN, 0.7, (255, 255, 255), 1)

            # Calculate and display FPS
            fps_frame_count += 1
            if fps_frame_count >= 30:  
                fps = fps_frame_count / (time.time() - fps_start_time)
                fps_text = f'FPS: {round(fps)}'
            else:
                fps_text = ''

            # Create a transparent green rectangle for the FPS text
            fps_overlay = frame.copy()
            cv2.rectangle(fps_overlay, (0, 3), (60, 18), (0, 0, 0), -1)
            cv2.addWeighted(fps_overlay, alphaColor, frame, 1 - alphaColor, 0, frame)
            cv2.putText(frame, fps_text, (5, 15), cv2.FONT_HERSHEY_PLAIN, 0.7, (255, 255, 255), 1)

            resized_frame = cv2.resize(frame, (600, 500))

            ret, jpeg = cv2.imencode('.jpg', resized_frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
