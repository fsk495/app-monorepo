import { Box, Select, Text, Image } from "@onekeyhq/components";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Network } from "@onekeyhq/engine/src/types/network";

interface NetworkSelectorProps {
    selectedNetwork: string;
    onNetworkChange: (network: string) => void;
    networks: Network[];
    disabled:boolean;
}

const NetworkSelector = ({ selectedNetwork, onNetworkChange, networks,disabled }: NetworkSelectorProps) => {
    const intl = useIntl();
    const networkOptions = useMemo(() => {
        return networks.map(network => ({
            label: network.name,
            value: network.id,
            iconUrl: network.logoURI,
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
            style={{ width: '100%', height: 60 }} // 设置固定宽度和高度
        >
            <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'network__network' })}</Text>
            <Select
                title={intl.formatMessage({ id: 'network__network' })}
                isTriggerPlain
                footer={null}
                headerShown={false}
                value={selectedNetwork}
                onChange={onNetworkChange}
                options={networkOptions}
                dropdownProps={{ width: '64' }}
                dropdownPosition="right"
                triggerProps={{
                    bg: 'transparent', // 设置背景颜色为灰色
                    borderRadius: 'md', // 设置圆角矩形
                    disabled:disabled
                }}
                renderTrigger={({ activeOption }) => (
                    <Box
                        px={4}
                        py={2}
                        bg="transparent"
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
                            {activeOption ? activeOption.label : intl.formatMessage({ id: 'title__select_networks' })}
                        </Text>
                    </Box>
                )}
            />
        </Box>
    );
};

export default NetworkSelector;