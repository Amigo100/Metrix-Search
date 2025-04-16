// /components/Settings/Key.tsx
// UPDATED VERSION

import { Check, KeyRound, X } from 'lucide-react'; // Use Lucide icons
import React, { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { SidebarButton } from '../Sidebar/SidebarButton';

// Style constants consistent with the theme
const formInputStyles = "block w-full rounded-md border border-gray-300 py-1.5 px-2 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm bg-white text-gray-900";
const ghostButtonStyles = "flex items-center justify-center p-1 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300";

interface Props {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const Key: FC<Props> = ({ apiKey, onApiKeyChange }) => {
  const { t } = useTranslation('sidebar');
  const [isChanging, setIsChanging] = useState(false);
  const [newKey, setNewKey] = useState(apiKey);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEnterDown = (e: KeyboardEvent<HTMLInputElement>) => { // Target input directly
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateKey(newKey);
    }
  };

  const handleUpdateKey = (rawKey: string) => {
    if (typeof onApiKeyChange !== 'function') {
      console.warn('[Key.tsx] onApiKeyChange is not a function');
      setIsChanging(false);
      return;
    }
    onApiKeyChange(rawKey.trim());
    setIsChanging(false);
  };

  useEffect(() => {
    if (isChanging) {
      inputRef.current?.focus();
    }
  }, [isChanging]);

  // Editing State
  if (isChanging) {
    return (
      // Use padding consistent with SidebarButton, light hover background
      <div className="flex w-full items-center gap-2 rounded-md py-2 px-3 bg-gray-50 border border-gray-200">
        <KeyRound size={18} className="text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          className={`${formInputStyles} flex-1 h-7`} // Use themed input styles
          type="password"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={handleEnterDown}
          placeholder={t('Enter API Key') || 'Enter API Key'}
        />
        {/* Use themed ghost buttons for actions */}
        <button
            className={`${ghostButtonStyles} hover:bg-green-100 hover:text-green-700`}
            onClick={(e) => { e.stopPropagation(); handleUpdateKey(newKey); }}
            title="Save Key"
        >
            <Check size={18} />
        </button>
         <button
            className={`${ghostButtonStyles} hover:bg-red-100 hover:text-red-700`}
            onClick={(e) => { e.stopPropagation(); setIsChanging(false); setNewKey(apiKey); }}
            title="Cancel"
        >
             <X size={18} />
        </button>
      </div>
    );
  }

  // Read-only State (Uses updated SidebarButton)
  return (
    <SidebarButton
      text={apiKey ? t('API Key Set') || 'API Key Set' : t('Add API Key') || 'Add API Key'}
      icon={<KeyRound size={18} />} // Use Lucide icon
      onClick={() => setIsChanging(true)}
    />
  );
};

// No default export needed if imported directly by name
