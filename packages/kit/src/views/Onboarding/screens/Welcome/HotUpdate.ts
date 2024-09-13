import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import { PermissionsAndroid, NativeModules } from 'react-native';
// import * as Updates from 'expo-updates';

const { RNDynamicBundle } = NativeModules;

const requestStoragePermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to your storage to download files.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Storage permission granted');
    } else {
      console.log('Storage permission denied');
      throw new Error('Storage permission denied');
    }
  } catch (err) {
    console.warn(err);
    throw err;
  }
};

const startDownload = async (url: string) => {
  console.log("开始  第  2  次  测试");

  // 检查网络连接状态
  const netInfoState = await NetInfo.fetch();
  if (!netInfoState.isConnected) {
    console.error('No internet connection');
    return;
  }

  // 请求存储权限
  await requestStoragePermission();

  const destPath = RNFS.DocumentDirectoryPath + '/index.android.bundle';
  console.log("11111  ", destPath);

  try {
    const task = RNFS.downloadFile({
      fromUrl: url,
      toFile: destPath,
      background: true,
      progressDivider: 1,
      begin: (res) => {
        console.log('Download started:', res);
      },
      progress: (res) => {
        const progress = (res.bytesWritten / res.contentLength) * 100;
        console.log('Download progress:', progress);
      },
    });

    const response = await task.promise;
    console.log('Download completed:', destPath);

    // 检查文件是否存在且可读
    const fileExists = await RNFS.exists(destPath);
    if (!fileExists) {
      console.error('File does not exist:', destPath);
      return;
    }

    const isFileReadable = await RNFS.stat(destPath);
    if (!isFileReadable.isFile()) {
      console.error('File is not readable:', destPath);
      return;
    }

    console.log('File is valid and readable:', destPath);

    // 检查文件内容
    const isValidContent = await checkFileContent(destPath);
    if (!isValidContent) {
      return;
    }

    // 应用热更新
    await applyHotUpdate(destPath);
    return destPath;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

const checkFileContent = async (filePath: string) => {
  try {
    const content = await RNFS.readFile(filePath, 'utf8');
    console.log('File content:', content);

    // 使用正则表达式检查文件内容是否包含指定的代码片段
    const regex = /var __BUNDLE_START_TIME__=this\.nativePerformanceNow\?nativePerformanceNow\(\):Date\.now\(\),\s*__DEV__=false,\s*process=this\.process\|\|\{\},\s*__METRO_GLOBAL_PREFIX__='';/;
    if (!regex.test(content)) {
      console.error('File content is invalid');
      return false;
    }

    console.log('File content is valid');
    return true;
  } catch (error) {
    console.error('Error reading file content:', error);
    return false;
  }
};

const applyHotUpdate = async (filePath: string) => {
  try {
    console.log(" 开始注册bundle文件   ",filePath);
    // 注册新下载的 Bundle
    const bundleId = 'new_bundle';
    await RNDynamicBundle.registerBundle(bundleId, filePath);
    console.log(" 注册bundle文件完成 并且开始激活bundle   ",filePath);
    // 设置为激活的 Bundle
    await RNDynamicBundle.setActiveBundle(bundleId);
    console.log(" 激活成功  重启应用   ");

    // const bundles = await RNDynamicBundle.getBundles();
    // const activeBundle = await RNDynamicBundle.getActiveBundle();

    // console.log(" 所有的bundles     ",bundles);
    // console.log(" 当前活动的bundle     ",activeBundle);

    // 重启应用
    await RNDynamicBundle.reloadBundle();

    console.log('Hot update applied successfully');
  } catch (error) {
    console.error('Error applying hot update:', error);
  }

  const checkForUpdates = async () => {
    try {
      // 检查网络连接状态
      const netInfoState = await NetInfo.fetch();
      if (!netInfoState.isConnected) {
        console.error('No internet connection');
        return;
      }

      // 请求存储权限
      await requestStoragePermission();


    //   const update = await Updates.checkForUpdateAsync();
    //   if (update.isAvailable) {
    //     await Updates.fetchUpdateAsync();
    //     // 提示用户重启应用程序以应用更新
    //     console.log('A new update is available! Please restart the app.');
    //   }
    } catch (e) {
      console.error('Error fetching updates', e);
    }
  }
};

export { startDownload };