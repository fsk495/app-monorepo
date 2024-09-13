module.exports = {
  reactNativePath: '../../node_modules/react-native',
  react: {
    entryFile: './index.js', // 确保这个路径是正确的
  },
  dependencies: {
    'react-native-flipper': {
      // disable flipper in CI environment
      platforms: process.env.CI ? { ios: null, android: null } : {},
    },
    '@react-native-google-signin/google-signin': {
      platforms: {
        ios: null,
      },
    },
    'react-native-v8': {
      platforms: {
        ios: null,
      },
    },
  },
};
