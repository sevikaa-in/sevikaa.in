const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable .mjs extension resolution for lucide-react-native ES modules
if (config.resolver && config.resolver.sourceExts) {
  config.resolver.sourceExts.push('mjs');
}

module.exports = config;
