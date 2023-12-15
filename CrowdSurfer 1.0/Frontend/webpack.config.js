const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(__dirname, 'src/popup/index.js'),
    home: path.resolve(__dirname, 'src/popup/home.js'),
    main: path.resolve(__dirname, 'src/panels/main.js'),
    confirm: path.resolve(__dirname, 'src/popup/confirm-register.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    assetModuleFilename: '[name][ext]',
    publicPath: '',
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.png$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'index.html',
      template: 'src/popup/index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'home.html',
      template: 'src/popup/home.html',
      chunks: ['home'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'panel-stars.html',
      template: 'src/panels/panel-stars.html',
      chunks: ['panel-stars'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'panel-text.html',
      template: 'src/panels/panel-text.html',
      chunks: ['panel-text'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'panel-text-stars.html',
      template: 'src/panels/panel-text-stars.html',
      chunks: ['panel-text-stars'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'requester-information.html',
      template: 'src/modals/requester-information.html',
      chunks: ['modal-requester'],
    }),
    new HtmlWebpackPlugin({
      title: 'ChromeSurfer',
      filename: 'confirm-reject.html',
      template: 'src/modals/confirm-reject.html',
      chunks: ['modal-requester'],
    }),
    new HtmlWebpackPlugin({
      title: 'CrowdSurfer',
      filename: 'confirm-register.html',
      template: 'src/popup/confirm-register.html',
      chunks: ['confirm'],
    }),
  ],
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
  },
};
