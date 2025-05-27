// config-overrides.js
module.exports = function override(config, env) {
  // Add PostCSS plugins without modifying the default setup
  require('postcss-flexbugs-fixes');
  require('postcss-preset-env');
  require('postcss-normalize');
  
  // Fix for react-datepicker source map warnings
  config.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: [{
      loader: require.resolve("source-map-loader"),
      options: {
        filterSourceMappingUrl: (url, resourcePath) => {
          // Completely ignore source maps from react-datepicker package
          if (resourcePath.includes('node_modules/react-datepicker')) {
            return false;
          }
          return true;
        }
      }
    }]
  });
  
  return config;
}
