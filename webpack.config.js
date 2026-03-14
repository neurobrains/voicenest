const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "voicenest.min.js",
    // Named chunks for the lazy-loaded transports
    chunkFilename: "voicenest.[name].js",
    path: path.resolve(__dirname, "dist"),
    // 'auto' detects the base URL from the <script> src at runtime —
    // makes split chunks + audio assets resolve correctly from any CDN URL.
    publicPath: "auto",
    library: {
      name: "VoiceNest",
      type: "umd",
      export: "default",
    },
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(mp3|wav|ogg)$/,
        type: "asset/resource",
        generator: {
          filename: "audio/[name][ext]",
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: {
          condition: /^\**!|@preserve|@license|@cc_on/i,
          filename: "voicenest.min.js.LICENSE.txt",
        },
      }),
    ],
    // Only split async (dynamically imported) chunks — avoids conflicts with the
    // UMD entry filename. The transport modules are already dynamic imports so
    // webpack will emit them as voicenest.transport-daily.js / transport-small.js.
    splitChunks: {
      chunks: "async",
    },
  },
  performance: {
    // Warn only above 1 MiB so the separate audio/transport files don't spam
    maxAssetSize: 1048576,
    maxEntrypointSize: 1048576,
    hints: "warning",
  },
  mode: "production",
  devtool: false,
};
