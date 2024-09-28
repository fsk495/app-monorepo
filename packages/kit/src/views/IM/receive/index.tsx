import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Modal, Dimensions, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';
import { Box, IconButton, useSafeAreaInsets, ToastManager, Image, Typography } from '@onekeyhq/components';
import { getRedPackageInfo, recevieRedPackageRecord } from '../../../utils/IMDataUtil';
import { useIntl } from 'react-intl';
import { ExpiredRedEnvelope, getLeftMoney, getRedEnvelope } from '../../../utils/RedEnvelope';
import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';
import { EIP1559Fee } from '@onekeyhq/engine/src/types/network';
import { useActiveWalletAccount } from '../../../hooks';
import { useTheme } from '@onekeyhq/components';
import Svg, { Path } from 'react-native-svg';

type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.ReceiveRedPackage
>;

interface ReciveHbListItem {
  hb_id: string;
  imserver_id: number;
  money: number;
  peerID: number;
  peerType: number;
  nike_name: string;
  icon: string;
  create_date: string;
}

interface RedEnvelopeInfo {
  chain_name: string;
  coin: string;
  coin_address: string | null;
  create_date: string;
  hb_id: string;
  id: number;
  imserver_id: number;
  is_delete: boolean;
  is_timeout: boolean;
  json: string;
  money: number;
  num: number;
  peerID: number;
  peerType: number;
  recive_hb_list: ReciveHbListItem[];
  update_date: string;
}

interface jsonProps {
  password: string;
  redEnvelopeId: string;
  amount: number;
  persons: number;
  chainLogo: string;
  tokenLogo: string;
  networkId: string;
  chainName: string;
}

const { width } = Dimensions.get('window');
const height = width / 2;

