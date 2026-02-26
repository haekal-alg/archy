const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      fallback: {
        "buffer": false,
        "stream": false,
        "util": false,
        "fs": false,
        "path": false,
        "module": false
      }
    },
    externals: {
      'module': 'commonjs module'
    },
    output: {
      filename: isProduction ? '[name].[contenthash:8].js' : 'renderer.js',
      chunkFilename: '[name].[contenthash:8].js',
      path: path.resolve(__dirname, 'dist'),
      globalObject: 'this'
    },
    optimization: {
      ...(isProduction ? {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            react: { test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, name: 'vendor-react', priority: 20 },
            reactflow: { test: /[\\/]node_modules[\\/]@xyflow[\\/]/, name: 'vendor-reactflow', priority: 15 },
            xterm: { test: /[\\/]node_modules[\\/]@xterm[\\/]/, name: 'vendor-xterm', priority: 15 },
            vendors: { test: /[\\/]node_modules[\\/]/, name: 'vendor-misc', priority: 10 },
          },
        },
      } : {}),
      minimize: isProduction,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
      }),
    ],
  };
};
