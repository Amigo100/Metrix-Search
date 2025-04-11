// file: /components/Modals/HelpModal.tsx

import { useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';

export const HelpModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'help') return null;

  const handleClose = () => {
    // IMPORTANT: add type: 'change'
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-md shadow-lg
          bg-white dark:bg-[#343541] text-black dark:text-white
          border border-gray-300 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('Help & FAQs')}
          </h2>
          <button
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white
              hover:bg-blue-700 transition"
            onClick={handleClose}
          >
            {t('Close')}
          </button>
        </div>

        {/* Quick Start Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Quick Start Guide')}
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200 mt-2 space-y-1">
            <li>{t('Open the Chat interface and click “Start New Session”...')}</li>
            <li>{t('Use the Voice Mode button to dictate your notes...')}</li>
            <li>{t('Select a template (e.g., “ED Triage Note”)...')}</li>
            <li>{t('Adjust the model (GPT-4, Gemini, or internal ML)...')}</li>
          </ul>
        </div>

        {/* Privacy & Security */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Privacy & Security')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            {t('Our platform uses secure methods...')}
          </p>
        </div>

        {/* FAQ */}
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Frequently Asked Questions')}
          </h3>
          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('How does Metrix AI handle patient data?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t('Metrix AI processes dictation data transiently...')}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('Which browsers are supported?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t('Chrome, Safari, and modern Edge are recommended...')}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('Can I use internal ML models?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t('Yes, internal ML models can process data without sending...')}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('How can I contact support?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t('Email support@metrixai.com or use the “Profile” page...')}
            </p>
          </details>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300">
          {t(
            'For further assistance, contact your institution’s IT dept or refer to the Metrix AI user guide.'
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
