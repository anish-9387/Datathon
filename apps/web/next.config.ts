import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.CATALYST_BUILD ? "../../.next" : ".next",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
