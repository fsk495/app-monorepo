import type { FC } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';

import { useRoute } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import { chunk } from 'lodash';

import { Box, Center, Modal, Pressable, Image, ScrollView, ToastManager, Icon } from '@onekeyhq/components';
import WalletAvatar from '@onekeyhq/kit/src/components/WalletSelector/WalletAvatar';
import type { ManagerWalletRoutesParams } from '@onekeyhq/kit/src/routes/Root/Modal/ManagerWallet';
import type { EmojiTypes } from '@onekeyhq/shared/src/utils/emojiUtils';
import { colors, randomList, imageMap } from '@onekeyhq/shared/src/utils/emojiUtils';

import type { ManagerWalletModalRoutes } from '../../../routes/routesEnum';
import type { RouteProp } from '@react-navigation/core';
import { useIntl } from 'react-intl';

import ImagePicker from 'react-native-image-crop-picker';
import { Platform, useWindowDimensions } from 'react-native';

type RouteProps = RouteProp<
  ManagerWalletRoutesParams,
  ManagerWalletModalRoutes.ManagerWalletModifyEmojiModal
>;

type ColorSelecterProps = {
  color: string;
  onPress: (color: string) => void;
};

const ColorSelecter = memo((props: ColorSelecterProps) => {
  const { color, onPress } = props;
  return (
    <Box
      flexDirection="row"
      height="40px"
      justifyContent="space-around"
      px="24px"
      marginY="24px"
    >
      {colors.map((item) => {
        const selected = color === item;
        return (
          <Pressable
            key={`color${item}`}
            onPress={() => {
              onPress(item);
            }}
          >
            {({ isHovered }) => (
              <Center
                width="40px"
                height="40px"
                p="2px"
                borderRadius="full"
                bgColor={
                  // eslint-disable-next-line no-nested-ternary
                  selected ? item : isHovered ? 'border-hovered' : undefined
                }
              >
                <Box
                  flex={1}
                  alignSelf="stretch"
                  bgColor={item}
                  borderRadius="full"
                  borderColor="background-default"
                  borderWidth="4px"
                />
              </Center>
            )}
          </Pressable>
        );
      })}
    </Box>
  );
});
ColorSelecter.displayName = 'ColorSelecter';

const ModifyWalletEmojiViewModal: FC = () => {
  const navigation = useNavigation();
  const { avatar, onDone } = useRoute<RouteProps>().params;
  const [color, updateColor] = useState(avatar.bgColor);
  const [emoji, updateEmoji] = useState(avatar.emoji);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const padding = 10; // Updated padding to 10px
  const itemWidth = 72; // Updated itemWidth to 72px
  const containerWidth = pageWidth - padding * 2;
  const rowItems = Math.floor(containerWidth / itemWidth);
  const intl = useIntl();
  const { width: screenWidth } = useWindowDimensions();

  const dataProvider = useMemo(() => {
    const emojis: EmojiTypes[][] = chunk(randomList, rowItems);
    return emojis;
  }, [rowItems]);

  const renderItem = useCallback(
    (item: EmojiTypes[], index: number) => (
      <Box
        key={`rows${index}`}
        flexDirection="row"
        justifyContent="space-between"
        width={`${containerWidth}px`}
        height={`${itemWidth}px`}
        marginBottom="10px" // 设置上下间距
      >
        {item.map((emojiItem, emojiIndex) => (
          <Pressable
            key={`rows${index} ${emojiIndex}`}
            onPress={() => {
              updateEmoji(emojiItem);
            }}
            borderRadius="10px" // Set border radius to 10px
            _hover={{ bg: 'surface-hovered' }}
            _pressed={{ bg: 'surface-pressed' }}
          >
            <Box
              alignItems="center"
              justifyContent="center"
              width={`${itemWidth}px`}
              height={`${itemWidth}px`}
              borderRadius="10px" // Set border radius to 10px
            >
              <Image
                source={{ uri: imageMap[emojiItem as keyof typeof imageMap] }}
                w={`${itemWidth}px`}
                h={`${itemWidth}px`}
              />
            </Box>
          </Pressable>
        ))}
      </Box>
    ),
    [itemWidth, containerWidth],
  );

  const handleImageUpload = useCallback(() => {
    ImagePicker.openPicker({
      width: 800,
      height: 800,
      cropping: true,
      compressImageQuality: 0.8, // 压缩质量 (0-1)
      mediaType: 'photo',
    }).then(async (image) => {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? image.path : image.path.replace('file://', ''),
        type: image.mime,
        name: image.filename || 'image.jpg',
      } as any);
  
      try {
        const uploadResponse = await fetch('https://api.dragmeta.vip/game/file/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log("uploadResponse  ", uploadResponse);
        const uploadResult = await uploadResponse.json();
        console.log("uploadResult   ", uploadResult);
        if (uploadResult.data) {
          setSelectedImage(uploadResult.data);
          ToastManager.show({ title: intl.formatMessage({ id: 'upload_header_success' }) })
        } else {
          console.log('Upload failed:', uploadResult);
          ToastManager.show({ title: intl.formatMessage({ id: 'upload_header_failed' }) })
        }
      } catch (error) {
        console.log('Upload error:', error);
        ToastManager.show({ title: intl.formatMessage({ id: 'upload_header_failed' }) })
      }
    }).catch((error) => {
      console.log('ImagePicker Error: ', error);
      ToastManager.show({ title: intl.formatMessage({ id: 'upload_header_failed' }) })
    });
  }, []);

  return (
    <Modal
      size="xs"
      height="562px"
      header=""
      primaryActionTranslationId="action__done"
      hideSecondaryAction
      staticChildrenProps={{ flex: 1 }}
      primaryActionProps={{
        onPress: () => {
          if (onDone) {
            onDone({
              emoji: selectedImage || emoji,
              bgColor: color,
            });
          }
          navigation.goBack();
        },
      }}
    >
      <Box flex={1}>
        <Center>

        </Center>
        <Pressable
          onPress={() => {
            handleImageUpload();
          }}
        >
          <Box alignItems="center">
            <WalletAvatar
              avatar={{ emoji: selectedImage || emoji, bgColor: color }}
              walletImage="hd"
              size="ei"
            />
          </Box>
          <Box
            position="absolute"
            right={`${screenWidth * 0.32}px`}
            bottom="-10px"
            size={8}
            justifyContent="center"
            alignItems="center"
            borderWidth={2}
            bg={'surface-hovered'}
            borderColor="surface-subdued"
            borderRadius="full"
          >
            <Icon name="CameraMini" size={16} />
          </Box>
        </Pressable>
        <ColorSelecter color={color} onPress={updateColor} />
        <Box
          onLayout={(e) => {
            if (pageWidth !== e.nativeEvent.layout.width) {
              setPageWidth(e.nativeEvent.layout.width);
            }
          }}
          flex={1}
          borderTopLeftRadius="24px"
          borderTopRightRadius="24px" // 确保圆角正确渲染
          bgColor="surface-subdued"
        >
          {pageWidth > 0 && (
            <ScrollView contentContainerStyle={{ padding }}>
              {dataProvider.map((item, index) => renderItem(item, index))}
            </ScrollView>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ModifyWalletEmojiViewModal;