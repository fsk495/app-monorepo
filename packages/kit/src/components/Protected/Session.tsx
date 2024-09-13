import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Center, Spinner } from '@onekeyhq/components';
import { encodeSensitiveText } from '@onekeyhq/engine/src/secret/encryptors/aes256';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import { useAppSelector } from '../../hooks';

import { ValidationFields } from './types';
import Validation from './Validation';

type SessionProps = {
  field?: ValidationFields;
  onOk?: (text: string, nickname: string, isLocalAuthentication?: boolean) => void;
  hideTitle?: boolean;
  placeCenter?: boolean;
  title?: string;
  subTitle?: string;
  requireNickname?: boolean;
};

const Session: FC<SessionProps> = ({
  field,
  onOk,
  hideTitle,
  placeCenter,
  title,
  subTitle,
  requireNickname= false,
}) => {
  const [verifiedPwd, setVerifiedPwd] = useState(false);
  const validationSetting = useAppSelector((s) => s.settings.validationSetting);
  const isAlwaysNeedInputPassword = useMemo(() => {
    const value = field ? !!validationSetting?.[field] : false;
    if (field && field === ValidationFields.Secret) {
      // view recovery_phrase or private_key always need input password
      return true;
    }
    return value;
  }, [validationSetting, field]);

  const onSubmit = useCallback(
    async (text: string, nickname: string, isLocalAuthentication?: boolean) => {
      setVerifiedPwd(true);
      const key =
        await backgroundApiProxy.servicePassword.getBgSensitiveTextEncodeKey();
      await backgroundApiProxy.servicePassword.savePassword(
        encodeSensitiveText({
          text,
          key,
        }),
      );
      onOk?.(text,nickname, isLocalAuthentication);
    },
    [onOk],
  );
  if (!verifiedPwd) {
    return (
      <Validation
        onOk={onSubmit}
        hideTitle={hideTitle}
        placeCenter={placeCenter}
        title={title}
        subTitle={subTitle}
        requireNickname={requireNickname}
      />
    );
  }

  return (
    <Center w="full" h="full">
      <Spinner size="lg" />
    </Center>
  );
};

export default Session;