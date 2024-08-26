import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';
import { Box, IconButton, useSafeAreaInsets, Text, Image, ToastManager } from '@onekeyhq/components';
import { getRedPackageInfo } from '../../../utils/IMDataUtil';
import { useIntl } from 'react-intl';
import redEnvelopes from '@onekeyhq/kit/assets/keytag/introduction.png';

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
  const { imserver_id, peerID, peerType, redEnvelopeId } = route.params || {}; // 获取 imserver_id 参数
  const inset = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const intl = useIntl();
  const [redEnvelopeInfo, setRedEnvelopeInfo] = useState<RedEnvelopeInfo | null>(null);
  const [jsonData, setJsonData] = useState<jsonProps | null>(null);
  const navigation = useNavigation();

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
            setJsonData({
              password: parsedJson.password,
              redEnvelopeId: parsedJson.redEnvelopeId,
              amount: parseFloat(parsedJson.amount),
              persons: parsedJson.persons,
              chainLogo: parsedJson.chainLogo,
              tokenLogo: parsedJson.tokenLogo,
              networkId: parsedJson.networkId,
            });
          }
          if (response.data.recive_hb_list.length < response.data.num) {
            //钱包还没有领完 领取钱包

          }
        } else {
          ToastManager.show({
            title: intl.formatMessage({ id: 'msg__unknown_error' }),
          });
          console.log("Invalid response from server  ");
        }
      } catch (err) {
        console.log("fetchRedEnvelopeInfo err:  ", err);
        ToastManager.show({
          title: 'Failed to fetch red envelope info',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRedEnvelopeInfo();
  }, [redEnvelopeId]);

  const handleClaimRedEnvelope = () => {
    // 处理领取红包的逻辑
    console.log('Claim Red Envelope');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!redEnvelopeInfo) {
    return (
      <View style={styles.container}>
        <Text>{"暂无红包"}</Text>
      </View>
    );
  }

  // 添加测试数据
  if (redEnvelopeInfo.recive_hb_list.length === 0) {
    redEnvelopeInfo.recive_hb_list = [
      { hb_id: '1', imserver_id: 1, money: 10, peerID: 1, peerType: 1, nike_name: 'User1' },
      { hb_id: '2', imserver_id: 2, money: 20, peerID: 2, peerType: 2, nike_name: 'User2' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
      { hb_id: '3', imserver_id: 3, money: 30, peerID: 3, peerType: 3, nike_name: 'User3' },
    ];
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
          w={200}
          h={298}
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
                  <Text style={styles.reciveHbListItemText}>{item.nike_name}</Text>
                  <Text style={styles.reciveHbListItemText}>{item.money} {redEnvelopeInfo.coin}</Text>
                </View>
                {index < redEnvelopeInfo.recive_hb_list.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
    paddingTop: 10,
  },
  moduleContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 16,
    padding: 10,
    marginBottom: 10,
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
    marginVertical: 0,
  },
  reciveHbList: {
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    marginBottom:20,
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
});

export default ReceiveRedEnvelopesScreen;