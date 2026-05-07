import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/generate',
        // [REQUIRED] FLASK_API_URL
        // What: URL of the Flask AI Backend for generation requests
        // Where: Local development (http://localhost:5000) or your production backend URL
        destination: process.env.FLASK_API_URL ? `${process.env.FLASK_API_URL}/generate` : 'http://localhost:5000/generate',
      },
    ];
  },
};

export default nextConfig;
