import { Box, Select, Text, Image } from '@onekeyhq/components';
import { useMemo } from 'react';
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
  disabled:boolean;
}

const CurrenciesSelector = ({ selectedCurrencies, onCurrenciesChange, currencies,disabled }: CurrenciesSelectorProps) => {
  const intl = useIntl();
  const currencyOptions = useMemo(() => {
    return currencies.map(currency => ({
        label: currency.name,
        value: currency.symbol,
        iconUrl: currency.logoURI,
    }));
  }, [currencies]);

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
      <Text fontSize={16} fontWeight="bold">{intl.formatMessage({ id: 'asset__tokens' })}</Text>
      <Select
        title={intl.formatMessage({ id: 'asset__tokens' })}
        isTriggerPlain
        footer={null}
        headerShown={false}
        value={selectedCurrencies}
        onChange={onCurrenciesChange}
        options={currencyOptions}
        dropdownProps={{ width: '64' }}
        dropdownPosition="right"
        triggerProps={{
          bg: 'transparent', // 设置背景颜色为灰色
          borderRadius: 'md', // 设置圆角矩形
          disabled: disabled
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
              {activeOption ? activeOption.label : intl.formatMessage({ id: 'title__select_a_token' })}
            </Text>
          </Box>
        )}
      />
    </Box>
  );
};

export default CurrenciesSelector;