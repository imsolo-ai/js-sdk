const path = require("path")
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    entry: path.resolve(__dirname, "src/index.js"),
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index_bundle.js",
        library: "solo",
        libraryTarget: "umd",
        libraryExport: "default",
        globalObject: "this",
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    mode: "production",
}
