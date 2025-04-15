// /components/Promptbar/Promptbar.tsx

import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import HomeContext from '@/pages/api/home/home.context';

const Promptbar = () => {
  const { t } = useTranslation('promptbar');
  const {
    state: { showSidePromptbar, hasChatOutput },
  } = useContext(HomeContext);

  const sidebarWidth = showSidePromptbar ? 'w-50' : 'w-0';

  return (
    <div
      className={`bg-gray-800 text-white overflow-y-auto transition-all duration-300 ${sidebarWidth}`}
    >
      {showSidePromptbar && (
        <div className="p-3">
          {hasChatOutput ? (
            <div>{t('Predictive Analytics or results go here')}</div>
          ) : (
            <div className="text-gray-400 text-sm">
              {t('No chat output yet. Analytics will appear here.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Promptbar;
