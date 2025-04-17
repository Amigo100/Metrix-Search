import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import Script from 'next/script';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

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

// Corrected import path for Chat component
import Chat from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
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

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  // Use react-query to fetch models
  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;
      return getModels(
        {
          key: apiKey,
        },
        signal
      );
    },
    { enabled: true, refetchOnMount: false }
  );

  // --- FIX 1: Add `type: 'change'` here
  useEffect(() => {
    if (data) {
      dispatch({ type: 'change', field: 'models', value: data });
    }
  }, [data, dispatch]);

  // --- FIX 2: Add `type: 'change'` here
  useEffect(() => {
    dispatch({
      type: 'change',
      field: 'modelError',
      value: getModelsError(error),
    });
  }, [dispatch, error, getModelsError]);

  // SELECT A CONVERSATION
  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      type: 'change',
      field: 'selectedConversation',
      value: conversation,
    });
    saveConversation(conversation);
  };

  // FOLDER OPERATIONS
  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];
    dispatch({ type: 'change', field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ type: 'change', field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return { ...c, folderId: null };
      }
      return c;
    });
    dispatch({
      type: 'change',
      field: 'conversations',
      value: updatedConversations,
    });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return { ...p, folderId: null };
      }
      return p;
    });
    dispatch({ type: 'change', field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return { ...f, name };
      }
      return f;
    });
    dispatch({ type: 'change', field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS
  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];
    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];
    dispatch({
      type: 'change',
      field: 'selectedConversation',
      value: newConversation,
    });
    dispatch({
      type: 'change',
      field: 'conversations',
      value: updatedConversations,
    });
    saveConversation(newConversation);
    saveConversations(updatedConversations);
    dispatch({ type: 'change', field: 'loading', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair
  ) => {
    const updatedConversation = { ...conversation, [data.key]: data.value };
    const { single, all } = updateConversation(
      updatedConversation,
      conversations
    );
    dispatch({ type: 'change', field: 'selectedConversation', value: single });
    dispatch({ type: 'change', field: 'conversations', value: all });
  };

  // OTHER EFFECTS

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ type: 'change', field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (defaultModelId) {
      dispatch({ type: 'change', field: 'defaultModelId', value: defaultModelId });
    }
    if (serverSideApiKeyIsSet) {
      dispatch({
        type: 'change',
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    }
    if (serverSidePluginKeysSet) {
      dispatch({
        type: 'change',
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
    }
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({ type: 'change', field: 'lightMode', value: settings.theme });
    }

    // Automatically store the API key from the server into localStorage
    if (openaiApiKey) {
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
      dispatch({ type: 'change', field: 'pluginKeys', value: pluginKeys });
    }

    if (window.innerWidth < 640) {
      dispatch({ type: 'change', field: 'showChatbar', value: false });
      dispatch({ type: 'change', field: 'showSidePromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({
        type: 'change',
        field: 'showChatbar',
        value: showChatbar === 'true',
      });
    }

    const showSidePromptbar = localStorage.getItem('showSidePromptbar');
    if (showSidePromptbar) {
      // note: if "false", the bar is closed
      dispatch({
        type: 'change',
        field: 'showSidePromptbar',
        value: showSidePromptbar === 'false'
      });
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ type: 'change', field: 'folders', value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem
