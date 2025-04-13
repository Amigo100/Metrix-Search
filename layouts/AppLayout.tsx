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
  logoSize = 128, // default to 128px
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  const { openModal, showSidePromptbar } = state;

  // Keep header height at 80px (example).
  const headerHeight = '80px';

  // A toggle function for the right prompt bar
  const handleTogglePromptbar = () => {
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: !showSidePromptbar,
    });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-neutral-50 text-neutral-800 dark:bg-[#343541] dark:text-white font-sans">
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between bg-brand-dark text-white px-4 shadow"
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {/* Branding */}
        <div className="flex items-center space-x-3 flex-none">
          <img
            src="/MetrixAI.png"
            alt="ClinSync Logo"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              objectFit: 'contain',
            }}
          />
          <h2 className="text-xl font-semibold">ClinSync</h2>
        </div>

        {/* Centered Navigation */}
        <nav className="flex-1 flex justify-center space-x-8">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/clinical-scribe" className="hover:underline">
            Clinical Scribe
          </Link>
          <Link href="/predictive-analytics" className="hover:underline">
            Predictive Analytics
          </Link>
          <Link href="/clinical-scoring-tools" className="hover:underline">
            Clinical Scoring Tools
          </Link>
          <Link href="/diagnostic-assistance" className="hover:underline">
            Diagnostic Assistance
          </Link>
          <Link href="/guidelines-search" className="hover:underline">
            Guidelines Search
          </Link>
        </nav>

        {/* Example: Toggle Right Promptbar Button */}
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

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 text-center py-2 shadow-inner">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} ClinSync. All rights reserved.
        </p>
      </footer>

      {/* Modals */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
}
