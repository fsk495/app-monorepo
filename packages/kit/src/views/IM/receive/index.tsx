import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Modal,  } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';
import { Box, IconButton, useSafeAreaInsets, Text, ToastManager,Image } from '@onekeyhq/components';
import { getRedPackageInfo, recevieRedPackageRecord } from '../../../utils/IMDataUtil';
import { useIntl } from 'react-intl';
import { ExpiredRedEnvelope, getLeftMoney, getRedEnvelope } from '../../../utils/RedEnvelope';
import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';
import { EIP1559Fee } from '@onekeyhq/engine/src/types/network';
import { useActiveWalletAccount } from '../../../hooks';
import redEnvelopes from '../redEnvelopes.png';
import { ImageKey, imageMap } from '@onekeyhq/shared/src/utils/emojiUtils';

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
}

const ReceiveRedEnvelopesScreen = () => {
  const route = useRoute<RouteProps>(); // 使用 useRoute 获取路由参数
  const { accountId } = useActiveWalletAccount();
  let { imserver_id, peerID, peerType, redEnvelopeId, walletName } = route.params || {}; // 获取 imserver_id 参数
  const inset = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const intl = useIntl();
  const [redEnvelopeInfo, setRedEnvelopeInfo] = useState<RedEnvelopeInfo | null>(null);
  const [jsonData, setJsonData] = useState<jsonProps | null>(null);
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [networkId, setNetworkId] = useState('');

  const { engine, serviceGas } = backgroundApiProxy;
  const [privateKey, setPrivateKey] = useState<string>('');
  const [gas, setGas] = useState<string | EIP1559Fee>(''); // 新增状态来存储gas非

  useEffect(() => {
    const fetchRedEnvelopeInfo = async () => {
      try {
        const response = await getRedPackageInfo(redEnvelopeId + "");
        if (response && response.data && response.data.length > 0) {
          console.log("response.data  ", response.data);
          const info = response.data[0];
          setRedEnvelopeInfo(info);
          if (info.json) {
            const parsedJson = JSON.parse(info.json);
            console.log("parsedJson  ", parsedJson);
            setJsonData({
              password: parsedJson.password,
              redEnvelopeId: parsedJson.redEnvelopeId,
              amount: parseFloat(parsedJson.amount),
              persons: parsedJson.persons,
              chainLogo: parsedJson.chainLogo,
              tokenLogo: parsedJson.tokenLogo,
              networkId: parsedJson.networkId,
            });

            setPassword(parsedJson.password);
            setNetworkId(parsedJson.networkId);
            console.log('networkId     ', parsedJson.networkId);
          }
        } else {
          ToastManager.show({
            title: intl.formatMessage({ id: 'msg__unknown_error' }),
          });
          console.log("没有找到服务信息  ");
        }
      } catch (err) {
        console.log("fetchRedEnvelopeInfo err:  ", err);
        ToastManager.show({
          title: intl.formatMessage({ id: 'msg__unknown_error' }),
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
        // 检查用户是否已经领取过红包
        const hasUserReceived = redEnvelopeInfo.recive_hb_list.some(item => item.imserver_id === imserver_id);
        if (!hasUserReceived) {
          receiveRedEnvelopes();
        }
      }
      else if (redEnvelopeInfo.is_timeout) {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_expired' }) });
        if (redEnvelopeInfo.imserver_id === imserver_id) {
          ExpiredRedEnvelopes();
        }
      }
    }
  }, [redEnvelopeInfo, jsonData, privateKey, gas]);

  const fetchPrivateKey = async (accountId: string) => {
    const password: string | undefined = await backgroundApiProxy.servicePassword.getPassword();
    if (password) {
      const credentialType = AccountCredentialType.PrivateKey;
      try {
        const $privateKey = await engine.getAccountPrivateKey({ accountId, credentialType, password });
        setPrivateKey($privateKey);
        console.log("privateKey    ", $privateKey);
      } catch (error) {
        console.error('Error fetching private key:', error);
      }
    }
  }

  const fetchGasInfo = async (networkId: string) => {
    const resp = await serviceGas.getGasInfo({
      networkId: networkId,
    });

    if (resp.prices.length === 5) {
      resp.prices = [resp.prices[0], resp.prices[2], resp.prices[4]];
    }
    setGas(resp.prices[1]);
  }

  const receiveRedEnvelopes = async () => {
    setLoading(true); // 开始领取红包时显示loading动画
    try {
      let tempRedEnvelopeId = redEnvelopeId as number;
      
      let network = await backgroundApiProxy.engine.getNetwork(networkId);
      const responseLeftMonkey = await getLeftMoney(tempRedEnvelopeId, network.rpcURL, privateKey);
      console.log("responseLeftMonkey   ",parseFloat(responseLeftMonkey));
      // return;
      const response = await getRedEnvelope(tempRedEnvelopeId, password, network.rpcURL, privateKey, gas);
      //领取红包成功
      if (response?.success) {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_success' }) });
        const responseReceive = await recevieRedPackageRecord(tempRedEnvelopeId.toString(), imserver_id as number, parseFloat(response?.amount), walletName, peerID as number, peerType as number);
        console.log("领取红包成功  ");
        // 重新获取红包信息，刷新显示的数据
        if (responseReceive.code === 200) {
          const updatedResponse = await getRedPackageInfo(redEnvelopeId + "");
          if (updatedResponse && updatedResponse.data && updatedResponse.data.length > 0) {
            setRedEnvelopeInfo(updatedResponse.data[0]);
          }
        }
      }
      else {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_failed' }) });
      }
    } catch (error) {
      console.error("领取红包失败:", error);
    } finally {
      setLoading(false); // 领取完成后隐藏loading动画
    }
  }

  const ExpiredRedEnvelopes = async () => {
    setLoading(true); // 开始领取红包时显示loading动画
    try {
      let tempRedEnvelopeId = redEnvelopeId as number;
      console.log("领取过期红包");
      let network = await backgroundApiProxy.engine.getNetwork(networkId);
      const responseLeftMonkey = await getLeftMoney(tempRedEnvelopeId, network.rpcURL, privateKey);
      if (parseFloat(responseLeftMonkey) === 0) {
        console.log("过期红包已经领取过了");
        return;
      }
      const response = await ExpiredRedEnvelope(tempRedEnvelopeId, network.rpcURL, privateKey, gas);
      //领取红包成功
      if (response?.success) {
        ToastManager.show({ title: intl.formatMessage({ id: 'title_redEnvelope_return' }) });
        navigation.goBack();
      }
    } catch (error) {
      console.error("领取过期红包失败:", error);
    } finally {
      setLoading(false); // 领取完成后隐藏loading动画
    }
  }

  if (!redEnvelopeInfo) {
    return (
      <View style={styles.container}>
        <Text>{"暂无红包"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        <Text style={styles.title}>{intl.formatMessage({ id: 'receive_red_envelopes' })}</Text>
      </View>
      <Box flexDirection="column" alignItems="center" marginTop={5}>
        <Image
          w={312}
          h={218}
          resizeMode="contain"
          source={redEnvelopes}
        />
      </Box>

      <Text style={[styles.infoText, styles.centeredText]}>{intl.formatMessage({ id: 'form__quantity' })}: {redEnvelopeInfo.recive_hb_list.length}/{redEnvelopeInfo.num}</Text>
      <View style={styles.content}>
        <View style={styles.moduleContainer}>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={2}
            borderRadius="lg"
          >
            <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'network__network' })}</Text>
            <Box flexDirection="row" alignItems="center" bgColor={'#E7F6F1'} padding={2}>
              <Image
                source={{ uri: jsonData?.chainLogo }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <Text fontSize={16} fontWeight="bold">{redEnvelopeInfo.chain_name}</Text>
            </Box>
          </Box>
          <View style={styles.divider} />
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={2}
            borderRadius="lg"
          >
            <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'asset__tokens' })}</Text>
            <Box flexDirection="row" alignItems="center" bgColor={'#E7F6F1'} padding={2}>
              <Image
                source={{ uri: jsonData?.tokenLogo }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <Text fontSize={16} fontWeight="bold">{redEnvelopeInfo.coin}</Text>
            </Box>
          </Box>
          <View style={styles.divider} />
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
            p={1}
            borderRadius="lg"
          >
            <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'form__amount' })}</Text>
            <Box flexDirection="row" alignItems="center">
              <Text fontSize={16} fontWeight="bold">{redEnvelopeInfo.money} {redEnvelopeInfo.coin}</Text>
            </Box>
          </Box>
        </View>
        {redEnvelopeInfo.recive_hb_list.length > 0 && (
          <ScrollView style={styles.reciveHbList}>
            {redEnvelopeInfo.recive_hb_list.map((item, index) => (
              <View key={index}>
                <View style={styles.reciveHbListItem}>
                  <Box flexDirection="row" alignItems="center" borderRadius="12">
                    <Image
                      source={imageMap[(item.icon ?? '1.png') as ImageKey]}
                      style={{ width: 24, height: 24, marginRight: 8 }}
                    />
                    <Text style={styles.reciveHbListItemText}>{item.nike_name}</Text>
                  </Box>
                  <Text style={styles.reciveHbListItemText}>{item.money} {redEnvelopeInfo.coin}</Text>
                </View>
                {index < redEnvelopeInfo.recive_hb_list.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Loading Modal */}
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
    marginHorizontal: 'auto',
    paddingHorizontal: 16
  },
  moduleContainer: {
    width: '90%', // 调整宽度
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 16,
    padding: 10,
    marginBottom: 10,
    alignSelf: 'center', // 居中对齐
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
    backgroundColor: 'black',
    marginVertical: 10,
  },
  reciveHbList: {
    width: '90%', // 调整宽度
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    marginBottom: 20,
    alignSelf: 'center', // 居中对齐
    flexGrow: 1, // 确保内容可以滚动
  },
  reciveHbListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    marginBottom: 10,
    borderRadius: 5,
  },
  reciveHbListItemText: {
    fontSize: 16,
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
  }
});

export default ReceiveRedEnvelopesScreen;