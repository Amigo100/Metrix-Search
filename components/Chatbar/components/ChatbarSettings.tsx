// /components/Chatbar/components/ChatbarSettings.tsx
// UPDATED VERSION (Style Consistency & Lucide Icons)

import {
    Settings,       // Lucide replacement for IconSettings
    User,           // Lucide replacement for IconUser
    LayoutTemplate, // Lucide replacement for IconTemplate (or Sheet, FileText depending on preference)
    HelpCircle,     // Lucide replacement for IconHelpCircle
} from 'lucide-react'; // Switch to Lucide icons
import { useContext } from 'react';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';
import ChatbarContext from '../Chatbar.context';
// NOTE: Ensure ClearConversations and Key components are also styled consistently
import { ClearConversations } from './ClearConversations';
import { Key } from '../../Settings/Key';
// NOTE: Ensure SidebarButton component uses theme-consistent styling internally
// (e.g., hover:bg-teal-50 hover:text-teal-700, appropriate padding/rounding)
import { SidebarButton } from '../../Sidebar/SidebarButton';

export const ChatbarSettings = () => {
    const { t } = useTranslation('sidebar');

    const {
        state: { apiKey, serverSideApiKeyIsSet, conversations },
        dispatch: homeDispatch,
    } = useContext(HomeContext);

    const { handleClearConversations, handleApiKeyChange } = useContext(ChatbarContext);

    return (
        // Updated container: removed items-center for full-width buttons, softer text, padding
        <div className="flex flex-col space-y-1 border-t border-gray-200 pt-2 pb-1 px-2 text-sm text-gray-700">
            {/* Clear Conversations Button (Assumes internal styling updated) */}
            {conversations.length > 0 && (
                <ClearConversations onClearConversations={handleClearConversations} />
            )}

            {/* Sidebar Buttons (Assumes internal styling updated) */}
            <SidebarButton
                text={t('Profile')}
                icon={<User size={18} />} // Use Lucide icon
                onClick={() =>
                    homeDispatch({
                        type: 'change',
                        field: 'openModal',
                        value: 'profile',
                    })
                }
            />

            <SidebarButton
                text={t('Templates')}
                icon={<LayoutTemplate size={18} />} // Use Lucide icon
                onClick={() =>
                    homeDispatch({
                        type: 'change',
                        field: 'openModal',
                        value: 'templates',
                    })
                }
            />

            <SidebarButton
                text={t('Help')}
                icon={<HelpCircle size={18} />} // Use Lucide icon
                onClick={() =>
                    homeDispatch({
                        type: 'change',
                        field: 'openModal',
                        value: 'help',
                    })
                }
            />

            <SidebarButton
                text={t('Settings')}
                icon={<Settings size={18} />} // Use Lucide icon
                onClick={() =>
                    homeDispatch({
                        type: 'change',
                        field: 'openModal',
                        value: 'settings',
                    })
                }
            />

            {/* API Key Component (Assumes internal styling updated) */}
            {!serverSideApiKeyIsSet && (
                <div className="mt-1 border-t border-gray-200 pt-2"> {/* Added separator */}
                    <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
                </div>
            )}
        </div>
    );
};

export default ChatbarSettings;
