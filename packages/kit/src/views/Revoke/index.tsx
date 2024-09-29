import type { FC } from 'react';
import { useEffect } from 'react';

import { revokeUrl } from '@onekeyhq/engine/src/managers/revoke';

import { navigationShortcuts } from '../../routes/navigationShortcuts';
import { openDapp, openUrlByWebview } from '../../utils/openUrl';

const RevokePage: FC = () => {
  useEffect(() => {
    openUrlByWebview(revokeUrl);
    // openDapp(revokeUrl);
    navigationShortcuts.navigateToDiscover();
  }, []);
  return null;
};

export default RevokePage;
