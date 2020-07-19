const path = require("path");

module.exports = {
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  devServer: {
    contentBase: path.join(__dirname, "."),
    open: true,
    openPage: "index.html",
  },
  output: {
    filename: "dist/bundle.js",
    path: path.resolve(__dirname, "."),
  },
};
