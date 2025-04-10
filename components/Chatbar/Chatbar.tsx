// /components/Chatbar/Chatbar.tsx

import React, { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { v4 as uuidv4 } from 'uuid';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';

import { ChatFolders } from './components/ChatFolders';
import { ChatbarSettings } from './components/ChatbarSettings';
import { Conversations } from './components/Conversations';

import Sidebar from '../Sidebar';
import ChatbarContext from './Chatbar.context';
import { ChatbarInitialState, initialState } from './Chatbar.state';

export const Chatbar = () => {
  const { t } = useTranslation('sidebar');

  // Local search/filter state
  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  });

  // Global from HomeContext
  const {
    state: { conversations, showChatbar, defaultModelId, folders },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleNewConversation,
    handleUpdateConversation,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  // Allows user to set API key from Chatbar
  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: 'apiKey', value: apiKey });
      localStorage.setItem('apiKey', apiKey);
    },
    [homeDispatch],
  );

  // Stub plugin
  const handlePluginKeyChange = () => {};
  const handleClearPluginKey = () => {};

  // Clear all convos
  const handleClearConversations = () => {
    if (defaultModelId) {
      homeDispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });
    }
    homeDispatch({ field: 'conversations', value: [] });
    localStorage.removeItem('conversationHistory');
    localStorage.removeItem('selectedConversation');

    const updatedFolders = folders.filter((f) => f.type !== 'chat');
    homeDispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter((c) => c.id !== conversation.id);

    homeDispatch({ field: 'conversations', value: updatedConversations });
    chatDispatch({ field: 'searchTerm', value: '' });
    saveConversations(updatedConversations);

    if (updatedConversations.length > 0) {
      const lastConv = updatedConversations[updatedConversations.length - 1];
      homeDispatch({ field: 'selectedConversation', value: lastConv });
      saveConversation(lastConv);
    } else {
      if (defaultModelId) {
        homeDispatch({
          field: 'selectedConversation',
          value: {
            id: uuidv4(),
            name: t('New Conversation'),
            messages: [],
            model: OpenAIModels[defaultModelId],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            folderId: null,
          },
        });
      }
      localStorage.removeItem('selectedConversation');
    }
  };

  // Toggle open/close
  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showChatbar', value: !showChatbar });
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar));
  };

  // If user drags a conversation => sets folderId=0
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
      handleUpdateConversation(conversation, { key: 'folderId', value: 0 });
      chatDispatch({ field: 'searchTerm', value: '' });
      e.currentTarget.style.background = 'none';
    }
  };

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      chatDispatch({
        field: 'filteredConversations',
        value: conversations.filter((c) => {
          const joinedMsgs = c.messages.map((m) => m.content).join(' ');
          const toSearch = (c.name + ' ' + joinedMsgs).toLowerCase();
          return toSearch.includes(lowerSearch);
        }),
      });
    } else {
      chatDispatch({ field: 'filteredConversations', value: conversations });
    }
  }, [searchTerm, conversations, chatDispatch]);

  // Provide all these chatbar features to children
  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleClearConversations,
        handlePluginKeyChange,
        handleClearPluginKey,
        handleApiKeyChange,
        handleExportData: () => console.log('Export not implemented'),
        handleImportConversations: () => console.log('Import not implemented'),
      }}
    >
      <Sidebar<Conversation>
        side="left"
        isOpen={showChatbar}
        addItemButtonTitle={t('Start New Session') as string}
        itemComponent={<Conversations conversations={filteredConversations} />}
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations}
        searchTerm={searchTerm}
        handleSearchTerm={(term: string) => chatDispatch({ field: 'searchTerm', value: term })}
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleNewConversation} // => Creates a new conversation
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'chat')}
        handleDrop={handleDrop}
        footerComponent={<ChatbarSettings />} // => Renders modals if user sets openModal in global
      />
    </ChatbarContext.Provider>
  );
};

export default Chatbar;
