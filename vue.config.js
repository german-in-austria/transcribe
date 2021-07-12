const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

module.exports = {
  lintOnSave: false,
  transpileDependencies: [
    'vuetify'
  ],
  runtimeCompiler: true,
  configureWebpack: (config) => {
    if (process.env.NODE_ENV !== 'production') {
      config.plugins.push(new BundleAnalyzerPlugin({
        defaultSizes: 'gzip'
      }))
    }
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.BUILD_ID !== undefined &&
      process.env.SENTRY_TOKEN !== undefined
    ) {
      config.plugins.push(new SentryWebpackPlugin({
        // sentry-cli configuration
        authToken: process.env.SENTRY_TOKEN,
        org: 'university-of-vienna-i1',
        project: 'transcribe',
        release: process.env.BUILD_ID || 0,
        // webpack specific configuration
        include: './dist',
        ignore: ['node_modules', 'vue.config.js']
      }))
    }
    config.module.rules.unshift({
      test: /\.worker\.ts$/,
      use: [
        {
          loader: 'worker-loader',
          options: {
            inline: 'no-fallback'
          }
        }
      ]
    })
    config.module.rules.unshift(
      {
        test: /workers\/.*\.js$/,
        loader: 'worker-loader',
        options: {
          filename: '[name].[contenthash].js'
        }
      }
    )
    config.module.rules.unshift({
      test: /\.wasm$/,
      type: 'javascript/auto',
      loader: 'file-loader',
      options: {
        publicPath: '',
        name: '[name].[hash].[ext]'
      }
    })
  },
  devServer: {
    open: 'Google Chrome',
    https: true,
    // writeToDisk: true,
    disableHostCheck: true,
    host: 'localhost',
    port: '8080',
    watchOptions: {
      poll: false
    }
  }
}
