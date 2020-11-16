const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

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
  },
  devServer: {
    open: 'Google Chrome',
    https: true,
    writeToDisk: true,
    disableHostCheck: true,
    host: 'localhost',
    port: '8080',
    watchOptions: {
      poll: false
    }
  }
}