const ReceiveRedEnvelopesScreen = () => {
  const route = useRoute<RouteProps>();
  const { accountId } = useActiveWalletAccount();
  let { imserver_id, peerID, peerType, redEnvelopeId, walletName } = route.params || {};
  const inset = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const intl = useIntl();
  const [redEnvelopeInfo, setRedEnvelopeInfo] = useState<RedEnvelopeInfo | null>(null);
  const [jsonData, setJsonData] = useState<jsonProps | null>(null);
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const { engine, serviceGas } = backgroundApiProxy;
  const [privateKey, setPrivateKey] = useState<string>('');
  const [gas, setGas] = useState<string | EIP1559Fee>('');

  const [receive_count, setReceiveCount] = useState<string | EIP1559Fee>('0'); 

  const { themeVariant } = useTheme();

  const themeColors = {
    light: {
      text: 'rgba(0,0,0,0.5)',
      inputText: 'black',
      backgroundBox: 'rgba(1, 136, 138, 0.05)',
    },
    dark: {
      text: 'rgba(255,255,255,0.5)',
      inputText: 'white',
      backgroundBox: 'rgba(255, 255, 255, 0.05)',
    },
  };

  const colors = themeColors[themeVariant];

  // 截取时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    const fetchRedEnvelopeInfo = async () => {
      try {
        const response = await getRedPackageInfo(redEnvelopeId + "");
        if (response && response.data && response.data.length > 0) {
          const info = response.data[0];
          setRedEnvelopeInfo(info);
          if (info.json) {
            const parsedJson = JSON.parse(info.json);
            setJsonData({
              password: parsedJson.password,
              redEnvelopeId: parsedJson.redEnvelopeId,
              amount: parseFloat(parsedJson.amount),
              persons: parsedJson.persons,
              chainLogo: parsedJson.chainLogo,
              tokenLogo: parsedJson.tokenLogo,
              networkId: parsedJson.networkId,
              chainName: parsedJson.chainName
            });
            setPassword(parsedJson.password);
            setNetworkId(parsedJson.networkId);
          }
        } else {
          ToastManager.show({
            title: intl.formatMessage({ id: 'msg__wrong_network' }),
          });
        }
      } catch (err) {
        ToastManager.show({
          title: intl.formatMessage({ id: 'msg__wrong_network' }),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRedEnvelopeInfo();
  }, [redEnvelopeId]);

  useEffect(() => {
    if (jsonData?.networkId) {
      fetchGasInfo(jsonData.networkId);
    }
  }, [jsonData]);

  useEffect(() => {
    fetchPrivateKey(accountId);
  }, [accountId]);

  useEffect(() => {
    if (redEnvelopeInfo && jsonData && privateKey && gas) {
      if (redEnvelopeInfo.recive_hb_list.length < redEnvelopeInfo.num && !redEnvelopeInfo.is_timeout) {
        const hasUserReceived = redEnvelopeInfo.recive_hb_list.some(item => item.imserver_id === imserver_id);
        if (!hasUserReceived) {
          receiveRedEnvelopes();
        }
      } else if (redEnvelopeInfo.is_timeout) {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_expired' }) });
        if (redEnvelopeInfo.imserver_id === imserver_id) {
          ExpiredRedEnvelopes();
        }
      }
    }
  }, [redEnvelopeInfo, jsonData, privateKey, gas]);

  //更新自己获得的代币金额
  useEffect(() => { 
    if(redEnvelopeInfo)
    {
      if (redEnvelopeInfo.recive_hb_list.length > 0)
      {
        for (let i = 0; i < redEnvelopeInfo.recive_hb_list.length; i++)
        {
          let item = redEnvelopeInfo.recive_hb_list[i];
          //自己抢到过红包
          if(item.imserver_id === imserver_id)
          {
            setReceiveCount(`${item.money}`);
          }
        }
      }
    }
  }, [redEnvelopeInfo, imserver_id])


  const fetchPrivateKey = async (accountId: string) => {
    const password: string | undefined = await backgroundApiProxy.servicePassword.getPassword();
    if (password) {
      const credentialType = AccountCredentialType.PrivateKey;
      try {
        const $privateKey = await engine.getAccountPrivateKey({ accountId, credentialType, password });
        setPrivateKey($privateKey);
      } catch (error) {
        console.error('Error fetching private key:', error);
      }
    }
  }

  const fetchGasInfo = async (networkId: string) => {
    const resp = await serviceGas.getGasInfo({ networkId });
    if (resp.prices.length === 5) {
      resp.prices = [resp.prices[0], resp.prices[2], resp.prices[4]];
    }
    setGas(resp.prices[1]);
  }

  const receiveRedEnvelopes = async () => {
    setLoading(true);
    try {
      let tempRedEnvelopeId = redEnvelopeId as number;
      let network = await backgroundApiProxy.engine.getNetwork(networkId);
      ToastManager.show({ title: '正在打开红包' });//intl.formatMessage({ id: 'title_redEnvelope_opening' }) });
      const response = await getRedEnvelope(tempRedEnvelopeId, password, network.rpcURL, privateKey, gas, jsonData?.networkId as string);
      if (response?.success) {
        if(response?.amount)
        {
          setReceiveCount(response?.amount)
        }
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_success' }) });
        const responseReceive = await recevieRedPackageRecord(tempRedEnvelopeId.toString(), imserver_id as number, parseFloat(response?.amount), walletName, peerID as number, peerType as number);
        if (responseReceive.code === 200) {
          const updatedResponse = await getRedPackageInfo(redEnvelopeId + "");
          if (updatedResponse && updatedResponse.data && updatedResponse.data.length > 0) {
            setRedEnvelopeInfo(updatedResponse.data[0]);

            ToastManager.show({ title: `${response?.amount} ${redEnvelopeInfo?.coin} 已存入您的钱包` });
          }
        }
      } else {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_failed' }) });
      }
    } catch (error) {
      console.error("领取红包失败:", error);
    } finally {
      setLoading(false);
    }
  }

  const ExpiredRedEnvelopes = async () => {
    setLoading(true);
    try {
      let tempRedEnvelopeId = redEnvelopeId as number;
      let network = await backgroundApiProxy.engine.getNetwork(networkId);
      const responseLeftMonkey = await getLeftMoney(tempRedEnvelopeId, network.rpcURL, privateKey, jsonData?.networkId as string);
      if (parseFloat(responseLeftMonkey) === 0) {
        return;
      }
      const response = await ExpiredRedEnvelope(tempRedEnvelopeId, network.rpcURL, privateKey, gas, jsonData?.networkId as string);
      if (response?.success) {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_return' }) });
        navigation.goBack();
      }
    } catch (error) {
      console.error("领取过期红包失败:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  };

  const handleScrollViewContentSizeChange = (width: number, height: number) => {
    if (contentHeight > 0) {
      const maxHeight = contentHeight - 200;
      setScrollViewHeight(Math.min(height + 10, maxHeight));
    }
  };

  useEffect(() => {
    if (contentHeight > 0) {
      handleScrollViewContentSizeChange(0, contentHeight);
    }
  }, [contentHeight]);

  if (!redEnvelopeInfo) {
    return (
      <View style={styles.container}>
        <Typography.Body1 color={colors.text}>{"暂无红包"}</Typography.Body1>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundBox, paddingTop: inset.top }]}>
        <IconButton
          position="absolute"
          onPress={() => navigation.goBack()}
          top={{ base: `${inset.top + 16}px`, sm: 8 }}
          left={{ base: 4, sm: 8 }}
          type="plain"
          size="lg"
          name="ArrowLeftOutline"
          circle
          zIndex={9999}
        />
        <Typography.DisplayLarge style={styles.title}>{intl.formatMessage({ id: 'receive_red_envelopes' })}</Typography.DisplayLarge>
      </View>
      <Box
        width='100%'
        height={50}
        bgColor={colors.backgroundBox}
      ></Box>
      <View style={styles.ellipseContainer}>
        <Svg height={height} width={width}>
          <Path
            d={`M 0 ${0} A ${width / 2} ${width / 4} 0 0 0 ${width} ${0}`}
            fill={colors.backgroundBox}
          />
        </Svg>
        <Box
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={styles.ellipseTextContainer}
        >
          <Box flexDirection="row" alignItems="center" justifyContent="center" flexWrap="wrap">
            <Typography.Body1 fontSize={30} fontWeight="bold" color={colors.inputText} lineHeight={32}>{receive_count} {redEnvelopeInfo.coin}</Typography.Body1>
          </Box>
          <Typography.Body1 fontSize={14} color={colors.text}>{intl.formatMessage({ id: 'title_redEnvelope_getChain' })}</Typography.Body1>
        </Box>
      </View>
      <Typography.Body1 style={[styles.infoText, styles.centeredText]} color={colors.text}>{intl.formatMessage({ id: 'form__quantity' })}: {redEnvelopeInfo.recive_hb_list.length}/{redEnvelopeInfo.num}</Typography.Body1>
      <View style={styles.content} onLayout={handleContentLayout}>
        <View style={styles.moduleContainer}>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={2}
            borderRadius="lg"
            style={styles.optionBoxBottom}
            bgColor={colors.backgroundBox}
          >
            <Typography.Body1 fontSize={16} color={colors.text}>{intl.formatMessage({ id: 'network__network' })}</Typography.Body1>
            <Box flexDirection="row" alignItems="center" padding={2}>
              <Image
                source={{ uri: jsonData?.chainLogo }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <Typography.Body1 fontSize={16} fontWeight={600} color={colors.inputText}>{jsonData?.chainName}</Typography.Body1>
            </Box>
          </Box>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={2}
            borderRadius="lg"
            style={styles.optionBoxBottom}
            bgColor={colors.backgroundBox}
          >
            <Typography.Body1 fontSize={16} color={colors.text}>{intl.formatMessage({ id: 'asset__tokens' })}</Typography.Body1>
            <Box flexDirection="row" alignItems="center" padding={2}>
              <Image
                source={{ uri: jsonData?.tokenLogo }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <Typography.Body1 fontSize={16} fontWeight={600} color={colors.inputText}>{redEnvelopeInfo.coin}</Typography.Body1>
            </Box>
          </Box>
          {redEnvelopeInfo.recive_hb_list.length > 0 && (
            <ScrollView
              style={[styles.reciveHbList, { backgroundColor: colors.backgroundBox, height: scrollViewHeight }]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={handleScrollViewContentSizeChange}
            >
              {redEnvelopeInfo.recive_hb_list.map((item, index) => (
                <View key={index}>
                  <View style={styles.reciveHbListItem}>
                    <Box flexDirection="row" alignItems="center" borderRadius="12">
                      <Image
                        source={{ uri: item.icon }}
                        style={{ width: 50, height: 50, marginRight: 8, borderRadius: 10 }}
                      />
                      <Box
                        flexDirection="column"
                        alignItems="flex-start" // 左对齐
                        justifyContent="center"
                      >
                        <Typography.Body1 style={styles.reciveHbListItemNameText} color={colors.inputText}>{item.nike_name}</Typography.Body1>
                        <Typography.Body1 fontSize={12} color={colors.text}>{formatTime(item.create_date)}</Typography.Body1>
                      </Box>

                    </Box>
                    <Typography.Body1 style={styles.reciveHbListItemText} color={colors.inputText}>{item.money} {redEnvelopeInfo.coin}</Typography.Body1>
                  </View>
                  {index < redEnvelopeInfo.recive_hb_list.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <Modal
        transparent={true}
        animationType="none"
        visible={loading}
        onRequestClose={() => { }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 768,
    paddingBottom: 20,
  },
  moduleContainer: {
    width: '100%',
    borderRadius: 10,
    paddingHorizontal: 16,
    padding: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  centeredText: {
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 5,
    marginHorizontal: 20,
  },
  reciveHbList: {
    width: '100%',
    paddingVertical: 10,
    alignSelf: 'center',
    flexGrow: 1,
  },
  reciveHbListItem: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 18,
    marginVertical: 5,
  },
  reciveHbListItemNameText: {
    fontSize: 16,
    fontWeight: 'normal'
  },
  reciveHbListItemText: {
    fontSize: 14,
    fontWeight: '600'
  },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#00000040'
  },
  activityIndicatorWrapper: {
    backgroundColor: 'transparent',
    height: 100,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  optionBoxBottom: {
    width: '100%',
    height: 60,
    marginBottom: 10,
  },
  ellipseContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
    marginBottom: 25
  },
  ellipseTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReceiveRedEnvelopesScreen;