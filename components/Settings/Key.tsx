// /components/Settings/Key.tsx

import { IconCheck, IconKey, IconX } from '@tabler/icons-react';
import React, { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { SidebarButton } from '../Sidebar/SidebarButton';

interface Props {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void; // must be provided by parent
}

export const Key: FC<Props> = ({ apiKey, onApiKeyChange }) => {
  const { t } = useTranslation('sidebar');
  const [isChanging, setIsChanging] = useState(false);
  const [newKey, setNewKey] = useState(apiKey);
  const inputRef = useRef<HTMLInputElement>(null);

  // Press Enter => update key
  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateKey(newKey);
    }
  };

  // Actually save or update the key
  const handleUpdateKey = (rawKey: string) => {
    if (typeof onApiKeyChange !== 'function') {
      console.warn('[Key.tsx] onApiKeyChange is not a function, but was called');
      setIsChanging(false);
      return;
    }
    onApiKeyChange(rawKey.trim());
    setIsChanging(false);
  };

  // Focus on the input as soon as we switch to "isChanging"
  useEffect(() => {
    if (isChanging) {
      inputRef.current?.focus();
    }
  }, [isChanging]);

  // If editing => show the password input + icons
  if (isChanging) {
    return (
      <div
        className="duration-200 flex w-full cursor-pointer items-center
          rounded-md py-3 px-3 transition-colors hover:bg-gray-500/10"
      >
        <IconKey size={18} />
        <input
          ref={inputRef}
          className="ml-2 h-[20px] flex-1 overflow-hidden overflow-ellipsis border-b
            border-neutral-400 bg-transparent pr-1 text-[12.5px] leading-3
            text-left text-white outline-none focus:border-neutral-100"
          type="password"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={handleEnterDown}
          placeholder={t('API Key') || 'API Key'}
        />
        <div className="flex w-[40px]">
          <IconCheck
            className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
            size={18}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateKey(newKey);
            }}
          />
          <IconX
            className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
            size={18}
            onClick={(e) => {
              e.stopPropagation();
              setIsChanging(false);
              setNewKey(apiKey); // revert to old key
            }}
          />
        </div>
      </div>
    );
  }

  // If not editing => return something (button or null)
  return (
    // Example: Use a "SidebarButton" for read-only mode:
    <SidebarButton
      text={apiKey ? '••••••••••' : t('Add API Key') || 'Add API Key'}
      icon={<IconKey size={18} />}
      onClick={() => setIsChanging(true)}
    />
  );
};

export default Key;
