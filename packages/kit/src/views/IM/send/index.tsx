import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  ScrollView,
  useSafeAreaInsets,
  Text,
  IconButton,
  Button,
  Spinner,
  Image,
  ToastManager,
  useTheme,
} from '@onekeyhq/components';
import { useActiveWalletAccount, useAppSelector, useManageNetworks, useNavigation } from '../../../hooks';
import { TextInput, View, StyleSheet, SafeAreaView } from 'react-native';
import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';
import { createRedEnvelope, generateUnique8DigitNumber, getRedEnvelope, ExpiredRedEnvelope } from '../../../utils/RedEnvelope';
import { EIP1559Fee, Network } from '@onekeyhq/engine/src/types/network';
import { sendRedPackageRecord } from '../../../utils/IMDataUtil';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';
import NetworkSelector from '../send/NetworkSelector';
import CurrenciesSelector from '../send/CurrenciesSelector';
import { isBRC20Token } from '@onekeyhq/shared/src/utils/tokenUtils';
import { Token } from '@onekeyhq/engine/src/types/token';

import red_E_amount from '../red_E_amount.png';
import red_E_number from '../red_E_number.png';
import { RootRoutes } from '../../../routes/routesEnum';

type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.SendRedPackage
>;
export const getBalanceKey = (token?: Partial<Token> | null) => {
  if (!token) {
    return '';
  }
  const { sendAddress } = token;
  const tokenAddress = token.tokenIdOnNetwork ?? token.address;
  if (!tokenAddress) {
    return 'main';
  }

  if (isBRC20Token(tokenAddress)) {
    return tokenAddress;
  }

  if (sendAddress) {
    return `${tokenAddress}--${sendAddress}`;
  }
  return tokenAddress;
};
// 发红包界面
const SendRedEnvelopesScreen = () => {
  const intl = useIntl();
  const navigation = useNavigation();
  const { walletId, networkId, accountId } = useActiveWalletAccount();
  const route = useRoute<RouteProps>(); // 使用 useRoute 获取路由参数
  const { imserver_id, peerID, peerType } = route.params || {}; // 获取 imserver_id 参数
  const { themeVariant } = useTheme(); // 获取当前主题


  // 根据主题设置颜色
  const themeColors = {
    light: {
      backgroundView: "white",
      backgroundBox: 'rgba(1, 136, 138, 0.05)',
      text: 'rgba(0,0,0,0.5)',
      inputText: 'black',
      button: 'rgba(57, 209, 81, 1)',
      buttonDisabled: '#42818A',
    },
    dark: {
      backgroundView: "rgba(19,19,26,1)",
      backgroundBox: 'rgba(255, 255, 255, 0.05)',
      text: 'rgba(255,255,255,0.5)',
      inputText: 'white',
      button: 'rgba(100, 200, 100, 1)',
      buttonDisabled: '#818A81',
    },
  };

  const colors = themeColors[themeVariant];

  console.log("themeVariant   ", themeVariant);

  //获取支持的全部网络
  const data = useManageNetworks({ allowSelectAllNetworks: true }).enabledNetworks;
  const evmNetworks = data.filter(network => network.impl === 'evm');

  const [selectedNetwork, setSelectedNetwork] = useState<string>(evmNetworks[0]?.id || '');
  const { engine, serviceGas } = backgroundApiProxy;
  const [privateKey, setPrivateKey] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // 新增状态来存储输入的金额
  const [message, setMessage] = useState<string>(''); // 新增状态来存储红包留言
  const [persons, setPersons] = useState<string>(''); // 新增状态来存储红包的个数，默认为1
  const [gas, setGas] = useState<string | EIP1559Fee>(''); // 新增状态来存储gas非
  const [loading, setLoading] = useState(false); // 新增状态来控制 loading
  const [disabled, setDisabled] = useState(false); // 新增状态来控制禁用状态
  const [token, setToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);

  // 使用 useSelector 钩子获取代币余额
  const totalValue = useAppSelector(
    (s) => s.tokens.accountTokensBalance?.[networkId]?.[accountId]
  );

  const handleSendRedEnvelope = () => {
    if (parseFloat(amount) <= 0 || amount === "") {
      console.log(" 不能发送红包 ")
      return;
    }
    // 跳转到密码验证界面
    navigation.navigate(RootRoutes.Onboarding, {
      screen: EOnboardingRoutes.VerifyPassword_red,
      params: {
        walletId,
        networkId,
        accountId,
        onPasswordVerified: () => {
          // 密码验证成功后，继续发送红包请求
          sendRedEnvelope();
        },
      },
    });
  };

  const sendRedEnvelope = async () => {
    const passwordNum = generateUnique8DigitNumber();

    const network = evmNetworks.find(net => net.id === selectedNetwork);
    const selectedCurrency = token;
    const address = selectedCurrency ? selectedCurrency.address : undefined;
    if (network) {
      console.log('发送红包', { network: selectedNetwork, currency: selectedCurrency, amount });
      try {
        if (peerID === undefined || peerType === undefined) {
          return;
        }
        setLoading(true); // 显示 loading
        setDisabled(true); // 禁用所有按钮和输入框
        if (persons === '' || parseFloat(amount) < 1 || persons === undefined) {
          setPersons('1');
        }
        let personsInt = Math.floor(parseFloat(persons));
        if (isNaN(personsInt)) {
          personsInt = 1;
        }
        const result = await createRedEnvelope(passwordNum + "", amount, personsInt, network.rpcURL, privateKey, gas, network.id);
        console.log("result   ", result)
        if (result.success) {
          let redEnvelopeInfo = {
            password: result.password,
            redEnvelopeId: result.redEnvelopeId,
            amount: parseFloat(amount),
            persons: personsInt,
            chainLogo: network.logoURI,
            tokenLogo: selectedCurrency?.logoURI,
            networkId: network.id,
            chainName: network.name,
          };

          const recordResult = await sendRedPackageRecord(
            message != '' ? message : network.name,
            token?.symbol as string,
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
              route.params.onRedEnvelopeSent(network.name, result.redEnvelopeId, '测试手气红包');
            }
            navigation.goBack();
          }
        }
        else {
          ToastManager.show({
            title: result.error,
          });
        }
      } catch (error) {
        console.error('Error sending red envelope:', error);
        ToastManager.show({
          title: intl.formatMessage({ id: 'msg__transaction_failed' }),
        });
      } finally {
        setLoading(false); // 隐藏 loading
        setDisabled(false); // 恢复所有按钮和输入框
      }
    } else {
      console.error('选择的网络不存在于支持的 EVM 网络列表中');
    }
  };

  const handleNetworkChange = async (network: string) => {
    setSelectedNetwork(network);
    const tokens = await engine.getTokens(network, accountId);
    setTokens(tokens);
    setToken(tokens[0] || null);
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
      setTokens(tokens);
      setToken(tokens[0] || null);
    };

    fetchGasInfo();
    fetchPrivateKey();
    fetchTokens();
  }, [selectedNetwork, accountId, engine]);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundView }]}>
      <View style={styles.header}>
        <IconButton
          position="absolute"
          onPress={() => navigation.goBack()}
          top={{ base: `16px`, sm: 8 }}
          left={{ base: 4, sm: 8 }}
          type="plain"
          size="lg"
          name="ArrowLeftOutline"
          circle
          zIndex={9999}
          disabled={disabled}
        />
        <Text style={styles.title}>{intl.formatMessage({ id: 'send_red_envelopes' })}</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <Box style={styles.box}>
          <View style={styles.backgroundBox}>
            <Box bg={colors.backgroundBox} borderRadius="lg" p={1} mb={2}>
              <RedEnvelopeCountSelector
                count={persons}
                setCount={setPersons}
                peerType={peerType}
                disabled={disabled}
                selectedCurrencies={token?.symbol || ''}
                onCurrenciesChange={(symbol) => {
                  const selectedToken = tokens?.find(t => t.symbol === symbol);
                  setToken(selectedToken || null);
                }}
                currencies={tokens?.map(t => ({
                  symbol: t.symbol,
                  name: t.name,
                  logoURI: t.logoURI,
                  address: t.address,
                }))}
                colors={colors} // 确保传递了 colors 对象
              />
            </Box>
            <Box bg={colors.backgroundBox} borderRadius="lg" p={1} mb={2} style={styles.optionBoxBottom}>
              <AmountWithCurrencySelector
                amount={amount}
                setAmount={setAmount}
                disabled={disabled}
                colors={colors} // 确保传递了 colors 对象
              />
            </Box>
            <Text style={{ marginTop: 5, marginBottom: 5, textAlign: 'right', color: 'rgba(66, 129, 138, 1)' }}>
              {intl.formatMessage({ id: 'content__balance' })}: {totalValue?.[getBalanceKey(token)]?.balance ?? 0}
            </Text>
            <Box bg={colors.backgroundBox} borderRadius="lg" p={1} mb={2} style={styles.optionBoxTop}>
              <NetsorksSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={handleNetworkChange}
                networks={evmNetworks}
                disabled={disabled}
                colors={colors} // 确保传递了 colors 对象
              />
            </Box>
            <Box bg={colors.backgroundBox} borderRadius="lg" p={1} mb={2} style={styles.optionBoxBottom}>
              <InputMessage
                message={message}
                setMessage={setMessage}
                disabled={disabled}
                colors={colors} // 确保传递了 colors 对象
              />
            </Box>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              size="lg"
              bg={colors.button}
              borderRadius="lg"
              _text={{ color: 'white', fontSize: 18, fontWeight: 'bold' }} // 设置字体大小和加粗
              onPress={handleSendRedEnvelope}
              isDisabled={loading || disabled}
              _disabled={{ bg: colors.buttonDisabled }}
              style={styles.button}>
              {loading ? <Spinner color="blue" /> : intl.formatMessage({ id: "send_red_envelopes" })}
            </Button>
          </View>
        </Box>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '',
  },
  box: {
    width: '100%',
    maxWidth: 768,
    marginHorizontal: 'auto',
    paddingHorizontal: 10
  },
  backgroundBox: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  buttonContainer: {
    marginTop: 50,
    alignItems: 'stretch',
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  optionBoxBottom: {
    width: '100%',
    height: 60,
    marginBottom: 5,
    marginTop: 20
  },
  optionBoxTop: {
    width: '100%',
    height: 60,
    marginTop: 5,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 30, // 半圆形效果
  },
});

