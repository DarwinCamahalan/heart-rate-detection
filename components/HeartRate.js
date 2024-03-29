"use client"
import { useEffect, useRef } from 'react';

const HeartRate = () => {
    const videoRef = useRef();

    useEffect(() => {
        const videoElement = videoRef.current;
        const loadVideo = async () => {
            try {
                const response = await fetch('/api/video_feed'); // Update URL to the new API route
                const reader = response.body.getReader();
                const stream = new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    console.log('Stream complete');
                                    controller.close();
                                    return;
                                }
                                controller.enqueue(value);
                                push();
                            }).catch(error => {
                                console.error(error);
                                controller.error(error)
                            });
                        }
                        push();
                    }
                });
                const videoStream = new Response(stream);
                videoElement.src = URL.createObjectURL(await videoStream.blob());
            } catch (error) {
                console.error('Error fetching video:', error);
            }
        };
        loadVideo();

        return () => {
            videoElement.src = ''; // Clean up
        };
    }, []);

    return <video ref={videoRef} autoPlay controls />;
};

export default HeartRate;
