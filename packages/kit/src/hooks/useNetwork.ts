/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';

import type { INetwork } from '@onekeyhq/engine/src/types';

import backgroundApiProxy from '../background/instance/backgroundApiProxy';

import { useAppSelector } from './useAppSelector';

function useNetwork({
  networkId,
  networkFallback,
}: {
  networkId?: string | null;
  networkFallback?: INetwork | null;
}) {
  if (networkId === 'all') {
    debugger;
  }
  const networkInRedux = useAppSelector((s) =>
    s.runtime.networks?.find((n) => n.id === networkId),
  );
  const [networkInDb, setNetworkInDb] = useState<INetwork | undefined>(
    networkInRedux,
  );
  useEffect(() => {
    (async () => {
      if (!networkId) {
        return;
      }
      if (networkInRedux) {
        return;
      }
      const result = await backgroundApiProxy.engine.getNetwork(networkId);
      setNetworkInDb(result);
    })();
  }, [networkId, networkInRedux]);
  const finalNetwork = networkInRedux ?? networkInDb ?? networkFallback ?? null;
  return useMemo(() => ({ network: finalNetwork }), [finalNetwork]);
}

export const useNetworkSimple = (
  networkId?: string | null,
  networkFallback?: INetwork | null,
) => {
  const { network } = useNetwork({ networkId, networkFallback });
  return network;
};

export { useNetwork };
