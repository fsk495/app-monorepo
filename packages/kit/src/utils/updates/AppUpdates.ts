import differenceInDays from 'date-fns/differenceInDays';
import { openURL as LinkingOpenURL, canOpenURL } from 'expo-linking';
import semver from 'semver';

import { ToastManager } from '@onekeyhq/components';
import type { LocaleSymbol } from '@onekeyhq/components/src/locale';
import { formatMessage } from '@onekeyhq/components/src/Provider';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import store from '@onekeyhq/kit/src/store';
import {
  available,
  checking,
  downloading,
  enable as enableUpdater,
  error,
  notAvailable,
  ready,
  setLastCheckTimestamp,
} from '@onekeyhq/kit/src/store/reducers/autoUpdater';
import {
  setForceUpdateVersionInfo,
  setUpdateSetting,
} from '@onekeyhq/kit/src/store/reducers/settings';
import { getTimeStamp } from '@onekeyhq/kit/src/utils/helper';
import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import { getDefaultLocale } from '../locale';

import { getChangeLog, getPreReleaseInfo, getReleaseInfo } from './server';

import type { PackageInfo, PackagesInfo, VersionInfo } from './type';
import RNFS from '@onekeyhq/shared/src/modules3rdParty/react-native-fs/index.native';
import axios from 'axios';
import { setVersion } from '../../store/reducers/versionSlice';
import RNRestart from 'react-native-restart';
import { NativeModules } from 'react-native';

class AppUpdates {
  addedListener = false;

  checkUpdate(isManual = false) {
    if (platformEnv.isDesktop && platformEnv.supportAutoUpdate) {
      this.checkDesktopUpdate(isManual);
    }

    const { dispatch } = backgroundApiProxy;

    return this.checkAppUpdate().then((newVersion) => {
      const actions: any[] = [setLastCheckTimestamp(getTimeStamp())];

      if (newVersion) {
        actions.push(enableUpdater());
        actions.push(available(newVersion));
      }

      if (newVersion?.forceUpdate) {
        actions.push(setForceUpdateVersionInfo(newVersion));
      } else {
        actions.push(setForceUpdateVersionInfo(undefined));
      }

      dispatch(...actions);
      return newVersion;
    });
  }

  private async checkAppUpdate(): Promise<VersionInfo | undefined> {
    const packageInfo: PackageInfo | undefined =
      await this.getPackageInfo().catch(
        () =>
          store.getState().settings?.softwareUpdate?.forceUpdateVersionInfo
            ?.package,
      );

    if (packageInfo) {
      if (!packageInfo) return undefined;

      const currentVersion = store.getState().settings.version ?? '0.0.0';
      const needUpdate = semver.gt(packageInfo.version, currentVersion);
      const needForceUpdate = semver.gt(
        packageInfo.forceUpdateVersion ?? '0.0.0',
        currentVersion,
      );

      if (needUpdate || needForceUpdate) {
        return {
          package: packageInfo,
          forceUpdate: needForceUpdate,
        };
      }

      //  没有更新
      return undefined;
    }
  }

  async getPackageInfo() {
    const { enable, preReleaseUpdate } =
      store.getState().settings.devMode || {};

    const preUpdateMode = enable && preReleaseUpdate;

    let releasePackages: PackagesInfo | null;
    if (preUpdateMode) {
      releasePackages = await getPreReleaseInfo();
    } else {
      releasePackages = await getReleaseInfo();
    }

    let packageInfo: PackageInfo | undefined;

    if (platformEnv.isNativeAndroid) {
      let channel = 'Direct';
      if (platformEnv.isNativeAndroidHuawei) {
        channel = 'HuaweiAppGallery';
      } else if (platformEnv.isNativeAndroidGooglePlay) {
        channel = 'GooglePlay';
      }
      packageInfo = releasePackages?.android?.find(
        (x) => x.os === 'android' && x.channel === channel,
      );
    }

    if (platformEnv.isNativeIOS) {
      packageInfo = releasePackages?.ios?.find((x) => x.os === 'ios');
    }

    if (platformEnv.isDesktop) {
      if (platformEnv.isDesktopLinuxSnap) {
        packageInfo = releasePackages?.desktop?.find(
          (x) => x.os === 'linux' && x.channel === 'LinuxSnap',
        );
      } else if (platformEnv.isDesktopLinux) {
        packageInfo = releasePackages?.desktop?.find((x) => x.os === 'linux');
      }

      if (platformEnv.isDesktopWinMsStore) {
        packageInfo = releasePackages?.desktop?.find(
          (x) => x.os === 'win' && x.channel === 'MsWindowsStore',
        );
      } else if (platformEnv.isDesktopWin) {
        packageInfo = releasePackages?.desktop?.find((x) => x.os === 'win');
      }

      if (platformEnv.isMas) {
        packageInfo = releasePackages?.desktop?.find((x) => x.os === 'mas');
      } else if (platformEnv.isDesktopMacArm64) {
        packageInfo = releasePackages?.desktop?.find(
          (x) => x.os === 'macos-arm64',
        );
      } else if (platformEnv.isDesktopMac) {
        packageInfo = releasePackages?.desktop?.find(
          (x) => x.os === 'macos-x64',
        );
      }
    }

    if (platformEnv.isExtension) {
      if (platformEnv.isExtFirefox) {
        packageInfo = releasePackages?.extension?.find(
          (x) => x.os === 'firefox',
        );
      }
      if (platformEnv.isExtChrome) {
        if (platformEnv.isRuntimeEdge) {
          packageInfo = releasePackages?.extension?.find(
            (x) => x.os === 'edge',
          );
        } else {
          packageInfo = releasePackages?.extension?.find(
            (x) => x.os === 'chrome',
          );
        }
      }
    }

    if (platformEnv.isWeb) {
      packageInfo = releasePackages?.web?.find((x) => x.os === 'website');
    }

    return packageInfo;
  }