// 红包个数选择组件
const RedEnvelopeCountSelector = ({ count, setCount, peerType, disabled, selectedCurrencies, onCurrenciesChange, currencies, colors }: { count: string, setCount: (count: string) => void, peerType: number | undefined, disabled: boolean, selectedCurrencies: string, onCurrenciesChange: (currency: string) => void, currencies: { symbol: string, name: string, logoURI: string, address: string | undefined }[], colors: { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string } }) => {
  const intl = useIntl();

  const handleCountChange = (value: string) => {
    const regex = /^\d+$/;
    if (regex.test(value) || value === '') {
      setCount(value);
    }
  };

  useEffect(() => {
    if (peerType === 2 || peerType === undefined) {
      setCount('1');
    }
  }, [peerType, count, setCount]);

  if (selectedCurrencies === '' || currencies.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      mb={2}
      p={1}
      borderRadius="lg"
      style={{ marginHorizontal: 15 }}
    >
      <Box
        mt={2}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        style={{ marginBottom: 15 }}
      >
        <Box flexDirection="row" alignItems="center">
          <Image source={red_E_number} style={{ width: 18, height: 20, marginRight: 8 }} />
          <Text fontSize={16} color={colors.text} >{intl.formatMessage({ id: 'asset__tokens' })}</Text>
        </Box>
        <CurrenciesSelector
          selectedCurrencies={selectedCurrencies}
          onCurrenciesChange={onCurrenciesChange}
          currencies={currencies}
          disabled={disabled}
          colors={colors}
        />
      </Box>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
        width="100%"

      >
        <Text fontSize={16} color={colors.text} >{intl.formatMessage({ id: "title_redEnvelope_lucky" })}</Text>
        <Box flexDirection="row" alignItems="center">
          <TextInput
            placeholder="1"
            value={peerType === 2 || peerType === undefined ? '1' : count}
            onChangeText={handleCountChange}
            editable={!(peerType === 2 || peerType === undefined) && !disabled}
            keyboardType="numeric"
            style={[{
              width: 100,
              textAlign: 'right',
              padding: 4,
              color: colors.inputText,
              fontWeight: 'bold',
              fontSize: 16,
            }]}
          />
          <Text fontSize={16} ml={2} color={colors.text} >{intl.formatMessage({ id: "title_piece" })}</Text>
        </Box>
      </Box>
    </Box>
  );
};

