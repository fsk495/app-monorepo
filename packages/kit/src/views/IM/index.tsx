import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Button } from 'react-native';
import WebView from 'react-native-webview';
import { saveIMData } from '../../utils/IMDataUtil';
import { useActiveWalletAccount } from '../../hooks';
import { useWalletSelectorSectionData } from '../../components/WalletSelector/hooks/useWalletSelectorSectionData';
import { RootRoutes } from '../../routes/routesEnum';
import { EOnboardingRoutes } from '../Onboarding/routes/enums';
import useAppNavigation from '../../hooks/useAppNavigation';
import { Box, ToastManager, Typography } from '@onekeyhq/components';

const ImScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const { walletId, accountAddress, networkId } = useActiveWalletAccount();
  const sectionData = useWalletSelectorSectionData();
  const navigationRoot = useAppNavigation();

  const [imserver_id, SetImserver_id] = useState<number>(0);
  const [imserver_token, SetImserver_token] = useState<string>('');
  const [imserver_url, SetImserver_url] = useState<string>('');
  const [im_id, SetIm_id] = useState<string>('');
  const [im_header, SetImHeader] = useState<string>('IM');

  const sendMessageToWebView = (message: any) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.postMessage(${JSON.stringify(message)}, '*');`);
    }
  };

  const handleRedEnvelopeSent = (chainName: string, redEnvelopeId: string | undefined) => {
    const message = {
      action: 'redEnvelopeSent',
      chainName,
      redEnvelopeId
    };
    sendMessageToWebView(message);
  };

  const handleRedEnvelopeReceived = (redEnvelopeId: string) => {
    const message = {
      action: 'redEnvelopeReceived',
      redEnvelopeId
    };
    sendMessageToWebView(message);
  };

  useEffect(() => {
    const saveIM = async () => {
      let walletName = '';
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
          SetIm_id(result.data.id)
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
    if(im_id)
    {
      const newHeader = `IM(${im_id})`;
      SetImHeader(newHeader);
    }
  }, [im_id])

  const onSendPress = useCallback(() => {
    navigationRoot.navigate(RootRoutes.Onboarding, {
      screen: EOnboardingRoutes.SendRedPackage,
      params: {
        imserver_id: imserver_id,
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
        imserver_id: imserver_id,
        peerID: 0,
        peerType: 2,
        redEnvelopeId: 31,
        onRedEnvelopeReceived: handleRedEnvelopeReceived,
      },
    });
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const { action, ...params } = data;

      if (action === 'imSendRedEnvelope') {
        ToastManager.show({ title: "没有收到imSendRedEnvelope的消息" })
        // navigationRoot.navigate(RootRoutes.Onboarding, {
        //   screen: EOnboardingRoutes.SendRedPackage,
        //   params: {
        //     imserver_id: imserver_id,
        //     peerID: 0,
        //     peerType: 2,
        //     onRedEnvelopeSent: handleRedEnvelopeSent,
        //     ...params,
        //   },
        // });
      } else if (action === 'imReceiveRedEnvelope') {
        ToastManager.show({ title: "没有收到imReceiveRedEnvelope的消息" })
        // navigationRoot.navigate(RootRoutes.Onboarding, {
        //   screen: EOnboardingRoutes.ReceiveRedPackage,
        //   params: {
        //     imserver_id: imserver_id,
        //     peerID: 0,
        //     peerType: 2,
        //     onRedEnvelopeReceived: handleRedEnvelopeReceived,
        //     ...params,
        //   },
        // });
      }else
      {
        ToastManager.show({ title: "没有收到imSendRedEnvelope和imReceiveRedEnvelope的消息" })
      }
    } catch (error) {
      console.error('Error parsing message:', error);
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
          <Typography.PageHeading>
            {im_header}
          </Typography.PageHeading>
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
      {/* <View style={styles.buttonContainer}>
        <Button title="Send Red Package" onPress={onSendPress} />
        <Button title="Receive Red Package" onPress={onReceivePress} />
      </View> */}
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