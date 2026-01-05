/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features if needed
  experimental: {
    serverActions: true,
  },
  // Exclude native modules from webpack bundling
  serverComponentsExternalPackages: [
    '@xenova/transformers',
    'onnxruntime-node',
  ],
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Mark onnxruntime-node as external to prevent bundling
      config.externals = config.externals || []
      config.externals.push('onnxruntime-node')
      
      // Handle .node files - prevent webpack from trying to parse native binaries
      // Use webpack's IgnorePlugin to ignore .node files in onnxruntime-node
      // The files will be loaded at runtime by Node.js
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\.node$/,
          contextRegExp: /onnxruntime-node/,
        })
      )
    }
    return config
  },
}

module.exports = nextConfig

