// /components/Modals/SettingsModal.tsx

import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
// IMPROVEMENT: Use Heroicons
import {
  Cog6ToothIcon, // Settings Icon
  XMarkIcon,     // Close Icon
  CheckIcon,     // Save Icon
  SunIcon,
  MoonIcon,
  EyeIcon,       // Show API Key
  EyeSlashIcon,  // Hide API Key
  SignalIcon,    // API Provider Icon
  CpuChipIcon,   // Model Icon
  LanguageIcon   // Language Icon
} from '@heroicons/react/24/outline';

// Define reusable input/select classes for consistency
const inputSelectClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-teal-700/50
                            rounded-md shadow-sm text-sm
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            placeholder-gray-400 dark:placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`;

export const SettingsModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'settings') return null;

  const isDarkMode = state.lightMode === 'dark';

  // Local state for form fields
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [apiKeyVisible, setApiKeyVisible] = useState<boolean>(false); // State for API key visibility
  const [selectedApiProvider, setSelectedApiProvider] = useState<string>('openai');
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');

  // Model options logic remains the same
  const modelOptions =
    selectedApiProvider === 'openai'
      ? [
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5-Turbo' },
          { value: 'gpt-4', label: 'GPT-4 (Default)' },
          { value: 'gpt-4-turbo', label: 'GPT-4-Turbo' }, // Example addition
        ]
      : selectedApiProvider === 'gemini'
      ? [
          { value: 'gemini-pro', label: 'Gemini Pro' }, // Example update
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        ]
      : [ // Assuming 'rest' is for Internal ML
          {
            value: 'internal-ml-discharge',
            label: 'Internal ML - Discharge Summaries',
          },
          {
            value: 'internal-ml-general',
            label: 'Internal ML - General Notes', // Example addition
          },
        ];

  // Effect to load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(`${selectedApiProvider}_apiKey`) || localStorage.getItem('apiKey') || ''; // IMPROVEMENT: Load key based on provider first
      const storedApiProv = localStorage.getItem('apiProvider') || 'openai';
      const storedLang = localStorage.getItem('defaultLanguage') || 'en';
      const storedModel = localStorage.getItem(`${storedApiProv}_defaultModel`) || localStorage.getItem('defaultModel') || 'gpt-4'; // IMPROVEMENT: Load model based on provider

      setSelectedApiProvider(storedApiProv); // Set provider first
      setTempApiKey(storedKey);
      setDefaultLanguage(storedLang);
      setSelectedModel(storedModel);
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update API key state when provider changes
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const storedKey = localStorage.getItem(`${selectedApiProvider}_apiKey`) || '';
          setTempApiKey(storedKey); // Load the key specific to the *newly selected* provider
      }
  }, [selectedApiProvider]);


  const handleClose = () => {
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  const handleToggleDarkMode = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    dispatch({
      type: 'change',
      field: 'lightMode',
      value: newMode,
    });
    // Also update localStorage for persistence if needed (assuming theme is persisted elsewhere or via CSS)
    // localStorage.setItem('theme', newMode);
  };

  // Function to handle API provider change and update model selection
  const handleApiProviderChange = (val: string) => {
    setSelectedApiProvider(val);
    let defaultModelForProvider = 'gpt-4'; // Default fallback
    if (val === 'openai') {
        defaultModelForProvider = localStorage.getItem('openai_defaultModel') || 'gpt-4';
    } else if (val === 'gemini') {
        defaultModelForProvider = localStorage.getItem('gemini_defaultModel') || 'gemini-1.5-pro'; // Update default
    } else if (val === 'rest') { // internal
        defaultModelForProvider = localStorage.getItem('rest_defaultModel') || 'internal-ml-general'; // Update default
    }
    // Ensure the loaded default model is valid for the new provider, otherwise set a reasonable default
     const currentProviderOptions = val === 'openai' ? modelOptionsOpenAI : val === 'gemini' ? modelOptionsGemini : modelOptionsInternal;
     if (!currentProviderOptions.some(opt => opt.value === defaultModelForProvider)) {
         defaultModelForProvider = currentProviderOptions[0]?.value || ''; // Fallback to first option if saved model is invalid
     }
    setSelectedModel(defaultModelForProvider);
  };
  // Define options separately for clarity in handleApiProviderChange
    const modelOptionsOpenAI = [ { value: 'gpt-3.5-turbo', label: 'GPT-3.5-Turbo' }, { value: 'gpt-4', label: 'GPT-4 (Default)' }, { value: 'gpt-4-turbo', label: 'GPT-4-Turbo' }];
    const modelOptionsGemini = [ { value: 'gemini-pro', label: 'Gemini Pro' }, { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }];
    const modelOptionsInternal = [ { value: 'internal-ml-discharge', label: 'Internal ML - Discharge Summaries' }, { value: 'internal-ml-general', label: 'Internal ML - General Notes' }];


  const handleSaveSettings = () => {
    // Save to global state - only save generic defaultModelId, specific key isn't global
    // dispatch({ type: 'change', field: 'apiKey', value: tempApiKey }); // API key likely shouldn't be in global state
    dispatch({ type: 'change', field: 'defaultModelId', value: selectedModel });

    // Save settings specific to the provider in LocalStorage
    localStorage.setItem('apiProvider', selectedApiProvider);
    localStorage.setItem(`${selectedApiProvider}_apiKey`, tempApiKey); // IMPROVEMENT: Save key per provider
    localStorage.setItem(`${selectedApiProvider}_defaultModel`, selectedModel); // IMPROVEMENT: Save model per provider
    localStorage.setItem('defaultLanguage', defaultLanguage);

    // Optional: Update generic keys if needed, but provider-specific is better
    // localStorage.setItem('apiKey', tempApiKey);
    // localStorage.setItem('defaultModel', selectedModel);


    alert(t('Settings updated successfully!'));
    // Optionally re-fetch or update context if needed immediately elsewhere
    handleClose(); // Close modal after saving
  };

  return (
    // IMPROVEMENT: Consistent overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {/* IMPROVEMENT: Consistent modal container styling */}
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   border border-gray-200 dark:border-teal-700/50 p-6 flex flex-col overflow-hidden"
      >
        {/* IMPROVEMENT: Consistent Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-teal-700/50 mb-6 flex-shrink-0">
          <h2 className='text-xl font-semibold text-teal-800 dark:text-teal-300 flex items-center'>
            <Cog6ToothIcon className="h-6 w-6 mr-2"/> {/* Added Icon */}
            {t('Application Settings')}
          </h2>
          {/* IMPROVEMENT: Themed Close and Save Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className='inline-flex items-center rounded-md bg-gray-200 dark:bg-gray-600 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200'
              title={t('Cancel changes') || ''}
            >
              <XMarkIcon className='h-4 w-4 mr-1' /> {t('Cancel')}
            </button>
            <button
              onClick={handleSaveSettings}
              className='inline-flex items-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-colors duration-200'
               title={t('Save all settings') || ''}
            >
              <CheckIcon className='h-4 w-4 mr-1' /> {t('Save')}
            </button>
          </div>
        </div>

        {/* IMPROVEMENT: Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">

          {/* --- Appearance Settings --- */}
          <div className="p-4 border border-gray-200 dark:border-teal-800/60 rounded-md">
            <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('Appearance')}</h3>
             {/* Dark Mode Toggle - IMPROVEMENT: Enhanced styling */}
            <div>
                <label htmlFor="dark-mode-toggle" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                         {isDarkMode ? <MoonIcon className="h-5 w-5 mr-2 text-teal-500"/> : <SunIcon className="h-5 w-5 mr-2 text-yellow-500"/>}
                        {t('Theme')}
                    </span>
                    <div className="relative">
                        <input id="dark-mode-toggle" type="checkbox" className="sr-only" checked={isDarkMode} onChange={handleToggleDarkMode} />
                        <div className={`block w-10 h-6 rounded-full transition ${isDarkMode ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${isDarkMode ? 'translate-x-4' : ''}`}></div>
                    </div>
                </label>
            </div>
            {/* Language Setting */}
            <div className="mt-4">
              <label htmlFor="default-language" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <LanguageIcon className="h-5 w-5 mr-2 opacity-70"/> {t('Default Language')}
              </label>
              <select
                id="default-language"
                className={inputSelectClasses}
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
              >
                <option value="en">English (UK)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option> {/* Added Example */}
                {/* Add more relevant languages */}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('Sets the primary language for AI interactions, where supported by the model.')}
              </p>
            </div>
          </div>

          {/* --- API & Model Settings --- */}
           <div className="p-4 border border-gray-200 dark:border-teal-800/60 rounded-md space-y-4">
             <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{t('AI Provider & Model')}</h3>
             {/* API Provider */}
            <div>
              <label htmlFor="api-provider" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <SignalIcon className="h-5 w-5 mr-2 opacity-70"/> {t('API Provider')}
              </label>
              <select
                id="api-provider"
                className={inputSelectClasses}
                value={selectedApiProvider}
                onChange={(e) => handleApiProviderChange(e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="rest">Internal ML / Local</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('Select the AI service provider to use for generating notes.')}
              </p>
            </div>

            {/* API Key (Conditionally rendered based on provider? Maybe not for internal) */}
            {selectedApiProvider !== 'rest' && ( // Only show API key field if not Internal ML
                 <div>
                    <label htmlFor="api-key" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedApiProvider === 'openai' ? t('OpenAI API Key') : t('Gemini API Key')}
                    </label>
                    <div className="relative">
                        <input
                        id="api-key"
                        type={apiKeyVisible ? 'text' : 'password'} // Toggle type
                        className={inputSelectClasses + " pr-10"} // Add padding for icon
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder={t('Enter your key (stored locally)') || ''}
                        />
                        {/* IMPROVEMENT: API Key visibility toggle */}
                        <button
                        type="button"
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={apiKeyVisible ? t('Hide API Key') || '' : t('Show API Key') || ''}
                        >
                        {apiKeyVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('Your API key is stored securely in your browser\'s local storage and is not sent to Metrix AI servers.')}
                    </p>
                 </div>
            )}

            {/* Model Selection */}
            <div>
              <label htmlFor="model-selection" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CpuChipIcon className="h-5 w-5 mr-2 opacity-70"/> {t('Default AI Model')}
              </label>
              <select
                id="model-selection"
                className={inputSelectClasses}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                 {/* IMPROVEMENT: Use dynamically generated options based on provider */}
                {(selectedApiProvider === 'openai' ? modelOptionsOpenAI :
                  selectedApiProvider === 'gemini' ? modelOptionsGemini :
                  modelOptionsInternal).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('Select the default model for this provider. Templates may override this.')}
              </p>
            </div>
          </div>


           {/* IMPROVEMENT: Removed duplicated Cancel/Save buttons from here */}

        </div> {/* End Scrollable Content Area */}
      </div> {/* End Modal Container */}
    </div> /* End Modal Overlay */
  );
};

export default SettingsModal;
