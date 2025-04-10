import React, { useContext } from 'react';
import Link from 'next/link';
import HomeContext from '@/pages/api/home/home.context';

import Chatbar from '@/components/Chatbar/Chatbar';
// Our new Tasks bar on the right
import Tasks from '@/components/Promptbar/Tasks';

import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

// OPTIONAL: If you already have these helper icons:
import { OpenSidebarButton, CloseSidebarButton } from '@/components/Sidebar/components/OpenCloseButton';

interface AppLayoutProps {
  children: React.ReactNode;
  logoSize?: number; // pass a custom logo size if you want
}

export default function AppLayout({
  children,
  logoSize = 128, // default to 64px if not provided
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  const { openModal, showSidePromptbar } = state;

  // Keep header height at 80px (example).
  const headerHeight = '80px';

  // A toggle function for the right prompt bar
  const handleTogglePromptbar = () => {
    dispatch({ field: 'showSidePromptbar', value: !showSidePromptbar });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-[#343541] text-black dark:text-white">
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-gray-900 text-white px-4 shadow flex items-center justify-between overflow-hidden"
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {/* Branding */}
        <div className="flex items-center space-x-3 flex-none">
          {/* Larger/Customizable Metrix AI Logo */}
          <img
            src="/MetrixAI.png"
            alt="Metrix AI Logo"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              objectFit: 'contain',
            }}
          />
          <h2 className="text-xl font-semibold"></h2>
        </div>

        {/* Centered Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center" style={{ gap: '2rem' }}>
            <Link href="/dashboard" className="text-base hover:underline">
              Dashboard
            </Link>
            <Link href="/clinical-scribe" className="text-base hover:underline">
              Clinical Scribe
            </Link>
            <Link href="/predictive-analytics" className="text-base hover:underline">
              Predictive Analytics
            </Link>
            <Link href="/clinical-scoring-tools" className="text-base hover:underline">
              Clinical Scoring Tools
            </Link>
            <Link href="/diagnostic-assistance" className="text-base hover:underline">
              Diagnostic Assistance
            </Link>
          </nav>
        </div>

        {/* Example: Toggle Right Promptbar Button */}
        <div className="flex-none">
          {/* If you want a simple text button: 
          <button
            onClick={handleTogglePromptbar}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md"
          >
            {showSidePromptbar ? 'Close Right Bar' : 'Open Right Bar'}
          </button>
          */}

          {/* Or use your existing open/close arrow icons from OpenCloseButton.tsx: */}
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
          {/* If you have a bottom bar or pinned content, place it here */}
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
