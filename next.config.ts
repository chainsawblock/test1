/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // чтобы ESLint не ломал сборку (и локально, и на Vercel)
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
