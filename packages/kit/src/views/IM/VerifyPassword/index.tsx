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
  Typography, // 导入 Text 组件
} from '@onekeyhq/components';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { useIntl } from 'react-intl';
import { appUIEventBus, AppUIEventBusNames } from '@onekeyhq/shared/src/eventBus/appUIEventBus';
import { encodeSensitiveText } from '@onekeyhq/engine/src/secret/encryptors/aes256';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import { Keyboard, Platform } from 'react-native';
import { AccountCredentialType } from '@onekeyhq/engine/src/types/account';
import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { wait } from '../../../utils/helper';
import { EOnboardingRoutes } from '../../Onboarding/routes/enums';
import { IOnboardingRoutesParams } from '../../Onboarding/routes/types';

type NavigationProps = StackNavigationProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.VerifyPassword_red
>;
type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.VerifyPassword_red
>;

const VerifyPasswordRedEnvelopes = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { walletId, networkId, accountId, onPasswordVerified } = route.params;
  const intl = useIntl();
  const isSmall = useIsVerticalLayout();
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const justifyContent = isSmall ? 'space-between' : 'center';
  const py = isSmall ? '16' : undefined;
  const insets = useSafeAreaInsets();

  const showTitle = useCallback(() => { 
    let tit = ''
    tit = intl.formatMessage({
      id: 'Verify_Password',
    });
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
      // 密码验证成功，调用回调函数
      onPasswordVerified();
      navigation.goBack();
    } else {
      setError(
        intl.formatMessage({
          id: 'msg__wrong_password',
          defaultMessage: 'Wrong password.',
        }),
      );
    }
  }, [doUnlockAction, password, intl, onPasswordVerified, navigation]);

  const handleProtectedSubmit = useCallback(async (password: string) => {
    try {
      await onUnlock();
    } catch (error) {
      ToastManager.show({
        title: intl.formatMessage({
          id: 'msg__wrong_password',
          defaultMessage: 'Wrong password.',
        }),
      });
    } finally {
    }
  }, [onUnlock]);

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

export default VerifyPasswordRedEnvelopes;