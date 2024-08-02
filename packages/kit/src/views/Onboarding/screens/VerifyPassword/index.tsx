import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  Button,
  Center,
  Form,
  KeyboardDismissView,
  Modal,
  ToastManager,
  useIsVerticalLayout,
  KeyboardAvoidingView,
  IconButton,
  Icon,
  useSafeAreaInsets,
} from '@onekeyhq/components';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { IOnboardingRoutesParams } from '../../routes/types';
import { EOnboardingRoutes } from '../../routes/enums';
import Protected, { ValidationFields } from '../../../../components/Protected';
import LayoutContainer from '../../Layout';
import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { useIntl } from 'react-intl';
import { appUIEventBus, AppUIEventBusNames } from '@onekeyhq/shared/src/eventBus/appUIEventBus';
import { encodeSensitiveText } from '@onekeyhq/engine/src/secret/encryptors/aes256';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import { wait } from '../../../../utils/helper';
import { Keyboard, Platform } from 'react-native';
import AppStateUnlockButton from '../../../../components/AppLock/AppStateUnlockButton';

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
  const { walletId } = route.params;
  const intl = useIntl();
  const isSmall = useIsVerticalLayout();
  const [password, setPassword] = useState('');
  const [err, setError] = useState('');
  const justifyContent = isSmall ? 'space-between' : 'center';
  const py = isSmall ? '16' : undefined;
  const insets = useSafeAreaInsets();
  const [mnemonic, setMnemonic] = useState<string | null>(null);

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

  const onOk = useCallback(
    (pw: string) => {
      doUnlockAction(pw);
    },
    [doUnlockAction],
  );

  const handleProtectedSubmit = useCallback(async (password: string) => {
    try {
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
        fromVerifyPassword: true,
      });
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
              <Box mt="8">
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
              {/* <Center mt="8">
                <AppStateUnlockButton onOk={onOk} />
              </Center> */}
            </Box>
          </Box>
        </Center>
      </KeyboardDismissView>
    </KeyboardAvoidingView>
  );
};

export default VerifyPassword;