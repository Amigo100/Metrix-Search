// file: /layouts/AppLayout.tsx

import React, { useContext } from 'react';
import Link from 'next/link';
import HomeContext from '@/pages/api/home/home.context';

import Chatbar from '@/components/Chatbar/Chatbar';
import Tasks from '@/components/Promptbar/Tasks';

import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

import {
  OpenSidebarButton,
  CloseSidebarButton,
} from '@/components/Sidebar/components/OpenCloseButton';

interface AppLayoutProps {
  children: React.ReactNode;
  logoSize?: number; // pass a custom logo size if you want
}

export default function AppLayout({
  children,
  logoSize = 100, // default 128px
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  const { openModal, showSidePromptbar, showChatbar } = state;

  // Keep header height at 80px, for example
  const headerHeight = '80px';

  // Toggle function for the right prompt bar
  const handleTogglePromptbar = () => {
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: !showSidePromptbar,
    });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-[#343541] text-black dark:text-black">
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-neutral-50 text-black px-4 
                   shadow-md border-b border-gray-200 
                   flex items-center justify-between overflow-hidden"
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {/* Branding */}
        <div className="flex items-center space-x-3 flex-none">
          <img
            src="/MetrixAI.png"
            alt="Metrix AI Logo"
            style={{
              width: `${logoSize * 0.5}px`,  // Reduced by 30%
              height: `${logoSize * 0.5}px`, // Reduced by 30%
              objectFit: 'contain',
            }}
          />
          <h2 className="text-2xl font-semibold">Metrix</h2>
        </div>
        

        {/* Centered Navigation */}
        <div
          className="flex-1 flex justify-center"
          style={{
            // Shift nav based on whether the sidebars are open
            marginLeft: showChatbar ? '210px' : '0px',
            marginRight: showSidePromptbar ? '250px' : '0px',
            transition: 'margin 0.3s ease',
          }}
        >
          <nav className="flex items-center" style={{ gap: '2rem' }}>
            <Link href="/dashboard" className="text-base hover:underline">
              Dashboard
            </Link>
            <Link href="/clinical-scribe" className="text-base hover:underline">
              AI Scribe
            </Link>
            <Link href="/predictive-analytics" className="text-base hover:underline">
              Predictive Insights
            </Link>
            <Link href="/clinical-scoring-tools" className="text-base hover:underline">
              Risk & Scoring
            </Link>
            <Link href="/diagnostic-assistance" className="text-base hover:underline">
              AI Medical Assistant
            </Link>
          </nav>
        </div>

        {/* Toggle Right Promptbar Button */}
        <div className="flex-none">
          {showSidePromptbar ? (
            <CloseSidebarButton side="right" onClick={handleTogglePromptbar} />
          ) : (
            <OpenSidebarButton side="right" onClick={handleTogglePromptbar} />
          )}
        </div>
      </header>

      {/* Main Flex Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Chatbar */}
        <Chatbar />

        {/* Main Content (flex-1) */}
        <main className="flex-1 flex flex-col overflow-y-auto relative">
          {children}
        </main>

        {/* Right Tasks Sidebar */}
        <Tasks />
      </div>

      {/* Modals */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
}
