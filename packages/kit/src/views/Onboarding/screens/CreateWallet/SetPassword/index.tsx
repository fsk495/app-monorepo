import { memo, useEffect, useMemo } from 'react';

import { useNavigation } from '@react-navigation/core';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { useIntl } from 'react-intl';

import { Center, Dialog, Spinner } from '@onekeyhq/components';

import backgroundApiProxy from '../../../../../background/instance/backgroundApiProxy';
import Protected, {
  ValidationFields,
} from '../../../../../components/Protected';
import { useData } from '../../../../../hooks/redux';
import useAppNavigation from '../../../../../hooks/useAppNavigation';
import { wait } from '../../../../../utils/helper';
import { showDialog } from '../../../../../utils/overlayUtils';
import Layout from '../../../Layout';
import { EOnboardingRoutes } from '../../../routes/enums';
import { type IOnboardingRoutesParams } from '../../../routes/types';

import SecondaryContent from './SecondaryContent';

type NavigationProps = StackNavigationProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.SetPassword
>;
type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.SetPassword
>;

function RecoveryPhraseDialog({
  onNext,
  onClose,
}: {
  onNext?: () => void;
  onClose?: () => void;
}) {
  const intl = useIntl();
  const navigation = useAppNavigation();

  return (
    <Dialog
      visible
      contentProps={{
        iconType: 'info',
        title: intl.formatMessage({
          id: 'modal__youre_importing_a_hot_wallet',
        }),
        content: intl.formatMessage({
          id: 'modal__youre_importing_a_hot_wallet_desc',
        }),
      }}
      footerButtonProps={{
        secondaryActionProps: {
          size: 'xl',
        },
        primaryActionProps: {
          size: 'xl',
          type: 'primary',
          children: intl.formatMessage({ id: 'action__confirm' }),
        },
        onPrimaryActionPress: () => {
          onClose?.();
          onNext?.();
        },
        onSecondaryActionPress() {
          onClose?.();
          navigation.goBack();
        },
      }}
    />
  );
}

function RedirectToRecoveryPhrase({
  password,
  withEnableAuthentication,
  importedMnemonic,
  nickname, // 传递昵称
}: {
  password: string;
  withEnableAuthentication?: boolean;
  importedMnemonic?: string;
  nickname?: string; // 添加昵称 prop
}) {
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    function importedMnemonicFunc(mnemonic: string) {
      const t = setTimeout(() => {
        showDialog(
          <RecoveryPhraseDialog
            onNext={() => {
              navigation.replace(EOnboardingRoutes.BehindTheScene, {
                password,
                mnemonic,
                name: nickname, // 传递昵称
                withEnableAuthentication,
              });
            }}
          />,
        );
      }, 600);
      return () => clearTimeout(t);
    }
    async function generateMnemonicFunc() {
      const mnemonic = await backgroundApiProxy.engine.generateMnemonic();
      await wait(600);
      navigation.replace(EOnboardingRoutes.BehindTheScene, {
        password,
        mnemonic,
        name: nickname, // 传递昵称
        withEnableAuthentication,
      });
    }
    function main() {
      if (importedMnemonic) {
        return importedMnemonicFunc(importedMnemonic);
      }
      generateMnemonicFunc();
    }
    return main();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Center h="full" w="full">
      <Spinner size="lg" />
    </Center>
  );
}

const RedirectToRecoveryPhraseMemo = memo(RedirectToRecoveryPhrase);

const SetPassword = () => {
  const intl = useIntl();
  const { isPasswordSet } = useData();
  const route = useRoute<RouteProps>();
  const mnemonic = route.params?.mnemonic;
  const disableAnimation = route?.params?.disableAnimation;

  const title = useMemo(
    () =>
      isPasswordSet
        ? intl.formatMessage({
            id: 'Verify_Password',
          })
        : intl.formatMessage({ id: 'title__set_password' }),
    [intl, isPasswordSet],
  );
  const subTitle = useMemo(
    () =>
      isPasswordSet
        ? intl.formatMessage({
            id: 'Verify_password_to_continue',
          })
        : undefined,
    [intl, isPasswordSet],
  );

  return (
    <Layout
      // make sure Spinner display
      fullHeight
      disableAnimation={disableAnimation}
      title={title}
      subTitle={subTitle}
      secondaryContent={
        isPasswordSet ? <SecondaryContent /> : <SecondaryContent />
      }
    >
      <Protected
        isAutoHeight
        hideTitle
        walletId={null}
        skipSavePassword
        field={ValidationFields.Wallet}
      >
        {(password, { withEnableAuthentication }, nickname) => (
          <RedirectToRecoveryPhraseMemo
            password={password}
            withEnableAuthentication={withEnableAuthentication}
            importedMnemonic={mnemonic}
            nickname={nickname} // 传递昵称
          />
        )}
      </Protected>
    </Layout>
  );
};

export default SetPassword;