/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@mietealle/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default config;
