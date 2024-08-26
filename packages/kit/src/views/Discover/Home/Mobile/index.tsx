import { useMemo, useRef } from 'react';

import type { ForwardRefHandle } from '@onekeyhq/app/src/views/NestedTabView/NestedTabView';
import { Box, ScrollView } from '@onekeyhq/components';
// import { Tabs } from '@onekeyhq/components/src/CollapsibleTabView';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import { usePressTagEffect, useTabConfig } from '../config';

import { Header } from './header';
import DappItem from './DappItem';
import { useIntl } from 'react-intl';

const dapps = [
  {
    _id: '0',
    url: 'https://dapp.novai.finance/#/',
    name: 'Novai Finance',
    shortName: 'Finance',
    description: '0',//'Novai Finance is an organization that promotes and markets Novai Chain',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/Finance.png'
  },
  {
    _id: '1',
    url: 'https://scan.novaichain.com/novaichain',
    name: 'Novai Scan',
    shortName: 'Novai Scan',
    description: '1',//'Novai Chain Block Explorer',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/Blockchain.png'
  },
  {
    _id: '2',
    url: 'https://swap.novaichain.com/#/swap',
    name: 'Novai Swap',
    shortName: 'Novai Swap',
    description: '2',//'Novai Swap is a protocol for automated token exchange on Ethereum',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/Novaiswap.png'
  },
  {
    _id: '3',
    url: 'https://bridge.novaichain.com/#/',
    name: 'Novai Bridge',
    shortName: 'Novai Bridge',
    description: '3',//'NovaiBridge is the place where Novai is obtained or withdrawn',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/NovaiBridge.png'
  },
  {
    _id: '4',
    url: 'https://faucets.novaichain.com/#/',
    name: 'Novai Faucet',
    shortName: 'Faucet',
    description: '4',//'NovaiFaucet is a free option to get a certain amount of Noavi',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/NovaiFaucets.png'
  },
  {
    _id: '5',
    url: 'https://dapp.dragmeta.vip',
    name: 'Dragon',
    shortName: 'Dragon',
    description: '5',//'NovaiFaucet is a free option to get a certain amount of Noavi',
    logoURL: 'https://drag2.s3.ap-east-1.amazonaws.com/pocket/assets/dappIcons/NovaiDragon.png'
  },
];

export const Mobile = () => {
  const ref = useRef<ForwardRefHandle>(null);
  usePressTagEffect({ ref });
  const intl = useIntl()
  const tabConfig = useTabConfig();
  // const onIndexChange = useOnTabChange();
  const containerStyle = useMemo(
    () => ({
      flex: 1,
    }),
    [],
  );
  const contentContainerStyle = useMemo(
    () => (!platformEnv.isWeb ? { paddingBottom: 60 } : undefined),
    [],
  );

  const translatedDapps = useMemo(() => {
    return dapps.map(dapp => {
      switch (dapp.description) {
        case '0':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_finance' }) };
        case '1':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_scan' }) };
        case '2':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_swap' }) =="dapp_novai_swap"?'': intl.formatMessage({ id: 'dapp_novai_swap' })};
        case '3':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_bridge' }) };
        case '4':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_faucet' }) };
        case '5':
          return { ...dapp, description: intl.formatMessage({ id: 'dapp_novai_dragon' }) };
        default:
          return dapp;
      }
    });
  }, [intl]);

  return (
    <Box flex="1" bg="background-default">
      <Box style={containerStyle}>
        <Header />
        <ScrollView contentContainerStyle={contentContainerStyle}>
          {/* {tabConfig[0].component} */}
          {translatedDapps.map((dapp)=>{
            return <DappItem key={dapp._id} dapp={dapp} />
          })}
        </ScrollView>
      </Box>
      {/* <Tabs.Container
        headerHeight={114}
        // stickyTabBar
        onIndexChange={onIndexChange}
        headerView={<Header />}
        containerStyle={containerStyle}
        disableRefresh
        ref={ref}
      >
        {tabConfig.map((tab) => (
          <Tabs.Tab key={tab.name} name={tab.name} label={tab.label}>
            <Tabs.ScrollView contentContainerStyle={contentContainerStyle}>
              {tab.component}
            </Tabs.ScrollView>
          </Tabs.Tab>
        ))}
      </Tabs.Container> */}
    </Box>
  );
};
