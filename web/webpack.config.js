var webpack = require("webpack")
module.exports = {
  entry: "./src/index.js",
  output: {
    path: require("path").resolve(__dirname, "build"),
    filename: "bundle.js"
  },
  plugins: [
    new (require("html-webpack-plugin"))({
      title: "Cilia",
      favicon: "./favicon.ico"
    }),
    new webpack.ProvidePlugin({
      fetch: "imports?this=>global!exports?global.fetch!whatwg-fetch"
    })
  ],
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        query: {
          presets: ["es2015", "react"],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
    ]
  }
}
