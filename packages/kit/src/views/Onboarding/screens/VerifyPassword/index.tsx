import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Button, Modal, ToastManager } from '@onekeyhq/components';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { IOnboardingRoutesParams } from '../../routes/types';
import { EOnboardingRoutes } from '../../routes/enums';
import Protected, { ValidationFields } from '../../../../components/Protected';
import LayoutContainer from '../../Layout';
import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';

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
  const { walletId} = route.params;
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const handleProtectedSubmit = useCallback(async (password: string) => {
    try {
      const mnemonic = await backgroundApiProxy.engine.revealHDWalletMnemonic(walletId, password);
      if (!mnemonic?.length) {
        ToastManager.show({
          title: 'mnemonic parse error',
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
        title: 'mnemonic parse error',
      });
    }
  }, [walletId, navigation]);

  const modalContent = useMemo(
    () => (
      <Modal
        footer={null}
        hideBackButton={false}
        headerShown={false}
      >
        <Protected
          isAutoHeight
          hideTitle
          walletId={null}
          skipSavePassword
          field={ValidationFields.Secret}
        >
          {(password) => {
            handleProtectedSubmit(password);
            return null;  // 这里可以返回一些 UI 元素，如果需要的话
          }}
        </Protected>
      </Modal>
    ),
    [handleProtectedSubmit],
  );

  return <LayoutContainer>{modalContent}</LayoutContainer>;
};

export default VerifyPassword;
