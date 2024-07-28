import React from 'react';
import { Box, Text, Image } from '@onekeyhq/components';
import { TouchableOpacity } from 'react-native';
import { openMatchDApp } from '../../Explorer/Controller/gotoSite';

interface Dapp {
    _id: string;
    url: string;
    name: string;
    shortName: string;
    description: string;
    logoURL: string;
}

const DappItem: React.FC<{ dapp: Dapp }> = ({ dapp }) => {

    const handlePress = () => {
        openMatchDApp({
            id: dapp.url,
            webSite: {
                url: dapp.url,
                favicon: dapp.logoURL,
                title: dapp.name,
            },
            isNewWindow: true,
        });
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <Box
                flexDirection="row"
                alignItems="center"
                padding="16px"
                borderBottomWidth="1px"
                borderBottomColor="border-default"
                flex={1} // 确保 Box 有足够的空间
            >
                <Image
                    source={{ uri: dapp.logoURL }}
                    width="48px"
                    height="48px"
                    borderRadius="24px"
                    marginRight="16px"
                />
                <Box flexDirection="column" flexShrink={1}>
                    <Text fontSize="16px" fontWeight="bold">
                        {dapp.name}
                    </Text>
                    <Text fontSize="14px" color="text-secondary"
                        numberOfLines={1} ellipsizeMode='tail'
                        flexShrink={1}>
                        {dapp.description}
                    </Text>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

export default DappItem;