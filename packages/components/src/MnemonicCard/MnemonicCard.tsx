import type { FC, ReactNode } from 'react';

import { Box, Pressable, Text, ToastManager } from '@onekeyhq/components';

import { formatMessage } from '../Provider';
import { copyToClipboard } from '../utils/ClipboardUtils';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { setBackedUp } from '@onekeyhq/kit/src/store/reducers/reminderSlice';

const copyMnemonicToClipboard = (walletId:string,networkId:string,text?: string) => {
  if (!text) return;
  copyToClipboard(text);
  backgroundApiProxy.dispatch(setBackedUp({ walletId, networkId }))
  ToastManager.show({ title: formatMessage({ id: 'msg__copied' }) });
};
const MnemonicCard: FC<{
  mnemonic: string;
  walletId: string;
  networkId: string;
}> = ({ mnemonic,walletId,networkId }) => {
  const words = mnemonic.split(' ').filter(Boolean);
  const halfIndex = words.length / 2;
  const leftCol: ReactNode[] = [];
  const rightCol: ReactNode[] = [];
  words.forEach((word, i) => {
    const wordComp = (
      <Box key={i} flexDirection="row" my={1.5}>
        <Text
          typography={{
            sm: 'Body1Strong',
            md: 'Body2Strong',
          }}
          color="text-subdued"
          w="8"
        >
          {i + 1}.
        </Text>
        <Text
          typography={{
            sm: 'Body1Strong',
            md: 'Body2Strong',
          }}
          color="text-default"
        >
          {word}
        </Text>
      </Box>
    );
    if (i < halfIndex) {
      leftCol.push(wordComp);
    } else {
      rightCol.push(wordComp);
    }
  });
  return (
    <Pressable
      px={4}
      py={{ base: 2, md: 2.5 }}
      bg="surface-default"
      _hover={{ bg: 'surface-hovered' }}
      _pressed={{ bg: 'surface-pressed' }}
      shadow="depth.2"
      borderRadius="12"
      flexDirection="row"
      onPress={() => {
        copyMnemonicToClipboard(walletId,networkId,mnemonic);
      }}
    >
      <Box flex={1}>{leftCol}</Box>
      <Box flex={1}>{rightCol}</Box>
    </Pressable>
  );
};

export default MnemonicCard;