  checkDesktopUpdate(isManual = false) {
    debugLogger.autoUpdate.debug('check desktop update');
    window.desktopApi.checkForUpdates(isManual);
  }

  openAppUpdate(versionInfo: VersionInfo): void {
    switch (versionInfo.package.channel) {
      case 'AppStore':
        canOpenURL('itms-apps://').then((supported) => {
          if (supported) {
            LinkingOpenURL('itms-apps://itunes.apple.com/app/id1609559473');
          } else {
            this._openUrl(versionInfo.package.download);
          }
        });
        break;
      case 'GooglePlay':
        canOpenURL('market://details?id=so.onekey.app.wallet').then(
          (supported) => {
            if (supported) {
              LinkingOpenURL('market://details?id=so.onekey.app.wallet');
            } else {
              LinkingOpenURL(versionInfo.package.download);
            }
          },
        );
        break;
      case 'HuaweiAppGallery':
        canOpenURL('hiapplink://com.huawei.appmarket?appId=C107439249')
          .then((supported) => {
            if (supported) {
              LinkingOpenURL(
                'hiapplink://com.huawei.appmarket?appId=C107439249',
              );
              return null;
            }
            return canOpenURL('market://details?id=so.onekey.app.wallet');
          })
          .then((supported) => {
            if (!supported) return null;

            if (supported) {
              LinkingOpenURL('market://details?id=so.onekey.app.wallet');
            } else {
              LinkingOpenURL(versionInfo.package.download);
            }
          });

        break;
      case 'MsWindowsStore':
        // check ms-windows-store protocol support
        canOpenURL('ms-windows-store://pdp/?productid=XPFMHZDDF91TNL').then(
          (supported) => {
            if (supported) {
              return LinkingOpenURL(
                'ms-windows-store://pdp/?productid=XPFMHZDDF91TNL',
              );
            }
            return LinkingOpenURL(versionInfo.package.download);
          },
        );
        break;
      default:
        this._openUrl(versionInfo.package.download);
        break;
    }
  }

  async getChangeLog(
    oldVersion: string,
    newVersion: string,
  ): Promise<string | undefined> {
    const { enable, preReleaseUpdate } =
      store.getState().settings.devMode || {};

    const preUpdateMode = enable && preReleaseUpdate;

    const releaseInfo = await getChangeLog(
      oldVersion,
      newVersion,
      preUpdateMode,
    );

    if (!releaseInfo) return;

    let locale: LocaleSymbol = store.getState().settings.locale ?? 'en-US';
    if (locale === 'system') {
      locale = getDefaultLocale();
    }

    return releaseInfo[locale];
  }

