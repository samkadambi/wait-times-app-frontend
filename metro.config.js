const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix for TurboModule crashes
config.resolver.platforms = ["ios", "android", "native", "web"];

// Ensure proper module resolution
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Add any additional native modules that might be causing issues
config.resolver.alias = {
  ...config.resolver.alias,
  // Add any problematic modules here if needed
};

// Additional fixes for crashes
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Improve error handling
config.resolver.unstable_enableSymlinks = false;

module.exports = config;
