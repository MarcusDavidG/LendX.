import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
      fileName: true,
      meaninglessFileNames: ["index", "styles"],
    },
  },
};

export default nextConfig;
