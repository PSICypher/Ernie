/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  skipWaiting: true,
  // Allow Web Push notifications. next-pwa's generated /sw.js doesn't include
  // a push handler by default, so we import one.
  importScripts: ['/push-sw.js'],
  fallbacks: {
    document: '/_offline'
  }
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'maps.googleapis.com']
  }
};

module.exports = withPWA(nextConfig);
