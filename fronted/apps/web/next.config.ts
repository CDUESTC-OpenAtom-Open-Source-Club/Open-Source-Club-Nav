import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
