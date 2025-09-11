const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    host: "localhost",
    port: 8080,
    https: false,
    hot: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    proxy: {
      // Keep existing /api proxy (useful for any legacy calls)
      "^/api": {
        target: "https://localhost:7183",
        changeOrigin: true,
        secure: false, // self-signed dev certs
        ws: true,
        pathRewrite: { "^/api": "" },
        logLevel: "info",
      },
      // New proxies for each controller, removing the /api prefix
      "^/(Shoes|Suppliers|PurchaseRecord|StockTransmission)": {
        target: "https://localhost:7183",
        changeOrigin: true,
        secure: false,
        ws: true,
        pathRewrite: (path) => `/api${path}`,
        logLevel: "info",
      },
    },
  },
});
