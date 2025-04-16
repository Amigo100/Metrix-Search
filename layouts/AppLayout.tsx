// file: /layouts/AppLayout.tsx

import React, { useContext } from 'react';
import Link from 'next/link';
import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed

// Assuming these components exist and are styled appropriately or accept classes
import Chatbar from '@/components/Chatbar/Chatbar'; // Adjust path
import Tasks from '@/components/Promptbar/Tasks'; // Adjust path

// Assuming Modal components exist
import { ProfileModal } from '@/components/Modals/ProfileModal'; // Adjust path
import { TemplatesModal } from '@/components/Modals/TemplatesModal'; // Adjust path
import { HelpModal } from '@/components/Modals/HelpModal'; // Adjust path
import { SettingsModal } from '@/components/Modals/SettingsModal'; // Adjust path

// Assuming Sidebar button components exist and are styled appropriately
import {
  OpenSidebarButton,
  CloseSidebarButton,
} from '@/components/Sidebar/components/OpenCloseButton'; // Adjust path

interface AppLayoutProps {
  children: React.ReactNode;
  logoSize?: number; // pass a custom logo size if you want
}

export default function AppLayout({
  children,
  logoSize = 40, // Default logo size (adjust as needed, e.g., 40px for h-10)
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  const { openModal, showSidePromptbar, showChatbar } = state;

  // Keep header height consistent (e.g., 72px or 80px)
  const headerHeight = '72px'; // Example height using Tailwind's h-18 would be 72px

  // Toggle function for the right prompt bar (Logic preserved)
  const handleTogglePromptbar = () => {
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: !showSidePromptbar,
    });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  // Toggle function for the left chat bar (Assuming similar logic exists or can be added)
   const handleToggleChatbar = () => {
     dispatch({ type: 'change', field: 'showChatbar', value: !showChatbar });
     localStorage.setItem('showChatbar', JSON.stringify(!showChatbar));
   };


  return (
    // Updated main container background to light theme
    <div className="w-full h-screen flex flex-col bg-gray-100 text-gray-900">
      {/* Header - Updated Styling */}
      <header
        className="sticky top-0 z-30 bg-white text-gray-800 px-4 md:px-6
                   shadow-md border-b border-gray-200
                   flex items-center justify-between overflow-hidden"
        style={{ height: headerHeight, minHeight: headerHeight }}
      >
        {/* Left side: Chatbar Toggle and Branding */}
        <div className="flex items-center space-x-3 flex-none">
           {/* Left Sidebar Toggle */}
           {showChatbar ? (
             <CloseSidebarButton side="left" onClick={handleToggleChatbar} />
           ) : (
             <OpenSidebarButton side="left" onClick={handleToggleChatbar} />
           )}
           {/* Branding */}
           <Link href="/dashboard" legacyBehavior>
             <a className="flex items-center space-x-2">
                <img
                    src="/images/metrix-logo.png" // Consistent logo path
                    alt="Metrix Logo"
                    style={{
                      // Use height matching common Tailwind sizes or direct px
                      height: `${logoSize}px`, // Use prop or default
                      width: 'auto', // Maintain aspect ratio
                    }}
                    // Or use Tailwind classes if preferred: className="h-8 w-auto" or "h-10 w-auto"
                />
                <span className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:inline">Metrix</span>
             </a>
           </Link>
        </div>

        {/* Centered Navigation - Updated Styling */}
        <div
          className="flex-1 flex justify-center transition-all duration-300 ease-in-out" // Use transition-all
          style={{
            // Dynamic margins based on sidebar state (Logic preserved)
            marginLeft: showChatbar ? '260px' : '0px', // Adjust based on Chatbar width
            marginRight: showSidePromptbar ? '260px' : '0px', // Adjust based on Tasks width
          }}
        >
          {/* Navigation Links - Updated Styling */}
          <nav className="flex items-center space-x-4 md:space-x-6 lg:space-x-8">
            <Link href="/dashboard" legacyBehavior>
              <a className="text-sm md:text-base text-gray-600 hover:text-teal-600 font-medium transition-colors">Home</a>
            </Link>
            <Link href="/clinical-scribe" legacyBehavior>
              <a className="text-sm md:text-base text-gray-600 hover:text-teal-600 font-medium transition-colors">AI Scribe</a>
            </Link>
            <Link href="/predictive-analytics" legacyBehavior>
              <a className="text-sm md:text-base text-gray-600 hover:text-teal-600 font-medium transition-colors">Predictive Insights</a>
            </Link>
            <Link href="/clinical-scoring-tools" legacyBehavior>
              <a className="text-sm md:text-base text-gray-600 hover:text-teal-600 font-medium transition-colors">Risk & Scoring</a>
            </Link>
            <Link href="/diagnostic-assistance" legacyBehavior>
              <a className="text-sm md:text-base text-gray-600 hover:text-teal-600 font-medium transition-colors">AI Medical Assistant</a>
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
        {/* Left Chatbar - Assuming it's styled consistently */}
        {/* The Chatbar component itself controls its visibility via state.showChatbar */}
        <Chatbar />

        {/* Main Content (flex-1) */}
        {/* Ensure child pages have appropriate backgrounds if needed */}
        <main className="flex-1 flex flex-col overflow-y-auto relative bg-gray-100">
          {children}
        </main>

        {/* Right Tasks Sidebar - Assuming it's styled consistently */}
        {/* The Tasks component itself controls its visibility via state.showSidePromptbar */}
        <Tasks />
      </div>

      {/* Footer - Updated Styling */}
      {/* Removed Footer as it's typically not part of an App Layout like this */}
      {/* If a footer is needed, uncomment and style similarly:
      <footer className="bg-white border-t border-gray-200 py-3 px-6 text-gray-600 text-xs">
        <div className="flex justify-between items-center">
          <div>© {new Date().getFullYear()} Metrix Health Ltd. All rights reserved.</div>
          <div className="space-x-4">
            <Link href="/privacy" legacyBehavior><a className="hover:text-teal-600 hover:underline">Privacy Policy</a></Link>
            <Link href="/terms" legacyBehavior><a className="hover:text-teal-600 hover:underline">Terms of Service</a></Link>
          </div>
        </div>
      </footer>
      */}

      {/* Modals - Assuming styled consistently */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
}
