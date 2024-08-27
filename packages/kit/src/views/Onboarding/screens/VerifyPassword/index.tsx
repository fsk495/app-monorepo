import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  Button,
  Center,
  Form,
  KeyboardDismissView,
  ToastManager,
  useIsVerticalLayout,
  KeyboardAvoidingView,
  IconButton,
  useSafeAreaInsets,
  Text,
  Typography, // 导入 Text 组件
} from '@onekeyhq/components';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { IOnboardingRoutesParams } from '../../routes/types';
import { EOnboardingRoutes } from '../../routes/enums';
import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { useIntl } from 'react-intl';
import { appUIEventBus, AppUIEventBusNames } from '@onekeyhq/shared/src/eventBus/appUIEventBus';
import { encodeSensitiveText } from '@onekeyhq/engine/src/secret/encryptors/aes256';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import { wait } from '../../../../utils/helper';
import { Keyboard, Platform } from 'react-native';
import AppStateUnlockButton from '../../../../components/AppLock/AppStateUnlockButton';
import { isHdWallet, isImportedWallet } from '@onekeyhq/shared/src/engine/engineUtils';
import { ModalRoutes, RootRoutes } from '../../../../routes/routesEnum';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';

type NavigationProps = StackNavigationProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.VerifyPassword
>;
type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.VerifyPassword
>;

const VerifyPassword = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { walletId, networkId,accountId } = route.params;
  const intl = useIntl();
  const isSmall = useIsVerticalLayout();
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const justifyContent = isSmall ? 'space-between' : 'center';
  const py = isSmall ? '16' : undefined;
  const insets = useSafeAreaInsets();
  const [, setMnemonic] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | undefined>('');

  const showTitle = useCallback(() => { 
    let tit = ''
    if (isHdWallet({ walletId }))
    {
      tit = intl.formatMessage({
        id: 'title__recovery_phrase',
      })
    }
    else if (isImportedWallet({ walletId }))
    {
      tit = intl.formatMessage({
        id: 'form__private_key',
      })
    }
    return tit;
  }, [walletId])

  const onChangeText = useCallback((text: string) => {
    setPassword(text);
    setError('');
  }, []);

  const doUnlockAction = useCallback(async (pwd: string) => {
    const isOk = await backgroundApiProxy.serviceApp.unlock(pwd);
    if (isOk) {
      appUIEventBus.emit(AppUIEventBusNames.Unlocked);
    }
    return isOk;
  }, []);

  const onUnlock = useCallback(async () => {
    const key =
      await backgroundApiProxy.servicePassword.getBgSensitiveTextEncodeKey();
    const isOk = await doUnlockAction(
      encodeSensitiveText({ key, text: password }),
    );
    if (isOk) {
      if (platformEnv.isNativeAndroid) {
        Keyboard.dismiss();
      }
      await wait(500);
    } else {
      setError(
        intl.formatMessage({
          id: 'msg__wrong_password',
          defaultMessage: 'Wrong password.',
        }),
      );
    }
  }, [doUnlockAction, password, intl]);


  const handleProtectedSubmit = useCallback(async (password: string) => {
    try {
      // 获取助记词
      if(isHdWallet({walletId}))
      {
        const mnemonic = await backgroundApiProxy.engine.revealHDWalletMnemonic(walletId, password);
        if (!mnemonic?.length) {
          ToastManager.show({
            title: intl.formatMessage({
              id: 'msg__wrong_password',
              defaultMessage: 'Wrong password.',
            }),
          });
          return;
        }
        setMnemonic(mnemonic);
        navigation.replace(EOnboardingRoutes.ShowRecoveryPhrase, {
          password,
          mnemonic,
          walletId,
          networkId,
          fromVerifyPassword: true,
        });
      }
      else
      {
        const credentialType = AccountCredentialType.PrivateKey;
        const $privateKey = await backgroundApiProxy.engine.getAccountPrivateKey({ accountId, credentialType, password });
        if (!$privateKey?.length) {
          ToastManager.show({
            title: intl.formatMessage({
              id: 'msg__wrong_password',
              defaultMessage: 'Wrong password.',
            }),
          });
          return;
        }
        setPrivateKey($privateKey);
        console.log("跳转到私钥界面   ",$privateKey);
        navigation.replace(EOnboardingRoutes.PrivateOrPublicKeyPreview, {
          privateOrPublicKey: $privateKey,
          qrCodeContainerSize: { base: 296, md: 208 },
          walletId,
          networkId,
        });
        
      }
    } catch (error) {
      ToastManager.show({
        title: intl.formatMessage({
          id: 'msg__wrong_password',
          defaultMessage: 'Wrong password.',
        }),
      });
    } finally {
    }
  }, [walletId, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <KeyboardDismissView>
        <Center testID="AppStateUnlock" w="full" h="full" bg="background-default">
          <Box
            maxW="96"
            p="8"
            w="full"
            h="full"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent={justifyContent}
            position="relative"
          >
            <IconButton
              position="absolute"
              onPress={() => navigation.goBack()}
              top={{ base: `${insets.top + 16}px`, sm: 8 }}
              left={{ base: 4, sm: 8 }}
              type="plain"
              size="lg"
              name="ArrowLeftOutline"
              circle
              zIndex={9999}
            />
            <Box width="full" py={py}>
              <Box mb="8">
                <Typography.DisplayLarge textAlign="center" mb={2}>
                  {showTitle()}
                </Typography.DisplayLarge>
                <Typography.Body1 textAlign="center" color="text-subdued">
                  {
                    intl.formatMessage({
                      id: 'Verify_password_to_continue',
                    })}
                </Typography.Body1>
                <Form.PasswordInput
                  value={password}
                  onChangeText={onChangeText}
                  // press enter key to submit
                  onSubmitEditing={onUnlock}
                />
                {err ? <Form.FormErrorMessage message={err} /> : null}
                <Button
                  size="xl"
                  isDisabled={!password}
                  type="primary"
                  onPromise={() => handleProtectedSubmit(password)}
                  mt="7"
                >
                  {intl.formatMessage({
                    id: 'action__confirm',
                    defaultMessage: 'Confirm',
                  })}
                </Button>
              </Box>
            </Box>
          </Box>
        </Center>
      </KeyboardDismissView>
    </KeyboardAvoidingView>
  );
};

export default VerifyPassword;