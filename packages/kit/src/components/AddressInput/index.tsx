import type { ComponentProps, FC } from 'react';
import { useCallback, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Box,
  Divider,
  Icon,
  Pressable,
  Textarea,
  Typography,
} from '@onekeyhq/components';
import { getClipboard } from '@onekeyhq/components/src/utils/ClipboardUtils';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import { useNavigation } from '../../hooks';
import { ModalRoutes, RootRoutes } from '../../routes/routesEnum';
import { gotoScanQrcode } from '../../utils/gotoScanQrcode';
import { parseUriScheme } from '../../utils/uriScheme';
import { AddressBookRoutes } from '../../views/AddressBook/routes';

type AddressInputPlugin = 'paste' | 'contact' | 'scan';

type AddressInputProps = ComponentProps<typeof Textarea> & {
  networkId?: string;
  value?: string;
  onChange?: (address: string) => void;
  onChangeAddressName?: (address: string) => void;
  plugins?: AddressInputPlugin[];
  contactExcludeWalletAccount?: boolean;
  placeholder?: string;
  description?: string;
  addressFilter?: (address: string) => Promise<boolean>;
};

const AddressInput: FC<AddressInputProps> = ({
  value,
  onChange,
  onChangeAddressName,
  plugins = ['paste', 'scan'],
  networkId,
  contactExcludeWalletAccount,
  placeholder,
  description,
  addressFilter,
  ...rest
}) => {
  const intl = useIntl();
  const navigation = useNavigation();
  const [isFocus, setFocus] = useState(false);
  const onChangeValue = useCallback(
    async (text: string, verify: boolean) => {
      if (text !== value) {
        let result = text;
        const uriInfo = parseUriScheme(text);
        if (uriInfo !== false) {
          result = uriInfo.address;
        }
        if (verify && networkId) {
          try {
            await backgroundApiProxy.validator.validateAddress(
              networkId,
              result,
            );
            onChange?.(result);
          } catch (error: any) {
            onChange?.(text);
          }
        } else {
          onChange?.(text);
        }
      }
    },
    [value, networkId, onChange],
  );
  const onPaste = useCallback(async () => {
    const text = await getClipboard();
    onChangeValue?.(text, true);
  }, [onChangeValue]);
  const onScan = useCallback(() => {
    gotoScanQrcode((text) => {
      onChangeValue?.(text, true);
    });
  }, [onChangeValue]);
  const onContacts = useCallback(() => {
    navigation.navigate(RootRoutes.Modal, {
      screen: ModalRoutes.AddressBook,
      params: {
        screen: AddressBookRoutes.PickAddressRoute,
        params: {
          networkId,
          contactExcludeWalletAccount,
          addressFilter,
          onSelected: ({ address, name }) => {
            onChangeValue?.(address, false);
            if (name) {
              onChangeAddressName?.(name);
            }
          },
        },
      },
    });
  }, [
    navigation,
    networkId,
    contactExcludeWalletAccount,
    addressFilter,
    onChangeValue,
    onChangeAddressName,
  ]);

  const onBlur = useCallback(() => {
    setFocus(false);
  }, []);
  return (
    <Box>
      <Box
        w="full"
        borderRadius={12}
        overflow="hidden"
        borderWidth="1"
        borderColor={isFocus ? 'focused-default' : 'border-default'}
      >
        <Textarea
          trimValue
          borderRadius={0}
          w="full"
          value={value}
          onChangeText={onChange}
          placeholder={
            placeholder ||
            intl.formatMessage({
              id: 'form__address_and_domain_placeholder',
            })
          }
          borderWidth="0"
          onFocus={() => {
            setFocus(true);
          }}
          {...rest}
          onBlur={onBlur}
        />
        <Divider />
        <Box display="flex" flexDirection="row" bg="action-secondary-default">
          {plugins.includes('paste') && platformEnv.canGetClipboard ? (
            <Pressable
              flex="1"
              justifyContent="center"
              alignItems="center"
              py="3"
              onPress={onPaste}
              flexDirection="row"
            >
              <Icon size={20} name="ClipboardMini" />
              <Typography.Body2 ml="3">
                {intl.formatMessage({ id: 'action__paste_address' })}
              </Typography.Body2>
            </Pressable>
          ) : null}
          {plugins.includes('contact') ? (
            <Pressable
              flex="1"
              justifyContent="center"
              alignItems="center"
              py="3"
              onPress={onContacts}
              flexDirection="row"
            >
              <Icon size={20} name="BookOpenMini" />
              <Typography.Body2 ml="3">
                {intl.formatMessage({ id: 'title__address_book' })}
              </Typography.Body2>
            </Pressable>
          ) : null}
          {plugins.includes('scan') ? (
            <Pressable
              flex="1"
              justifyContent="center"
              alignItems="center"
              py="3"
              onPress={onScan}
              flexDirection="row"
            >
              <Icon size={20} name="ViewfinderCircleMini" />
              <Typography.Body2 ml="3">
                {intl.formatMessage({ id: 'action__scan' })}
              </Typography.Body2>
            </Pressable>
          ) : null}
        </Box>
      </Box>
      {description && (
        <Typography.Body2 mt="8px" color="text-subdued">
          {description}
        </Typography.Body2>
      )}
    </Box>
  );
};

export default AddressInput;
