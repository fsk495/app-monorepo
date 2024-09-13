import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import WebView from 'react-native-webview';
import { saveIMData } from '../../utils/IMDataUtil';
import { useActiveWalletAccount } from '../../hooks';
import { useWalletSelectorSectionData } from '../../components/WalletSelector/hooks/useWalletSelectorSectionData';
import { RootRoutes } from '../../routes/routesEnum';
import { EOnboardingRoutes } from '../Onboarding/routes/enums';
import useAppNavigation from '../../hooks/useAppNavigation';
import { Box, ToastManager, Typography, IconButton } from '@onekeyhq/components';
import { useIntl } from 'react-intl';
import { Wallet } from '@onekeyhq/engine/src/types/wallet';
import { isImportedWallet } from '@onekeyhq/shared/src/engine/engineUtils';
import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import { NativeModules } from 'react-native';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { PermissionsManager } = NativeModules;

const ImScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const intl = useIntl();

  const { walletId, accountAddress, networkId, accountId } = useActiveWalletAccount();
  const sectionData = useWalletSelectorSectionData();
  const navigationRoot = useAppNavigation();
  const [imserver_id, SetImserver_id] = useState<number>(0);
  const [imserver_token, SetImserver_token] = useState<string>('');
  const [imserver_url, SetImserver_url] = useState<string>('');
  const [im_id, SetIm_id] = useState<string>('');
  const [im_header, SetImHeader] = useState<string>('NIM');
  const [walletName, SetWalletName] = useState<string>('');

  // const requestPermissions = async () => {
  //   if (Platform.OS === 'android') {
  //     try {
  //       const granted = await PermissionsAndroid.requestMultiple([
  //         PermissionsAndroid.PERMISSIONS.CAMERA,
  //         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //         PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  //       ]);

  //       const cameraGranted =
  //         granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
  //         PermissionsAndroid.RESULTS.GRANTED;
  //       const audioGranted =
  //         granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
  //         PermissionsAndroid.RESULTS.GRANTED;

  //       if (!cameraGranted || !audioGranted) {
  //         ToastManager.show({ title: 'Permissions not granted' });
  //       }
  //     } catch (err) {
  //       console.warn(err);
  //     }
  //   } else if (Platform.OS === 'ios') {
  //     try {
  //       const result = await PermissionsManager.requestPermissions();
  //       console.log('Permissions result:', result);
  //       if (result.camera === false || result.microphone === false || result.photoLibrary === false) {
  //         ToastManager.show({ title: 'Permissions not granted' });
  //       }
  //     } catch (err) {
  //       console.warn(err);
  //     }
  //   }
  // };

  const getRequestPermissions = async (data: any) => {
    let isGranted = false
    // const result = await request(data);
    // if (result !== RESULTS.GRANTED) {
    //   isGranted = false;
    // }
    return isGranted;
  }


  const temprequestPermissions = async (data: any) => {
    // let permissions: string[] = [];
    let isGranted = false;
    switch (data.type) {
      case 'camera':
        // isGranted = await getRequestPermissions(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA);
        // permissions = Platform.select({
        //   ios: [PERMISSIONS.IOS.CAMERA],
        //   android: [PERMISSIONS.ANDROID.CAMERA],
        // });
        break;
      case 'audio':
        // isGranted = await getRequestPermissions(Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO);
        // permissions = Platform.select({
        //   ios: [PERMISSIONS.IOS.MICROPHONE],
        //   android: [PERMISSIONS.ANDROID.RECORD_AUDIO],
        // });
        break;
      case 'storage':
        // permissions = Platform.select({
        //   ios: [PERMISSIONS.IOS.PHOTO_LIBRARY],
        //   android: [
        //     PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        //     PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        //   ],
        // });
        break;
      default:
        ToastManager.show({ title: 'Unknown permission type' });
        return;
    }

    try {

      if (isGranted) {
        webViewRef.current?.postMessage(JSON.stringify({ ...data, value: true }));
      } else {
        ToastManager.show({ title: 'Permissions not granted' });
        webViewRef.current?.postMessage(JSON.stringify({ ...data, value: false }));
      }
    } catch (error) {
      console.warn(error);
      ToastManager.show({ title: 'Error requesting permissions' });
    }
  };


  useEffect(() => {
    const saveIM = async () => {
      let tempWallet: Wallet | undefined;
      sectionData.forEach(section => {
        section.data.forEach(item => {
          if (item.wallet && item.wallet.id === walletId) {
            tempWallet = item.wallet;
          }
        });
      });
      if (tempWallet) {
        try {
          const result = await saveIMData(accountAddress, networkId, accountId, tempWallet);
          console.log('API Response 1111 :', result.data);
          let walletName = '';
          if (isImportedWallet({ walletId })) {
            const tempAccount = await backgroundApiProxy.engine.getAccount(accountId, networkId);
            walletName = tempAccount.name;
          } else {
            walletName = tempWallet.name;
          }
          SetWalletName(walletName);
          SetImserver_id(result.data.imserver_id);
          SetImserver_token(result.data.imserver_token);
          SetIm_id(walletName);
        } catch (error) {
          console.error('Error saving IM data:', error);
        }
      }
    };

    saveIM();
  }, [walletId, accountAddress, networkId, sectionData]);

  useEffect(() => {
    if (imserver_id && imserver_token) {
      const newUrl = `https://test.5wtalk.com/5wtalk/?ThirdLogin&tgid=${imserver_id}&token=${imserver_token}`;
      console.log("imserver_url   1   ", newUrl);
      SetImserver_url(newUrl);
      console.log("imserver_url   2   ", newUrl);
    }
  }, [imserver_id, imserver_token]);

  useEffect(() => {
    if (im_id) {
      const newHeader = `NIM(${im_id})`;
      SetImHeader(newHeader);
    }
  }, [im_id]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const { action, ...params } = data;

      if (action === 'imSendRedEnvelope') {
        console.log("收到imSendRedEnvelope的消息   ", data);
        if (data.peerID && data.peerType) {
          navigationRoot.navigate(RootRoutes.Onboarding, {
            screen: EOnboardingRoutes.SendRedPackage,
            params: {
              imserver_id: imserver_id,
              peerID: data.peerID,
              peerType: data.peerType,
              ...params,
            },
          });
        } else {
          ToastManager.show({ title: intl.formatMessage({ id: 'msg__error_aptso_account_does_not_exist' }) });
        }
      } else if (action === 'imReceiveRedEnvelope') {
        console.log("收到imReceiveRedEnvelope的消息  1 ", data);
        if (data.peerID && data.peerType) {
          navigationRoot.navigate(RootRoutes.Onboarding, {
            screen: EOnboardingRoutes.ReceiveRedPackage,
            params: {
              imserver_id: imserver_id,
              peerID: data.peerID,
              peerType: data.peerType,
              redEnvelopeId: '',
              walletName: walletName,
              ...params,
            },
          });
        } else {
          ToastManager.show({ title: intl.formatMessage({ id: 'msg__error_aptso_account_does_not_exist' }) });
        }
      } else if (action === 'hasPermissions') {
        console.log("收到hasPermissions的消息   ", data);
        temprequestPermissions(data);
      } else if (action === 'requestNecessaryPermissions') {
        console.log("收到requestNecessaryPermissions的消息   ", data);
        temprequestPermissions(data);
      }
      else {
        ToastManager.show({ title: intl.formatMessage({ id: 'msg__unknown_error' }) });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleRefresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={styles.container}>
      <Box px="4" py="3" background="background-default">
        <Box
          flexDirection="row"
          bg="background-default"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography.PageHeading>{im_header}</Typography.PageHeading>
          <IconButton name="ArrowPathOutline" size="lg" type="plain" onPress={handleRefresh} />
        </Box>
      </Box>
      {imserver_url ? (
        <WebView
          ref={webViewRef}
          source={{ uri: imserver_url }}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onMessage={handleMessage}
          cacheEnabled={true}
          style={styles.webview}
        />
      ) : (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    marginTop: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
});

export default ImScreen;