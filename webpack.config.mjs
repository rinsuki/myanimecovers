import HtmlWebpackPlugin from "html-webpack-plugin"

/** @type {import("webpack").Configuration} */
const config = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: "./src/index.tsx",
    module: {
        rules: [
            { test: /\.tsx?$/, use: "ts-loader" },
            { test: /\.scss$/, use: ["style-loader", "css-loader", "sass-loader"] },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            publicPath: "/",
        }),
    ],
    devServer: {},
}

export default config
