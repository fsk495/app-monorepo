import { useEffect } from 'react';

import { Box, ToastManager, useProviderValue } from '@onekeyhq/components';
import { setMainScreenDom } from '@onekeyhq/components/src/utils/SelectAutoHide';

import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { NetworkAccountSelectorEffectsSingleton } from '../../../components/NetworkAccountSelector/hooks/useAccountSelectorEffects';
import { WalletSelectorEffectsSingleton } from '../../../components/WalletSelector/hooks/useWalletSelectorEffects';
import { available, enable } from '../../../store/reducers/autoUpdater';
import { createLazyComponent } from '../../../utils/createLazyComponent';
import appUpdates from '../../../utils/updates/AppUpdates';
import { useSelector } from 'react-redux';
import { VersionState } from '../../../store/reducers/versionSlice';
import { IAppState } from '../../../store';

const UpdateAlert = createLazyComponent(
  () => import('../../../views/Update/Alert'),
);

const Drawer = createLazyComponent(() => import('./Drawer'));

function MainScreen() {
  const { dispatch } = backgroundApiProxy;

  const { reduxReady } = useProviderValue();
  const currentVersion = useSelector((state: IAppState) => state.version.version) || '4.23.0'; // 默认版本号

  useEffect(() => {
    const loadFile = async()=>{
      console.log("开始更新    ",currentVersion);
      await appUpdates.checkForUpdatesTemp(currentVersion);
    }
    loadFile();
    // if (reduxReady) {
    //   appUpdates.addUpdaterListener();
    //   appUpdates
    //     .checkUpdate()
    //     ?.then((versionInfo) => {
    //       if (versionInfo) {
    //         dispatch(enable(), available(versionInfo));
    //       }
    //     })
    //     .catch();
    // }
  }, [dispatch, reduxReady,currentVersion]);

  return (
    <Box ref={setMainScreenDom} w="full" h="full">
      <Drawer />
      <NetworkAccountSelectorEffectsSingleton />
      <WalletSelectorEffectsSingleton />
      {/* TODO Waiting notification component */}
      {/* 检测是否是最新版 */}
      {/* <UpdateAlert /> */}
    </Box>
  );
}

export default MainScreen;
