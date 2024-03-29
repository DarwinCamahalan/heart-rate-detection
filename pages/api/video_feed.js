// pages/api/video_feed.js

export default function handler(req, res) {
    // Add your video stream logic here
    // You can use any method to serve the video stream
    // For demonstration purposes, you can simply send a response
    res.status(200).json({ message: 'Video feed endpoint reached' });
  }
  