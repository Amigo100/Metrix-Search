// /components/Modals/SettingsModal.tsx

import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';

export const SettingsModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'settings') return null;

  // Example: we rely on state.lightMode
  const isDarkMode = state.lightMode === 'dark';

  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [selectedApiProvider, setSelectedApiProvider] = useState<string>('openai');
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');

  // Example model logic
  const modelOptions =
    selectedApiProvider === 'openai'
      ? [
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5-Turbo' },
          { value: 'gpt-4', label: 'GPT-4' },
        ]
      : selectedApiProvider === 'gemini'
      ? [{ value: 'gemini-2.0', label: 'Gemini 2.0' }]
      : [
          {
            value: 'internal-ml-discharge',
            label: 'Internal ML - Discharge Summaries',
          },
        ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('apiKey') || '';
      const storedApiProv = localStorage.getItem('apiProvider') || 'openai';
      const storedLang = localStorage.getItem('defaultLanguage') || 'en';
      const storedModel = localStorage.getItem('defaultModel') || 'gpt-4';

      setTempApiKey(storedKey);
      setSelectedApiProvider(storedApiProv);
      setDefaultLanguage(storedLang);
      setSelectedModel(storedModel);
    }
  }, []);

  const handleClose = () => {
    dispatch({ field: 'openModal', value: null });
  };

  const handleToggleDarkMode = () => {
    dispatch({ field: 'lightMode', value: isDarkMode ? 'light' : 'dark' });
  };

  const handleApiProviderChange = (val: string) => {
    setSelectedApiProvider(val);
    if (val === 'openai' && (selectedModel.startsWith('gemini') || selectedModel.startsWith('internal'))) {
      setSelectedModel('gpt-4');
    } else if (val === 'gemini' && !selectedModel.startsWith('gemini')) {
      setSelectedModel('gemini-2.0');
    } else if (val === 'rest' && !selectedModel.startsWith('internal-ml')) {
      setSelectedModel('internal-ml-discharge');
    }
  };

  const handleSaveSettings = () => {
    // Save to global state
    dispatch({ field: 'apiKey', value: tempApiKey });
    dispatch({ field: 'defaultModelId', value: selectedModel });

    // LocalStorage
    localStorage.setItem('apiKey', tempApiKey);
    localStorage.setItem('apiProvider', selectedApiProvider);
    localStorage.setItem('defaultLanguage', defaultLanguage);
    localStorage.setItem('defaultModel', selectedModel);

    alert(t('Settings updated!'));
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl p-6 rounded shadow overflow-auto max-h-[90vh]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
            {t('Settings')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-500"
              onClick={handleClose}
            >
              {t('Cancel')}
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              onClick={handleSaveSettings}
            >
              {t('Save Settings')}
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mb-5">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={handleToggleDarkMode}
            />
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {t('Dark Mode')}
            </span>
          </label>
        </div>

        {/* API Provider */}
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-800 dark:text-gray-100">
            {t('API Provider')}
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
            value={selectedApiProvider}
            onChange={(e) => handleApiProviderChange(e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="rest">Internal ML</option>
          </select>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-800 dark:text-gray-100">
            {t('API Key')}
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder={t('Enter your API key if needed') as string}
          />
        </div>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-800 dark:text-gray-100">
            {t('Model Selection')}
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {modelOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Default Language */}
        <div className="mb-6">
          <label className="block mb-1 text-sm text-gray-800 dark:text-gray-100">
            {t('Default Language')}
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            onClick={handleClose}
          >
            {t('Cancel')}
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            onClick={handleSaveSettings}
          >
            {t('Save Settings')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
