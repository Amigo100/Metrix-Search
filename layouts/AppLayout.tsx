// file: /layouts/AppLayout.tsx
// UPDATED VERSION (Theme Alignment)

import React, { useContext } from 'react';
import Link from 'next/link';
import HomeContext from '@/pages/api/home/home.context';

// Assuming Chatbar and Tasks have their own themed styling
import Chatbar from '@/components/Chatbar/Chatbar';
import Tasks from '@/components/Promptbar/Tasks'; // Assuming Promptbar directory

// Modals (styling assumed consistent)
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

// Sidebar Buttons (styling assumed consistent - e.g., using ghostButtonStyles)
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
  logoSize = 100, // default 100px for logo base size
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  // Ensure openModal, showSidePromptbar, showChatbar are destructured if needed elsewhere
  const { openModal, showSidePromptbar, showChatbar } = state;

  const headerHeight = '72px'; // Slightly reduced standard header height

  // Toggle function for the right prompt bar (Tasks)
  const handleTogglePromptbar = () => {
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: !showSidePromptbar,
    });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  return (
    // Use a light gray base background, default text color
    <div className="w-full h-screen flex flex-col bg-gray-50 text-gray-800">

      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white text-gray-800 px-4
                   shadow-sm border-b border-gray-200  /* Lighter border, smaller shadow */
                   flex items-center justify-between overflow-hidden"
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {/* Branding */}
        <div className="flex items-center space-x-3 flex-none">
          <img
            src="/MetrixAI.png" // Logo path
            alt="Metrix AI Logo"
            style={{
              // Keep logo logic, maybe adjust multiplier if needed
              width: `${logoSize * 0.4}px`, // Adjusted multiplier for 72px header
              height: `${logoSize * 0.4}px`,
              objectFit: 'contain',
            }}
          />
          {/* Consistent Title Style */}
          <h2 className="text-xl font-semibold text-gray-900">Metrix</h2>
        </div>

        {/* Centered Navigation */}
        <div
          className="flex-1 flex justify-center"
          style={{
            // Keep margin logic for centering
            marginLeft: showChatbar ? '210px' : '0px', // Adjust based on actual Chatbar width
            marginRight: showSidePromptbar ? '250px' : '0px', // Adjust based on actual Tasks width
            transition: 'margin 0.3s ease',
          }}
        >
          {/* Themed Nav Links */}
          <nav className="flex items-center space-x-6 md:space-x-8"> {/* Increased spacing */}
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
              Home
            </Link>
            <Link href="/clinical-scribe" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
              AI Scribe
            </Link>
            {/* Add other links back if they exist */}
             <Link href="/predictive-analytics" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
               Predictive Insights
             </Link>
             <Link href="/clinical-scoring-tools" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
               Risk & Scoring
             </Link>
             <Link href="/diagnostic-assistance" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
               AI Assistant
             </Link>
          </nav>
        </div>

        {/* Toggle Right Promptbar Button */}
        <div className="flex-none">
            {/* Assuming Open/Close buttons are styled consistently (e.g., ghostButton) */}
            {showSidePromptbar ? (
                <CloseSidebarButton side="right" onClick={handleTogglePromptbar} />
            ) : (
                <OpenSidebarButton side="right" onClick={handleTogglePromptbar} />
            )}
        </div>
      </header>

      {/* Main Flex Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Chatbar (styling assumed internal) */}
        <Chatbar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto relative bg-gradient-to-b from-white via-teal-50 to-white"> {/* Apply gradient here */}
          {children}
        </main>

        {/* Right Tasks Sidebar (styling assumed internal) */}
        <Tasks />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 text-gray-600 text-xs"> {/* Lighter border, smaller text/padding */}
        <div className="flex justify-between items-center">
          <div>© {new Date().getFullYear()} Metrix AI. All rights reserved.</div>
          <div className="space-x-4"> {/* Added spacing */}
            <Link href="https://www.metrixai.com/privacy" className="hover:text-teal-600 hover:underline">
              Privacy Policy
            </Link>
            {/* Use a span for separator for better spacing control */}
            <span>|</span>
            <Link href="https://www.metrixai.com/terms" className="hover:text-teal-600 hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
}