  _openUrl(url: string) {
    if (platformEnv.isNative) {
      LinkingOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  }

  skipVersionCheck(version: string) {
    const { updateLatestVersion = null, updateLatestTimeStamp = null } =
      store.getState().settings.updateSetting ?? {};

    debugLogger.autoUpdate.debug(
      'skipVersionCheck params updateLatestVersion: ',
      updateLatestVersion,
      ' , updateLatestTimeStamp: ',
      updateLatestTimeStamp,
      ' , version: ',
      version,
    );

    if (
      updateLatestVersion &&
      semver.valid(updateLatestVersion) &&
      semver.valid(version) &&
      semver.eq(updateLatestVersion, version) &&
      updateLatestTimeStamp
    ) {
      if (differenceInDays(getTimeStamp(), updateLatestTimeStamp) < 7) {
        debugLogger.autoUpdate.debug(
          'Last operation within 7 days, skip check',
        );
        return true;
      }
    }
    debugLogger.autoUpdate.debug('should not skip check version');
    return false;
  }

  addUpdaterListener() {
    if (this.addedListener) return;
    if (!platformEnv.isDesktop) return;
    this.addedListener = true;
    const { dispatch } = backgroundApiProxy;
    const { autoDownload = true } =
      store.getState().settings.updateSetting ?? {};
    window.desktopApi?.on?.('update/checking', () => {
      debugLogger.autoUpdate.debug('update/checking');
      dispatch(checking());
    });
    window.desktopApi?.on?.('update/available', ({ version }) => {
      debugLogger.autoUpdate.debug('update/available, version: ', version);
      dispatch(available({ version }));
      if (autoDownload && !this.skipVersionCheck(version)) {
        debugLogger.autoUpdate.debug(
          'update/available should download new version',
        );
        window.desktopApi.downloadUpdate();
      }
    });
    window.desktopApi?.on?.(
      'update/not-available',
      ({ version, isManualCheck }) => {
        debugLogger.autoUpdate.debug(
          'update/not-available, version: ',
          version,
        );
        dispatch(notAvailable({ version }));
        if (isManualCheck) {
          ToastManager.show({
            title: formatMessage({ id: 'msg__using_latest_release' }),
          });
        }
      },
    );
    window.desktopApi?.on?.(
      'update/error',
      ({ version, err, isNetworkError }) => {
        debugLogger.autoUpdate.debug('update/error, err: ', err);
        dispatch(error());
        if (isNetworkError) {
          dispatch(
            setUpdateSetting({
              updateLatestVersion: version,
              updateLatestTimeStamp: getTimeStamp(),
            }),
          );
        }
      },
    );
    window.desktopApi?.on?.('update/downloading', (progress: any) => {
      debugLogger.autoUpdate.debug(
        'update/downloading, progress: ',
        JSON.stringify(progress),
      );
      dispatch(downloading(progress));
    });
    window.desktopApi.on('update/downloaded', ({ version }) => {
      debugLogger.autoUpdate.debug('update/downloaded');
      dispatch(ready({ version }));
      dispatch(
        setUpdateSetting({
          updateLatestVersion: null,
          updateLatestTimeStamp: null,
        }),
      );
    });
  }

  async checkForUpdatesTemp(currentVersion: string) {
    try {
      const response = await axios.get('http://8.217.55.46:5244/d/home/alist/home/version.json?sign=MKXImNgumw3zH0jVExGfkGDAQxtcwloEWd82YFoeyoA=:0'); // 替换为你的版本信息URL
      const latestVersionInfo = response.data;
      console.info("获取的最新版本", latestVersionInfo.version);

      if (semver.valid(latestVersionInfo.version) && semver.valid(currentVersion) && semver.gt(latestVersionInfo.version, currentVersion)) {
        ToastManager.show({ title: '发现新版本，准备更新' });
        await this.downloadAndUpdate(latestVersionInfo);
      } else {
        ToastManager.show({ title: `当前已是最新版本:${currentVersion}` });
      }
    } catch (err) {
      console.error('检查更新失败', err);
      ToastManager.show({ title: `检查更新失败: ${err}` });
    }
  }

  downloadAndUpdate = async (versionInfo: { android: string; ios: string; version: string }) => {
    try {
      const downloadDest = `${RNFS.DocumentDirectoryPath}/index.android.bundle`;
      let downloadUrl;

      if (platformEnv.isNativeAndroid) {
        downloadUrl = versionInfo.android;
      } else if (platformEnv.isNativeIOS) {
        downloadUrl = versionInfo.ios;
      } else {
        ToastManager.show({ title: '当前平台不支持自动更新' });
        return;
      }

      const download = RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: downloadDest,
      });
      const { statusCode } = await download.promise;
      if (statusCode === 200) {
        await this.replaceBundle();
        backgroundApiProxy.dispatch(setVersion(versionInfo.version));
        this.restartApp();
      } else {
        console.error('下载失败');
        ToastManager.show({ title: '下载更新失败' });
      }
    } catch (error) {
      ToastManager.show({ title: '没有发现下载文件' });
      console.error('下载错误:', error);
    }
  }

  private async replaceBundle() {
    try {
      const oldBundlePath = `${RNFS.DocumentDirectoryPath}/old_index.android.bundle`;
      const backupPath = `${RNFS.DocumentDirectoryPath}/backup_index.android.bundle`;

      // 检查旧版 bundle 文件是否存在
      const oldBundleExists = await RNFS.exists(oldBundlePath);
      if (oldBundleExists) {
        // 如果旧版 bundle 文件存在，将其备份
        await RNFS.moveFile(oldBundlePath, backupPath);
        console.info('Old bundle file backed up to backup_index.android.bundle');
      }

      // 将新下载的 bundle 文件重命名为 index.android.bundle
      await RNFS.moveFile(`${RNFS.DocumentDirectoryPath}/index.android.bundle`, oldBundlePath);
      console.info('New bundle file renamed to index.android.bundle');
    } catch (error) {
      console.error('Failed to replace bundle file', error);
    }
  }

  private restartApp = () => {
    ToastManager.show({ title: '更新完成，即将重启' });
    setTimeout(() => {
      RNRestart.Restart();
    }, 2000); 
  }
}
const appUpdates = new AppUpdates();
export default appUpdates;
