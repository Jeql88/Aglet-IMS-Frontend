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
        // Note: pathRewrite removes /api from the forwarded path.
        // We'll NOT use /api prefix from the frontend per Option B, but we keep this for flexibility.
        pathRewrite: { "^/api": "" },
        logLevel: "info",
      },

      // Option B: direct controller routes without /api prefix
      // Rewrite to include /api so it matches [Route("api/[controller]")]
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
