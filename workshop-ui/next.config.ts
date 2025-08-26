import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
      resourceRegExp: /middleware\.ts|instrumentation\.ts/,
      })
    );

    // Important: return the modified config
    return config
  },
};

export default nextConfig;
