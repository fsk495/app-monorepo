import { useIntl } from 'react-intl';
import { Box, ScrollView, useSafeAreaInsets, Text, IconButton, Button, Spinner, Image, ToastManager } from '@onekeyhq/components';
import { useState, useEffect } from 'react';
import { useActiveWalletAccount, useManageNetworks, useNavigation } from '../../../hooks';
import NetworkSelector from './NetworkSelector';
import CurrenciesSelector from './CurrenciesSelector';
import { TextInput, View, StyleSheet } from 'react-native';
import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';
import { createRedEnvelope, generateUnique8DigitNumber, getRedEnvelope, ExpiredRedEnvelope } from '../../../utils/RedEnvelope';
import { EIP1559Fee } from '@onekeyhq/engine/src/types/network';
import { sendRedPackageRecord } from '../../../utils/IMDataUtil';

import { type RouteProp, useRoute } from '@react-navigation/native';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';

import redEnvelopes from '@onekeyhq/kit/assets/keytag/introduction.png';

interface NetworkCurrenciesMap {
  [key: string]: { symbol: string, name: string, logoURI: string, address: string | undefined }[];
}

type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.SendRedPackage
>;

// 发红包界面
const SendRedEnvelopesScreen = () => {
  const inset = useSafeAreaInsets();
  const intl = useIntl();
  const navigation = useNavigation();
  const { walletId, accountAddress, networkId, accountId } = useActiveWalletAccount();
  const route = useRoute<RouteProps>(); // 使用 useRoute 获取路由参数
  const { imserver_id, peerID, peerType } = route.params || {}; // 获取 imserver_id 参数

  //获取支持的全部网络
  const data = useManageNetworks({ allowSelectAllNetworks: true }).enabledNetworks;
  const evmNetworks = data.filter(network => network.impl === 'evm');

  const [selectedNetwork, setSelectedNetwork] = useState<string>(evmNetworks[0]?.id || '');
  const [selectedCurrencies, setSelectedCurrencies] = useState('');
  const { engine, serviceGas } = backgroundApiProxy;
  const [privateKey, setPrivateKey] = useState<string>('');
  const [networkCurrenciesMap, setNetworkCurrenciesMap] = useState<NetworkCurrenciesMap>({});
  const [amount, setAmount] = useState<string>(''); // 新增状态来存储输入的金额
  const [persons, setPersons] = useState<string>('1'); // 新增状态来存储红包的个数，默认为1
  const [gas, setGas] = useState<string | EIP1559Fee>(''); // 新增状态来存储gas非
  const [loading, setLoading] = useState(false); // 新增状态来控制 loading

  const handleSendRedEnvelope = async () => {
    const passwordNum = generateUnique8DigitNumber();

    const network = evmNetworks.find(net => net.id === selectedNetwork);
    const selectedCurrency = networkCurrenciesMap[selectedNetwork].find(currency => currency.symbol === selectedCurrencies);
    const address = selectedCurrency ? selectedCurrency.address : undefined;
    if (network) {
      console.log('发送红包', { network: selectedNetwork, currency: selectedCurrencies, amount });
      try {
        if (parseFloat(persons) < 1) {
          return;
        }
        if (peerID === undefined || peerType === undefined) {
          return;
        }
        setLoading(true); // 显示 loading

        const personsInt = Math.floor(parseFloat(persons));
        const result = await createRedEnvelope(passwordNum + "", amount, personsInt, network.rpcURL, privateKey, gas);
        console.log("result  ", result);
        if (result.success) {
          console.log("result.password   ", result.password);
          console.log("result.redEnvelopeId   ", result.redEnvelopeId);
          let redEnvelopeInfo = {
            password: result.password,
            redEnvelopeId: result.redEnvelopeId,
            amount: parseFloat(amount),
            persons: personsInt,
            chainLogo: network.logoURI,
            tokenLogo: selectedCurrency?.logoURI,
            networkId: network.id,
          };

          const recordResult = await sendRedPackageRecord(
            network.name,
            selectedCurrencies,
            address,
            result.redEnvelopeId,
            imserver_id as number,
            parseFloat(amount),
            personsInt,
            peerID,
            peerType,
            JSON.stringify(redEnvelopeInfo)
          );
          console.log("recordResult   ", recordResult);
          if (recordResult.code == 200) {
            if (route.params.onRedEnvelopeSent) {
              route.params.onRedEnvelopeSent(network.name, result.redEnvelopeId);
            }
            navigation.goBack();
          }
        }
        else
        {
          ToastManager.show({
            title: result.error,
          });
        }
      } catch (error) {
        console.error('Error sending red envelope:', error);
        ToastManager.show({
          title: intl.formatMessage({ id: 'msg__unknown_error' }),
        });
      } finally {
        setLoading(false); // 隐藏 loading
      }
    } else {
      console.error('选择的网络不存在于支持的 EVM 网络列表中');
    }
  };

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
  };

  useEffect(() => {
    const fetchPrivateKey = async () => {
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

    const fetchGasInfo = async () => {
      const resp = await serviceGas.getGasInfo({
        networkId: selectedNetwork,
      });

      if (resp.prices.length === 5) {
        resp.prices = [resp.prices[0], resp.prices[2], resp.prices[4]];
      }
      setGas(resp.prices[1]);
    }

    const fetchTokens = async () => {
      const tokens = await engine.getTokens(selectedNetwork, accountId);
      console.log("tokens  ", tokens)
      const tokenDetails = tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        logoURI: token.logoURI,
        address: token.address
      }));
      setNetworkCurrenciesMap(prev => ({
        ...prev,
        [selectedNetwork]: tokenDetails,
      }));
      setSelectedCurrencies(tokenDetails[0]?.symbol || '');
    };
    fetchGasInfo();
    fetchPrivateKey();
    fetchTokens();
  }, [selectedNetwork, accountId, engine]);
  console.log("redEnvelopes  ",redEnvelopes)
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
        <Text style={styles.title}>{intl.formatMessage({ id: 'send_red_envelopes' })}</Text>
      </View>
      <Box flexDirection="column" alignItems="center" marginTop={5}>
        <Image
          w={200}
          h={298}
          resizeMode="contain"
          source={redEnvelopes}
        />
      </Box>
      <ScrollView style={styles.scrollView}>
        <Box style={styles.box}>
          <View style={styles.backgroundBox}>
          <NetworkSelector
              selectedNetwork={selectedNetwork}
              onNetworkChange={handleNetworkChange}
              networks={evmNetworks}
              // backgroundColor="#E7F6F1"
            />
            <Box style={styles.divider} />
            <CurrenciesSelector
              selectedCurrencies={selectedCurrencies}
              onCurrenciesChange={setSelectedCurrencies}
              currencies={networkCurrenciesMap[selectedNetwork] || []}
              // backgroundColor="#E7F6F1"
            />
            <Box style={styles.divider} />
            <RedEnvelopeCountSelector count={persons} setCount={setPersons} peerType={peerType} />
            <Box style={styles.divider} />
            <TokenAmountSelector amount={amount} setAmount={setAmount} />
          </View>
          <View style={styles.buttonContainer}>
            <Button size="lg" bg="#42818A" borderRadius="lg" _text={{ color: 'white' }} onPress={handleSendRedEnvelope} isDisabled={loading} _disabled={{ bg: '#42818A' }} >
              {loading ? <Spinner color="blue" /> : intl.formatMessage({ id: "send_red_envelopes" })}
            </Button>
          </View>
        </Box>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'background-default',
  },
  box: {
    width: '100%',
    maxWidth: 768,
    marginHorizontal: 'auto',
    paddingHorizontal: 16
  },
  backgroundBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    // padding: 16,
    paddingHorizontal:16,
    paddingTop:16
  },
  divider: {
    height: 1,
    backgroundColor: 'black',
    marginVertical: 0,
  },
  buttonContainer: {
    marginTop: 20, // 增加按钮与上方组件的空间
    alignItems: 'stretch', // 居中对齐按钮
    paddingBottom: 16,
    paddingHorizontal: 16
  },
});

