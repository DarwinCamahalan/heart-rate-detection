// next.config.js

module.exports = {
  async rewrites() {
    return [
      {
        source: '/video_feed',
        destination: 'http://localhost:5000/video_feed',
      },
    ];
  },
};
