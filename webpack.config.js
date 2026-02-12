const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "voicenest.min.js",
    path: path.resolve(__dirname, "dist"),
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
  },
  mode: "production",
  devtool: false,
};
