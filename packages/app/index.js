/* eslint-disable import/first */
/* eslint-disable import/order */
const {
  appSetting,
  AppSettingKey,
} = require('@onekeyhq/shared/src/storage/appSetting');

import { Updates } from 'react-native-updates';

// 配置热更新服务
Updates.configure({
  // 设置Android的bundle地址
  updateUrlAndroid: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/remote/android/app/src/main/assets/index.android.bundle',
  // 设置iOS的bundle地址
  updateUrliOS: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/remote/ios/main.jsbundle',
  // 其他配置选项
  // 例如：检查更新的频率、是否自动应用更新等
});

// 检查并应用更新
Updates.checkForUpdate().then((update) => {
  if (update) {
    Updates.fetchUpdate().then((fetchedUpdate) => {
      console.log('New update available:', update);
      if (fetchedUpdate) {
        console.log('Update fetched successfully. Reloading app...');
        Updates.reloadFromCache();
      }
      else {
        console.log('Failed to fetch update.');
      }
    });
  } else {
    console.log('No new updates available.');
  }
});

if (process.env.NODE_ENV !== 'production') {
  // react-render-tracker needs to be loaded before render initialization.
  const rrt = appSetting.getBoolean(AppSettingKey.rrt);
  if (rrt) {
    const { Platform } = require('react-native');
    const manufacturer = Platform.constants.Brand
      ? `${Platform.constants.Brand} (${Platform.constants.Manufacturer})`
      : '';
    const fingerprint = Platform.constants.Fingerprint
      ? `-${Platform.constants.Fingerprint}`
      : '';
    global.REMPL_TITLE = `${manufacturer}${Platform.OS}_${Platform.Version}${fingerprint}`;
    require('react-render-tracker');
  }
}

// Monitoring application performance in integration test and regression test.
if (appSetting.getBoolean(AppSettingKey.perf_switch)) {
  const {
    markJsBundleLoadedTime,
    markBatteryLevel,
    startRecordingMetrics,
  } = require('@onekeyhq/shared/src/modules3rdParty/react-native-metrix');
  markJsBundleLoadedTime();
  markBatteryLevel();
  startRecordingMetrics();
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);