// 红包个数选择组件
const RedEnvelopeCountSelector = ({ count, setCount, peerType }: { count: string, setCount: (count: string) => void, peerType: number | undefined }) => {
  const intl = useIntl();

  const handleCountChange = (value: string) => {
    const numericValue = parseFloat(value);
    if (numericValue >= 1) {
      setCount(Math.floor(numericValue).toString());
    }
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={2}
      // bg="surface-neutral-subdued"
      borderRadius="lg"
    >
      <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'form__quantity' })}</Text>
      <Box flexDirection="row" alignItems="center">
        <TextInput
          placeholder="1"
          value={count}
          onChangeText={handleCountChange}
          editable={!(peerType === 2 || peerType === undefined)}
          keyboardType="numeric"
          style={{ width: 100, textAlign: 'right', padding: 4 }}
        />
        <Text fontSize={16} ml={2}>{intl.formatMessage({ id: "title_piece" })}</Text>
      </Box>
    </Box>
  );
};

// 代币数量选择组件
const TokenAmountSelector = ({ amount, setAmount }: { amount: string, setAmount: (amount: string) => void }) => {
  const intl = useIntl();

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={2}
      // bg="surface-neutral-subdued"
      borderRadius="lg"
    >
      <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'form__amount' })}</Text>
      <Box flexDirection="row" alignItems="center">
        <TextInput
          placeholder={intl.formatMessage({ id: 'form__amount' })}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          style={{ width: 100, textAlign: 'right', padding: 4 }}
        />
      </Box>
    </Box>
  );
};

export default SendRedEnvelopesScreen;