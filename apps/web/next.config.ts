import type { NextConfig } from "next";

const isCatalyst = process.env.CATALYST_BUILD === "true"

const nextConfig: NextConfig = {
  distDir: isCatalyst ? "../../.next" : ".next",
  typescript: {
    ignoreBuildErrors: isCatalyst,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
