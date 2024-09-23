import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import WebView from 'react-native-webview';
import { saveIMData } from '../../utils/IMDataUtil';
import { useActiveWalletAccount, useNavigation } from '../../hooks';
import { useWalletSelectorSectionData } from '../../components/WalletSelector/hooks/useWalletSelectorSectionData';
import { MainRoutes, RootRoutes, TabRoutes } from '../../routes/routesEnum';
import { EOnboardingRoutes } from '../Onboarding/routes/enums';
import { ToastManager } from '@onekeyhq/components';
import { useIntl } from 'react-intl';
import { Wallet } from '@onekeyhq/engine/src/types/wallet';
import { isImportedWallet } from '@onekeyhq/shared/src/engine/engineUtils';
import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useSelector } from 'react-redux';
import { setPermissios } from '../../store/reducers/IMPermissions';
import { IAppState } from '../../store';
import { Text } from '@onekeyhq/components';

const ImScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const intl = useIntl();

  const { walletId, accountAddress, networkId, accountId } = useActiveWalletAccount();
  const sectionData = useWalletSelectorSectionData();
  const navigationRoot = useNavigation();
  const [imserver_id, SetImserver_id] = useState<number>(0);
  const [imserver_token, SetImserver_token] = useState<string>('');
  const [imserver_url, SetImserver_url] = useState<string>('');
  const [im_id, SetIm_id] = useState<string>('');
  const [im_header, SetImHeader] = useState<string>('NIM');
  const [walletName, SetWalletName] = useState<string>('');
  // 获取 Redux 状态中的权限信息
  const permissionsState = useSelector((state: IAppState) => state.IMPermissions[`${walletId}_${accountId}`]);
  const allowed = permissionsState?.allowed ?? false;

  // 设置导航栏标题和自定义返回按钮
  useEffect(() => {
    navigationRoot.setOptions({
      title: `NIM`,
    });
  }, [navigationRoot,im_id]);

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
          SetIm_id(result.data.id);
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
      const newHeader = `NIM(${walletName})\nID:${im_id}`;
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
    if (allowed) {
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    }
    else {
      showPermissionAlert();
    }
  };

  const showPermissionAlert = () => {
    Alert.alert(
      intl.formatMessage({ id: "form__approval" }),
      intl.formatMessage({ id: "im_authorized" }),
      [
        {
          text: intl.formatMessage({ id: "action__deny" }),
          onPress: () => {
            backgroundApiProxy.dispatch(setPermissios({ walletId: `${walletId}_${accountId}`, allowed: false }));
            setLoading(false);
          },
          style: 'cancel',
        },
        {
          text: intl.formatMessage({ id: "action__allow" }),
          onPress: () => {
            backgroundApiProxy.dispatch(setPermissios({ walletId: `${walletId}_${accountId}`, allowed: true }));
            setLoading(true)
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (imserver_url && !allowed) {
      showPermissionAlert();
    }
  }, [imserver_url, allowed]);

  return (
    <View style={styles.container}>
      {(allowed && imserver_url) ? (
        <WebView
          ref={webViewRef}
          source={{ uri: imserver_url }}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onMessage={handleMessage}
          cacheEnabled={true}
          mediaPlaybackRequiresUserAction={true}
          javaScriptEnabled={true}
          style={styles.webview}
          allowsInlineMediaPlayback
        />
      ) : (
        <View style={styles.permissionPrompt}>
          <Text style={styles.permissionText}>{intl.formatMessage({ id: "im_authorized" })}</Text>
          <TouchableOpacity onPress={showPermissionAlert}>
            <Text style={styles.permissionButton}>{intl.formatMessage({ id: "form__approval" })}</Text>
          </TouchableOpacity>
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
  permissionPrompt: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#000',
  },
  permissionButton: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
  },
  backButton: {
    marginLeft: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default ImScreen;