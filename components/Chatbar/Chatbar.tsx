import React, { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { v4 as uuidv4 } from 'uuid';

import { useCreateReducer } from '@/hooks/useCreateReducer'; // Adjust path
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'; // Adjust path
import { saveConversation, saveConversations } from '@/utils/app/conversation'; // Adjust path
import { saveFolders } from '@/utils/app/folders'; // Adjust path

import { Conversation } from '@/types/chat'; // Adjust path
import { OpenAIModels } from '@/types/openai'; // Adjust path

import HomeContext from '@/pages/api/home/home.context'; // Adjust path

import { ChatFolders } from './components/ChatFolders'; // Adjust path
import { ChatbarSettings } from './components/ChatbarSettings'; // Adjust path
import { Conversations } from './components/Conversations'; // Adjust path

import Sidebar from '../Sidebar'; // Uses the themed Sidebar
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
    handleNewConversation, // Renamed from handleNewRequest
    handleUpdateConversation,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  // --- Logic (Preserved) ---
  const handleApiKeyChange = useCallback( (apiKey: string) => { homeDispatch({ type: 'change', field: 'apiKey', value: apiKey }); localStorage.setItem('apiKey', apiKey); }, [homeDispatch], );
  const handlePluginKeyChange = () => {}; // Stub
  const handleClearPluginKey = () => {}; // Stub

  const handleClearConversations = () => {
    if (defaultModelId) { homeDispatch({ type: 'change', field: 'selectedConversation', value: { id: uuidv4(), name: t('New Conversation'), messages: [], model: OpenAIModels[defaultModelId], prompt: DEFAULT_SYSTEM_PROMPT, temperature: DEFAULT_TEMPERATURE, folderId: null, }, }); }
    homeDispatch({ type: 'change', field: 'conversations', value: [] });
    localStorage.removeItem('conversationHistory'); localStorage.removeItem('selectedConversation');
    const updatedFolders = folders.filter((f) => f.type !== 'chat');
    homeDispatch({ type: 'change', field: 'folders', value: updatedFolders }); saveFolders(updatedFolders);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter((c) => c.id !== conversation.id);
    homeDispatch({ type: 'change', field: 'conversations', value: updatedConversations });
    chatDispatch({ type: 'change', field: 'searchTerm', value: '' }); saveConversations(updatedConversations);
    if (updatedConversations.length > 0) { const lastConv = updatedConversations[updatedConversations.length - 1]; homeDispatch({ type: 'change', field: 'selectedConversation', value: lastConv }); saveConversation(lastConv); }
    else { if (defaultModelId) { homeDispatch({ type: 'change', field: 'selectedConversation', value: { id: uuidv4(), name: t('New Conversation'), messages: [], model: OpenAIModels[defaultModelId], prompt: DEFAULT_SYSTEM_PROMPT, temperature: DEFAULT_TEMPERATURE, folderId: null, }, }); } localStorage.removeItem('selectedConversation'); }
  };

  const handleToggleChatbar = () => { homeDispatch({ type: 'change', field: 'showChatbar', value: !showChatbar, }); localStorage.setItem('showChatbar', JSON.stringify(!showChatbar)); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      try { // Add try-catch for safety
        const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
        handleUpdateConversation(conversation, { key: 'folderId', value: null }); // Set folderId to null to move out of folder
        chatDispatch({ type: 'change', field: 'searchTerm', value: '' });
        (e.target as HTMLElement).style.background = 'none'; // Use themed highlight in Sidebar component now
      } catch (error) {
        console.error("Error parsing dropped data:", error);
      }
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      chatDispatch({ type: 'change', field: 'filteredConversations', value: conversations.filter((c) => { const joinedMsgs = c.messages.map((m) => m.content).join(' '); const toSearch = (c.name + ' ' + joinedMsgs).toLowerCase(); return toSearch.includes(lowerSearch); }), });
    } else {
      chatDispatch({ type: 'change', field: 'filteredConversations', value: conversations });
    }
  }, [searchTerm, conversations, chatDispatch]);

  // Provide all these chatbar features via context to children
  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleClearConversations,
        handlePluginKeyChange,
        handleClearPluginKey,
        handleApiKeyChange,
        // Stubs for export/import, implement actual logic if needed
        handleExportData: () => console.log('Export not implemented'),
        handleImportConversations: () => console.log('Import not implemented'),
      }}
    >
      {/* Use the themed Sidebar component */}
      <Sidebar<Conversation>
        side="left"
        isOpen={showChatbar}
        addItemButtonTitle={t('Start New Session') as string}
        // Render Conversations component, assuming it's styled appropriately
        itemComponent={<Conversations conversations={filteredConversations} />}
        // Render ChatFolders component, assuming it's styled appropriately
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations} // Pass items for default layout logic (e.g., "No data")
        searchTerm={searchTerm}
        handleSearchTerm={(term: string) =>
          chatDispatch({ type: 'change', field: 'searchTerm', value: term })
        }
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleNewConversation} // => Creates a new conversation
        handleCreateFolder={() => handleCreateFolder(t('New folder') as string, 'chat')}
        handleDrop={handleDrop}
        // Render ChatbarSettings component, assuming it's styled appropriately
        footerComponent={<ChatbarSettings />}
      />
    </ChatbarContext.Provider>
  );
};

export default Chatbar;
