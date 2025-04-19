// file: /pages/api/home/home.tsx

// Added useContext
import React, { useEffect, useRef, useState, useContext } from 'react';
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

  // --- REMOVED Redundant State Creation ---
  // const contextValue = useCreateReducer<HomeInitialState>({
  //   initialState,
  // });

  // --- ADDED: Consume context from the REAL provider in _app.tsx ---
  const {
    state, // Get the shared state
    dispatch, // Get the shared dispatch
    handleNewConversation, // Get the shared handler
    // Note: other handlers (handleCreateFolder etc.) are likely called by
    // Chatbar/Promptbar which consume context directly. If Home needs them
    // directly for props, destructure them here too.
    // handleCreateFolder,
    // handleDeleteFolder,
    // handleUpdateFolder,
    // handleSelectConversation,
    // handleUpdateConversation,
    // Patient handlers are available but likely not needed directly here
  } = useContext(HomeContext);

  // Destructure needed state variables from the *shared* state
  const {
      apiKey,
      lightMode,
      // folders, // Likely used by Chatbar/Promptbar directly
      // conversations, // Likely used by Chatbar/Promptbar directly
      selectedConversation,
      // prompts, // Likely used by Promptbar directly
      // temperature, // Likely used by Chat directly
  } = state;


  const stopConversationRef = useRef<boolean>(false);

  // Use react-query to fetch models (remains the same)
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

  // --- REMOVED Redundant Handler Definitions ---
  // const handleSelectConversation = ...
  // const handleCreateFolder = ...
  // const handleDeleteFolder = ...
  // const handleUpdateFolder = ...
  // const handleNewConversation = ... (now obtained from context)
  // const handleUpdateConversation = ...

  // --- OTHER EFFECTS (now use shared dispatch) ---

  useEffect(() => {
    // This effect seems specific to initial mobile layout, keep it but use shared dispatch
    if (window.innerWidth < 640) {
      dispatch({ type: 'change', field: 'showChatbar', value: false });
    }
    // This dependency might cause re-runs if selectedConversation changes often.
    // Consider if this logic should only run once on mount or be elsewhere.
  }, [selectedConversation, dispatch]); // Added dispatch dependency

  useEffect(() => {
    // This effect sets initial state based on props, keep it but use shared dispatch
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
    // Removed dispatch from dependencies as it's stable; props dependency is correct
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD Effect - simplified as much logic should be in Provider now
  useEffect(() => {
    // Keep settings load, API key logic (as it uses props), maybe plugin keys
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

    // Plugin keys logic might still be relevant here if server-side props control it
    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ type: 'change', field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      // Make sure pluginKeys are parsed correctly if they are stored as JSON
      try {
        dispatch({ type: 'change', field: 'pluginKeys', value: JSON.parse(pluginKeys) });
      } catch {
         dispatch({ type: 'change', field: 'pluginKeys', value: [] }); // fallback
      }
    }

    // UI flags based on localStorage can remain here if desired
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
      dispatch({ type: 'change', field: 'showSidePromptbar', value: showSidePromptbar === 'false'}); // Assuming 'false' means closed
    }

    // *** Ideally, loading folders, prompts, conversations, selectedConversation
    // *** from localStorage should happen ONCE in the HomeContextProvider.
    // *** Keeping them here duplicates that logic and might cause conflicts/race conditions.
    // *** Recommended: Remove the sections below loading these from localStorage here.

    // --- Start Optional Removal ---
    // const folders = localStorage.getItem('folders');
    // if (folders) {
    //   dispatch({ type: 'change', field: 'folders', value: JSON.parse(folders) });
    // }
    // const prompts = localStorage.getItem('prompts');
    // if (prompts) {
    //   dispatch({ type: 'change', field: 'prompts', value: JSON.parse(prompts) });
    // }
    // const conversationHistory = localStorage.getItem('conversationHistory');
    // if (conversationHistory) {
    //   // ... parsing/cleaning ...
    //   dispatch({ type: 'change', field: 'conversations', value: cleanedConversationHistory });
    // }
    // const selectedConversationLS = localStorage.getParameter('selectedConversation');
    // if (selectedConversationLS) {
    //    // ... parsing/cleaning ...
    //   dispatch({ type: 'change', field: 'selectedConversation', value: cleanedSelectedConversation });
    // } else if (!state.selectedConversation) { // Check if selectedConversation is already set by provider
    //    // Logic to set a default new conversation might be needed if nothing loaded
    //    // This part highly depends on how the provider handles initial state
    // }
    // --- End Optional Removal ---


  // Only run ONCE on mount - dependencies should reflect values needed *only* for initialization
  // Dispatch is stable and doesn't need to be listed.
  }, [openaiApiKey, serverSideApiKeyIsSet, serverSidePluginKeysSet, defaultModelId]);


  // --- REMOVED Provider Wrapper ---
  return (
    <> {/* Use Fragment or other container if needed */}
      <Head>
        <title>Metrix AI - The
