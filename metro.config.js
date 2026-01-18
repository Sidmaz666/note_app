const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve nativewind/jsx-dev-runtime to our shim
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'nativewind/jsx-dev-runtime') {
    return {
      filePath: path.resolve(__dirname, 'nativewind/jsx-dev-runtime.js'),
      type: 'sourceFile',
    };
  }
  // Use default resolution for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
