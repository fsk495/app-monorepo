import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Button } from 'react-native';
// import WebView from 'react-native-webview';
import { saveIMData } from '../../utils/IMDataUtil';
import { useActiveWalletAccount } from '../../hooks';
import { useWalletSelectorSectionData } from '../../components/WalletSelector/hooks/useWalletSelectorSectionData';
import { RootRoutes } from '../../routes/routesEnum';
import { EOnboardingRoutes } from '../Onboarding/routes/enums';
import useAppNavigation from '../../hooks/useAppNavigation';

import WebView from 'react-native-webview';

const ImScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const { walletId, accountAddress, networkId } = useActiveWalletAccount();
  const sectionData = useWalletSelectorSectionData();
  const navigationRoot = useAppNavigation();

  const [imserver_id, SetImserver_id] = useState<number>(0);
  const [imserver_token, SetImserver_token] = useState<string>('');
  const [imserver_url, SetImserver_url] = useState<string>('');


  const sendMessageToWebView = (message: any) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.postMessage(${JSON.stringify(message)}, '*');`);
    }
  };

  // 定义发红包回调函数
  const handleRedEnvelopeSent = (chainName: string, redEnvelopeId: string | undefined) => {
    const message = {
      action: 'redEnvelopeSent',
      chainName,
      redEnvelopeId
    };
    sendMessageToWebView(message);
  };

  // 定义发红包回调函数
  const handleRedEnvelopeReceived = (redEnvelopeId: string) => {
    const message = {
      action: 'redEnvelopeReceived',
      redEnvelopeId
    };
    sendMessageToWebView(message);
  };


  useEffect(() => {
    const saveIM = async () => {
      let walletName = ''; // 初始化 walletName 变量
      sectionData.forEach(section => {
        section.data.forEach(item => {
          if (item.wallet && item.wallet.id === walletId) {
            walletName = item.wallet.name;
          }
        });
      });
      if (walletName) {
        try {
          const result = await saveIMData(walletId, accountAddress, networkId, walletName);
          console.log('API Response 1111 :', result.data);
          SetImserver_id(result.data.imserver_id);
          SetImserver_token(result.data.imserver_token);
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


  const onSendPress = useCallback(() => {
    navigationRoot.navigate(RootRoutes.Onboarding, {
      screen: EOnboardingRoutes.SendRedPackage,
      params: {
        imserver_id: imserver_id, // 传递 imserver_id
        peerID: 0,
        peerType: 2,
        onRedEnvelopeSent: handleRedEnvelopeSent,
      },
    });
  }, [imserver_id]);

  const onReceivePress = useCallback(() => {
    navigationRoot.navigate(RootRoutes.Onboarding, {
      screen: EOnboardingRoutes.ReceiveRedPackage,
      params: {
        imserver_id: imserver_id, // 传递 imserver_id
        peerID: 0,
        peerType: 2,
        redEnvelopeId: 31,
        onRedEnvelopeReceived: handleRedEnvelopeReceived,
      },
    });
  }, []);

  // 添加接收消息的处理程序
  const handleMessage = (event: any) => {
    const { type, data } = JSON.parse(event.nativeEvent.data);
    if (type === 'example') {
      // Alert.alert('Message from WebView', data);
    }
  };
  return (
    <View style={styles.container}>
      {imserver_url ? (
        <WebView
          onWebViewRef={webViewRef}
          source={{ uri: imserver_url }}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onMessage={handleMessage} // 添加 onMessage 处理程序
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
      <View style={styles.buttonContainer}>
        <Button title="Send Red Package" onPress={onSendPress} />
        <Button title="Receive Red Package" onPress={onReceivePress} />
      </View>
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
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});

export default React.memo(ImScreen);