// file: /pages/api/home/home.tsx

import React, { useEffect, useRef, useState, useContext } from 'react'; // Added useContext
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import Script from 'next/script';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

// Removed: import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
} from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getSettings } from '@/utils/app/settings';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

// Import context definition (not provider)
import HomeContext from './home.context';
// Removed: import { HomeInitialState, initialState } from './home.state';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
  openaiApiKey: string;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
  openaiApiKey,
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);

  // --- Consume context from the REAL provider in _app.tsx ---
  const {
    state, // Get the shared state
    dispatch, // Get the shared dispatch
    handleNewConversation, // Get the shared handler
    // Add other handlers if needed directly by this component's props
  } = useContext(HomeContext);

  // Destructure needed state variables from the *shared* state
  const {
      apiKey,
      lightMode,
      selectedConversation,
  } = state;

  const stopConversationRef = useRef<boolean>(false);

  // Use react-query to fetch models
  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet], // Depends on apiKey from shared state
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;
      return getModels({ key: apiKey }, signal);
    },
    { enabled: true, refetchOnMount: false }
  );

  // --- Effects now use the SHARED dispatch ---
  useEffect(() => {
    if (data) {
      dispatch({ type: 'change', field: 'models', value: data }); // Uses shared dispatch
    }
  }, [data, dispatch]); // dispatch dependency is stable

  useEffect(() => {
    dispatch({
      type: 'change',
      field: 'modelError',
      value: getModelsError(error),
    }); // Uses shared dispatch
  }, [dispatch, error, getModelsError]); // dispatch dependency is stable


  // --- OTHER EFFECTS (now use shared dispatch) ---

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ type: 'change', field: 'showChatbar', value: false });
    }
  }, [selectedConversation, dispatch]); // Added dispatch dependency

  useEffect(() => {
    if (defaultModelId) {
      dispatch({ type: 'change', field: 'defaultModelId', value: defaultModelId });
    }
    if (serverSideApiKeyIsSet) {
      dispatch({
        type: 'change', field: 'serverSideApiKeyIsSet', value: serverSideApiKeyIsSet,
      });
    }
    if (serverSidePluginKeysSet) {
      dispatch({
        type: 'change', field: 'serverSidePluginKeysSet', value: serverSidePluginKeysSet,
      });
    }
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD Effect - simplified as most logic should be in Provider
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({ type: 'change', field: 'lightMode', value: settings.theme });
    }

    if (openaiApiKey) { // Prioritize prop from server
      dispatch({ type: 'change', field: 'apiKey', value: openaiApiKey });
      localStorage.setItem('apiKey', openaiApiKey);
    } else {
      const storedKey = localStorage.getItem('apiKey');
      if (storedKey) {
        dispatch({ type: 'change', field: 'apiKey', value: storedKey });
      }
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ type: 'change', field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      try {
        dispatch({ type: 'change', field: 'pluginKeys', value: JSON.parse(pluginKeys) });
      } catch {
         dispatch({ type: 'change', field: 'pluginKeys', value: [] }); // fallback
      }
    }

    if (window.innerWidth < 640) {
      dispatch({ type: 'change', field: 'showChatbar', value: false });
      dispatch({ type: 'change', field: 'showSidePromptbar', value: false });
    }
    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ type: 'change', field: 'showChatbar', value: showChatbar === 'true'});
    }
    const showSidePromptbar = localStorage.getItem('showSidePromptbar');
    if (showSidePromptbar) {
      dispatch({ type: 'change', field: 'showSidePromptbar', value: showSidePromptbar === 'false'});
    }

    // NOTE: Loading folders, prompts, conversations etc. from localStorage
    // is ideally handled solely within HomeContextProvider now.
    // Leaving this effect minimal here.

  }, [openaiApiKey, serverSideApiKeyIsSet, serverSidePluginKeysSet, defaultModelId, dispatch]); // Added dispatch here as it's used

  return (
    <> {/* Opening Fragment */}
      <Head>
        <title>Metrix AI - The Intelligent Clinical Scribe Platform</title>
        <meta name="description" content="Smarter algorithms for smarter working" />
        <meta name="viewport" content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Script src="https://www.googletagmanager.com/gtag/js?id=G-S2RT6C3E5G" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-S2RT6C3E5G');
        `}
      </Script>

      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`} // lightMode from shared state
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation} // from shared state
              onNewConversation={handleNewConversation} // from shared context
            />
          </div>
          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            {/* These components presumably consume context internally */}
            <Chatbar />
            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>
            <Promptbar />
          </div>
        </main>
      )}
      {!selectedConversation && (
          <div>Loading Conversation...</div> // Or some other placeholder
      )}
    </> // <-- FIX APPLIED HERE: Added Closing Fragment Tag
  );
};

export default Home;

// getServerSideProps remains the same
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
   const defaultModelId =
     (process.env.DEFAULT_MODEL &&
       Object.values(OpenAIModelID).includes(
         process.env.DEFAULT_MODEL as OpenAIModelID
       ) &&
       process.env.DEFAULT_MODEL) ||
     fallbackModelID;

   let serverSidePluginKeysSet = false;
   const googleApiKey = process.env.GOOGLE_API_KEY;
   const googleCSEId = process.env.GOOGLE_CSE_ID;
   if (googleApiKey && googleCSEId) {
     serverSidePluginKeysSet = true;
   }

   return {
     props: {
       serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
       openaiApiKey: process.env.OPENAI_API_KEY || '',
       defaultModelId,
       serverSidePluginKeysSet,
       ...(await serverSideTranslations(locale ?? 'en', [
         'common', 'chat', 'sidebar', 'markdown', 'promptbar', 'settings',
       ])),
     },
   };
};
