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
boxWeight = 2

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

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Emit BPM value over WebSocket
def emit_bpm(bpm):
    rounded_bpm = round(bpm)  # Round BPM to the nearest whole number
    socketio.emit('bpm_update', {'bpm': rounded_bpm})

@app.route('/bpm_detection')
def bpm_detection():
    def generate(bufferIndex, bpmBufferIndex):
        i = 0  # Initialize i outside the loop
        while True:
            ret, frame = webcam.read()
            if not ret:
                break

            detectionFrame = frame[videoHeight//2:realHeight-videoHeight//2, videoWidth//2:realWidth-videoWidth//2, :]

            # Construct Gaussian Pyramid
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

            if bufferIndex >= bpmBufferSize:
                cv2.putText(frame, "BPM: %d" % bpmBuffer.mean(), (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                emit_bpm(bpmBuffer.mean())  # Emit BPM value over WebSocket

            ret, jpeg = cv2.imencode('.jpg', frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate(bufferIndex, bpmBufferIndex), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/face_detection')
def face_detection():
    def generate():
        font = cv2.FONT_HERSHEY_SIMPLEX
        fps_start_time = time.time()
        fps_frame_count = 0

        while True:
            ret, frame = webcam.read()
            if not ret:
                break

            # Perform face detection
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            for (x, y, w, h) in faces:
                # Draw rectangle around faces
                cv2.rectangle(frame, (x, y), (x+w, y+h), (86, 51, 255), 1)

                # Add blue lines to the pointy edges of the rectangle
                cv2.line(frame, (x, y), (x+int(w/10), y), (225, 105, 65), 2)
                cv2.line(frame, (x, y), (x, y+int(h/10)), (225, 105, 65), 2)
                cv2.line(frame, (x+w-int(w/10), y), (x+w, y), (225, 105, 65), 2)
                cv2.line(frame, (x+w, y), (x+w, y+int(h/10)), (225, 105, 65), 2)
                cv2.line(frame, (x, y+h), (x+int(w/10), y+h), (225, 105, 65), 2)
                cv2.line(frame, (x, y+h-int(h/10)), (x, y+h), (225, 105, 65), 2)
                cv2.line(frame, (x+w-int(w/10), y+h), (x+w, y+h), (225, 105, 65), 2)
                cv2.line(frame, (x+w, y+h-int(h/10)), (x+w, y+h), (225, 105, 65), 2)

                # Add "Head" label text with red background and white font
                cv2.rectangle(frame, (x, y - 15), (x + 33, y), (86, 51, 255), -1)
                cv2.putText(frame, ' HEAD', (x, y - 5), font, 0.3, (255, 255, 255), 1, cv2.FONT_HERSHEY_COMPLEX_SMALL)

            # Calculate and display FPS
            fps_frame_count += 1
            if fps_frame_count >= 30:  # Change to 30 to get the actual FPS for every second
                fps = fps_frame_count / (time.time() - fps_start_time)
                cv2.putText(frame, f'FPS: {int(fps)}', (10, 20), font, 0.5, (255, 255, 255), 1, cv2.FONT_HERSHEY_COMPLEX_SMALL)
                fps_frame_count = 0
                fps_start_time = time.time()

            resized_frame = cv2.resize(frame, (650, 550))

            ret, jpeg = cv2.imencode('.jpg', resized_frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')





if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
