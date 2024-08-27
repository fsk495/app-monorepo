import { FC, useCallback } from 'react';
import {
  Box,
  Button,
  ToastManager,
  useIsVerticalLayout,
  Text,
  Image,
  ZStack,
  Center,
  QRCode,
  Spinner,
  IconButton, // 导入 IconButton 组件
  Typography, // 导入 Typography 组件
} from '@onekeyhq/components';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { IOnboardingRoutesParams } from '../../routes/types';
import { EOnboardingRoutes } from '../../routes/enums';
import { useIntl } from 'react-intl';
import { useNavigation } from '../../../../hooks';
import { copyToClipboard } from '@onekeyhq/components/src/utils/ClipboardUtils';
import BlurQRCode from '@onekeyhq/kit/assets/blur-qrcode.png';
import QrcodeLogo from '@onekeyhq/kit/assets/qrcode_logo.png';
import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { setBackedUp } from '../../../../store/reducers/reminderSlice';

type NavigationProps = StackNavigationProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.PrivateOrPublicKeyPreview
>;
type RouteProps = RouteProp<
  IOnboardingRoutesParams,
  EOnboardingRoutes.PrivateOrPublicKeyPreview
>;

type ISize = { base: number; md: number };
export const QRLoadingView: FC<{
  qrCodeContainerSize: ISize;
}> = ({ qrCodeContainerSize }) => (
  <ZStack w={qrCodeContainerSize} h={qrCodeContainerSize}>
    <Image
      borderRadius="24px"
      source={BlurQRCode}
      w={qrCodeContainerSize}
      h={qrCodeContainerSize}
    />
    <Center w="100%" h="100%">
      <Spinner />
    </Center>
  </ZStack>
);

const PrivateOrPublicKeyPreview = () => {
    const route = useRoute<RouteProps>();
    const { privateOrPublicKey, qrCodeContainerSize,walletId, networkId } = route.params;
    const intl = useIntl();
    const navigation = useNavigation<NavigationProps>();
    const isSmallScreen = useIsVerticalLayout();
    const copyDataToClipboard = useCallback(() => {
        copyToClipboard(privateOrPublicKey ?? '');
        backgroundApiProxy.dispatch(setBackedUp({ walletId, networkId }))
        ToastManager.show({ title: intl.formatMessage({ id: 'msg__copied' }) });
    }, [privateOrPublicKey, intl]);

  return (
    <Box flex="1" bg="background-default">
      <Box
        flexDirection="row"
        alignItems="center"
        px="4"
        py="3"
        borderBottomWidth="1"
        borderBottomColor="border-subdued"
      >
        <IconButton
          name="ArrowLeftOutline"
          onPress={() => navigation.goBack()}
          size="lg"
          type="plain"
          circle
        />
        <Typography.Heading ml="3">
          {intl.formatMessage({ id: 'content_show_private_key' })}
        </Typography.Heading>
      </Box>
      <Box flex="1" justifyContent="center" alignItems="center" p="4">
        <Box
          minH={qrCodeContainerSize}
          alignItems="center"
          flexDirection="column"
        >
          {privateOrPublicKey ? (
            <Box
              borderRadius="24px"
              bgColor="#FFFFFF"
              p={isSmallScreen ? '16px' : '11px'}
              shadow="depth.4"
            >
              {!!privateOrPublicKey && (
                <QRCode
                  value={privateOrPublicKey}
                  logo={QrcodeLogo}
                  size={isSmallScreen ? 264 : 186}
                  logoSize={isSmallScreen ? 57 : 40}
                  logoMargin={isSmallScreen ? 4 : 2}
                  logoBackgroundColor="white"
                />
              )}
            </Box>
          ) : (
            <QRLoadingView qrCodeContainerSize={qrCodeContainerSize} />
          )}
        </Box>
        <Box
          alignItems="center"
          mt={isSmallScreen ? '32px' : '24px'}
          px={isSmallScreen ? '24px' : '32px'}
        >
          <Text
            color="text-subdued"
            textAlign="center"
            typography={{ sm: 'Body1', md: 'Body2' }}
            w="full"
            maxW="full"
          >
            {privateOrPublicKey}
          </Text>
          <Button
            width={isSmallScreen ? '188px' : '154px'}
            height={isSmallScreen ? '48px' : '36px'}
            mt={isSmallScreen ? '32px' : '24px'}
            type="plain"
            size={isSmallScreen ? 'xl' : 'base'}
            leftIconName="Square2StackMini"
            onPress={copyDataToClipboard}
            isLoading={!privateOrPublicKey}
          >
            {intl.formatMessage({
              id: 'action__copy',
            })}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PrivateOrPublicKeyPreview;