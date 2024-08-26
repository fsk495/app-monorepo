import { Box, Select, useTheme, Text,Image } from "@onekeyhq/components";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Network } from "@onekeyhq/engine/src/types/network";


// 选择网络
interface NetworkSelectorProps {
    selectedNetwork: string;
    onNetworkChange: (network: string) => void;
    networks: Network[];
}

const NetworkSelector = ({ selectedNetwork, onNetworkChange, networks }: NetworkSelectorProps) => {
    const { themeVariant } = useTheme();
    const inil = useIntl();
    const networkOptions = useMemo(() => {
        return networks.map(network => ({
            label: network.name,
            value: network.id,
            iconUrl:network.logoURI,
        }));
    }, [networks]);

    return (
        <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            p={2}
            borderRadius="lg"
        >
            <Text fontSize={16} fontWeight="bold">{inil.formatMessage({ id: 'network__network' })}</Text>
            <Select
                title={inil.formatMessage({ id: 'network__network' })}
                isTriggerPlain
                footer={null}
                headerShown={false}
                value={selectedNetwork}
                onChange={onNetworkChange}
                options={networkOptions}
                dropdownProps={{ width: '64' }}
                dropdownPosition="right"
                triggerProps={{
                    bg: '#E7F6F1', // 设置背景颜色为灰色
                    borderRadius: 'md', // 设置圆角矩形
                }}
                renderTrigger={({ activeOption }) => (
                    <Box
                        px={4}
                        py={2}
                        bg="#E7F6F1"
                        borderRadius="md"
                        flexDirection="row"
                        alignItems="center"
                    >
                        {activeOption?.iconUrl && (
                            <Image
                                source={{ uri: activeOption.iconUrl }}
                                style={{ width: 24, height: 24, marginRight: 8 }}
                            />
                        )}
                        <Text fontSize={16} color="primary">
                            {activeOption ? activeOption.label : inil.formatMessage({ id: 'title__select_networks' })}
                        </Text>
                    </Box>
                )}
            />
        </Box>
    );
};

export default NetworkSelector;