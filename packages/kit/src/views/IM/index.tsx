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
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

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

  const getRequestPermissions = async (data: any) => {
    const result = await check(data);
    if (result === RESULTS.GRANTED) {
      console.log('Audio permission already granted');
      return true;
    } else {
      const status = await request(data);
      if (status === RESULTS.GRANTED) {
        console.log('Audio permission granted');
        return true;
      } else {
        console.log('Audio permission denied');
        return false;
      }
    }
  };

  const temprequestPermissions = async (data: any) => {
    let params = {
      ...data,
      value: false,
    };
    switch (data.type) {
      case 'video':
        params.value = await getRequestPermissions(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA);
        break;
      case 'audio':
        params.value = await getRequestPermissions(Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO);
        break;
      case 'storage':
        if (Platform.OS === 'android') {
          params.value = await getRequestPermissions(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
          if (params.value) {
            params.value = await getRequestPermissions(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
          }
        } else {
          params.value = await getRequestPermissions(PERMISSIONS.IOS.PHOTO_LIBRARY);
        }
        break;
      default:
        ToastManager.show({ title: 'Unknown permission type' });
        return;
    }
    console.log("返回给IM的数据   ", params);
    webViewRef.current?.postMessage(JSON.stringify(params));
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
      } else if (action === 'hasPermissions' || action === 'requestNecessaryPermissions') {
        console.log("收到hasPermissions的消息   ", data);
        temprequestPermissions(data);
      } else {
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

  const handleShouldStartLoadWithRequest = (event: any) => {
    const { url } = event;
    console.log("url   ", url);
    console.log("event   ", event);
    if (url.includes('requestPermissions')) {
      const permissionType = url.split('requestPermissions=')[1];
      temprequestPermissions({ type: permissionType });
      return false; // 阻止 WebView 加载请求
    }
    console.log("允许   ",);
    return true; // 允许 WebView 加载请求
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
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          mediaPlaybackRequiresUserAction={true}
          javaScriptEnabled={true}
          style={styles.webview}
          allowsInlineMediaPlayback
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