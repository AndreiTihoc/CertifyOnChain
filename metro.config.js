const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SVG transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Polyfills for Node core modules required by Metaplex / Solana libs
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	assert: require.resolve('assert-browserify'),
	buffer: require.resolve('buffer'),
	stream: require.resolve('stream-browserify'),
	util: require.resolve('util'),
	crypto: require.resolve('react-native-crypto'),
	path: require.resolve('path-browserify'),
	url: require.resolve('react-native-url-polyfill'),
	process: require.resolve('process/browser'),
};

module.exports = config;