const path = require('path');

module.exports = {
  entry: './src/engine/lava-engine.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
    },
  },
  output: {
    filename: 'lava-engine.js',
    path: path.resolve(__dirname, 'dist'),
  },
  experiments: {
    topLevelAwait: true
  },
};