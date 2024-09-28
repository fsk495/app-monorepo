import { Box, Menu, Text, Image, Pressable, Icon } from '@onekeyhq/components';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

interface Currency {
  symbol: string;
  name: string;
  logoURI: string;
}

interface CurrenciesSelectorProps {
  selectedCurrencies: string;
  onCurrenciesChange: (currency: string) => void;
  currencies: Currency[];
  disabled: boolean;
  colors: colors
}
interface colors { backgroundBox: string, text: string, inputText: string, button: string, buttonDisabled: string }

const CurrenciesSelector = ({ selectedCurrencies, onCurrenciesChange, currencies, disabled,colors }: CurrenciesSelectorProps) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const currencyOptions = useMemo(() => {
    return currencies.map(currency => ({
      label: currency.name,
      value: currency.symbol,
      iconUrl: currency.logoURI,
    }));
  }, [currencies]);

  const selectedCurrency = useMemo(() => {
    return currencyOptions.find(option => option.value === selectedCurrencies);
  }, [currencyOptions, selectedCurrencies]);

  return (
    <Menu
      placement="bottom right"
      style={{ width: 140 }}
      offset={42}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)} // 监听弹窗关闭事件
      trigger={(triggerProps) => (
        <Pressable {...triggerProps} disabled={disabled} onPress={() => setIsOpen(!isOpen)}>
          <Box
            bg="transparent"
            borderRadius="md"
            flexDirection="row"
            alignItems="center"
          >
            {selectedCurrency?.iconUrl && (
              <Image
                source={{ uri: selectedCurrency.iconUrl }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
            )}
            <Text fontSize={16} color={colors.inputText} fontWeight={600}>
              {selectedCurrency ? selectedCurrency.label : intl.formatMessage({ id: 'title__select_a_token' })}
            </Text>
            <Icon
              name={isOpen ? 'ChevronDownMini' : 'ChevronRightMini'}
              size={24}
            />
          </Box>
        </Pressable>
      )}
    >
      {currencyOptions.map(option => (
        <Menu.Item
          key={option.value}
          onPress={() => {
            onCurrenciesChange(option.value);
            setIsOpen(false); // 关闭弹窗
          }}
        >
          <Box flexDirection="row" alignItems="center">
            {option.iconUrl && (
              <Image
                source={{ uri: option.iconUrl }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
            )}
            <Text fontSize={16} color={colors.inputText}>
              {option.label}
            </Text>
          </Box>
        </Menu.Item>
      ))}
    </Menu>
  );
};

export default CurrenciesSelector;