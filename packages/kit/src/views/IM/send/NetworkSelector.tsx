import { Box, Select, Text, Image, Icon } from "@onekeyhq/components";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Network } from "@onekeyhq/engine/src/types/network";

interface NetworkSelectorProps {
    selectedNetwork: string;
    onNetworkChange: (network: string) => void;
    networks: Network[];
    disabled: boolean;
    colors: colors
}
interface colors { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string }

const NetworkSelector = ({ selectedNetwork, onNetworkChange, networks, disabled,colors }: NetworkSelectorProps) => {
    const intl = useIntl();
    const networkOptions = useMemo(() => {
        return networks.map(network => ({
            label: network.name,
            value: network.id,
            iconUrl: network.logoURI,
        }));
    }, [networks]);

    return (
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
                bg: 'transparent', // 设置背景颜色为更淡的灰色
                borderRadius: 'md', // 设置圆角矩形
                disabled: disabled
            }}
            renderTrigger={({ activeOption }) => (
                <Box
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
                    <Text fontSize={16} color={colors.inputText} fontWeight={600}>
                        {activeOption ? activeOption.label : intl.formatMessage({ id: 'title__select_networks' })}
                    </Text>
                    <Icon
                        name={'ChevronRightMini'}
                        size={24}
                    />
                </Box>
            )}
        />
    );
};

export default NetworkSelector;