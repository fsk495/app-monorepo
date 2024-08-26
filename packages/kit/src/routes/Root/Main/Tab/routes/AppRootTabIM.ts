import { withTabLayout } from '@onekeyhq/components/src/Layout/withTabLayout';

import { toFocusedLazy } from '../../../../../components/LazyRenderWhenFocus';
import { TabRoutes } from '../../../../routesEnum';

import { tabRoutesConfigBaseMap } from './tabRoutes.base';

import type { TabRouteConfig } from '../../../../types';
import IM from '../../../../../views/IM';

const name = TabRoutes.IM;
const config: TabRouteConfig = {
  ...tabRoutesConfigBaseMap[name],
  component: withTabLayout(
    toFocusedLazy(IM, {
      rootTabName: name,
      // freezeWhenBlur: true, // cause HomeTab white screen when switch from this tab
    }),
    name,
  ),
  children: [
  ],
};
export default config;