// 金额和币种选择组件
const AmountWithCurrencySelector = ({ amount, setAmount, disabled, colors }: { amount: string, setAmount: (amount: string) => void, disabled: boolean, colors: { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string } }) => {
  const intl = useIntl();

  const handleAmountChange = (value: string) => {
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value)) {
      setAmount(value);
    }
  };
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={1}
      borderRadius="lg"
      style={{ marginHorizontal: 15, marginVertical: 8 }}
    >
      <Box flexDirection="row" alignItems="center">
        <Image source={red_E_amount} style={{ width: 18, height: 18, marginRight: 8 }} />
        <Text fontSize={16} color={colors.text}>{intl.formatMessage({ id: 'form__quantity' })}</Text>
      </Box>
      <Box flexDirection="row" alignItems="center">
        <TextInput
          placeholder={intl.formatMessage({ id: 'form__quantity' })}
          placeholderTextColor={colors.text}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          style={[{
            color: colors.inputText,
            fontWeight: amount ? 'bold' : 'normal',
            fontSize: 16, width: 100, textAlign: 'right', padding: 4
          }]}
          editable={!disabled}
        />
      </Box>
    </Box>
  );
};

// 红包留言组件
const InputMessage = ({ message, setMessage, disabled, colors }: { message: string, setMessage: (message: string) => void, disabled: boolean, colors: { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string } }) => {
  const intl = useIntl();

  const handleAmountChange = (value: string) => {
    setMessage(value);
  };
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={1}
      borderRadius="lg"
      style={{ marginHorizontal: 15, marginVertical: 8 }}
    >
      <TextInput
        placeholder={intl.formatMessage({ id: 'title_redEnvelope_message' })}
        placeholderTextColor={colors.text}
        value={message}
        onChangeText={handleAmountChange}
        style={[{
          color: colors.inputText,
          fontWeight: message ? 'bold' : 'normal',
          fontSize: 16, width: "100%", textAlign: 'center', padding: 4
        }]}
        editable={!disabled}
      />
    </Box>
  );
};

const NetsorksSelector = ({ selectedNetwork, onNetworkChange, networks, disabled, colors }: {
  selectedNetwork: string;
  onNetworkChange: (network: string) => void;
  networks: Network[];
  disabled: boolean;
  colors: { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string }
}) => {
  const intl = useIntl();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={1}
      borderRadius="lg"
      style={{ marginHorizontal: 15, marginVertical: 8 }}
    >
      <Text fontSize={16} color={colors.text}>{intl.formatMessage({ id: 'network__network' })}</Text>
      <Box flexDirection="row" alignItems="center">
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onNetworkChange={onNetworkChange}
          networks={networks}
          disabled={disabled}
          colors={colors}
        />
      </Box>
    </Box>
  );
};

export default SendRedEnvelopesScreen;