const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    watchFolders: [root],
    resolver: {
        nodeModulesPaths: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(root, 'node_modules'),
        ],
        extraNodeModules: {
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-native': path.resolve(__dirname, 'node_modules/react-native'),
            '@markwave/shared': path.resolve(root, 'shared'),
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
