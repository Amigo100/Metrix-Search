// file: /layouts/AppLayout.tsx
'use client';

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
  logoSize?: number;
}

export default function AppLayout({
  children,
  logoSize = 100,
}: AppLayoutProps) {
  const { state, dispatch } = useContext(HomeContext);
  const { openModal, showSidePromptbar, showChatbar } = state;

  const headerHeight = 80; // px

  /* ───── toggle helpers ───── */
  const handleTogglePromptbar = () => {
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: !showSidePromptbar,
    });
    localStorage.setItem(
      'showSidePromptbar',
      JSON.stringify(!showSidePromptbar),
    );
  };

  const handleToggleChatbar = () => {
    dispatch({
      type: 'change',
      field: 'showChatbar',
      value: !showChatbar,
    });
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar));
  };

  /* ───── layout ───── */
  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-[#343541] text-black dark:text-black relative">
      {/* ───────────────── Header ───────────────── */}
      <header
        className="sticky top-0 z-30 bg-white text-gray-800 px-4 shadow-md border-b border-gray-200 flex items-center justify-between overflow-hidden"
        style={{ height: headerHeight }}
      >
        {/* Logo */}
        <div className="flex items-center space-x-3 flex-none">
          <img
            src="/MetrixAI.png"
            alt="Metrix AI Logo"
            style={{
              width: `${logoSize * 0.5}px`,
              height: `${logoSize * 0.5}px`,
              objectFit: 'contain',
            }}
          />
          <h2 className="text-xl font-semibold text-gray-900">Metrix</h2>
        </div>

        {/* Navigation */}
        <div
          className="flex-1 flex justify-center"
          style={{
            marginLeft: showChatbar ? '210px' : '0px',
            marginRight: showSidePromptbar ? '250px' : '0px',
            transition: 'margin 0.3s ease',
          }}
        >
          <nav className="flex items-center" style={{ gap: '2rem' }}>
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              Home
            </Link>
            <Link href="/clinical-scribe" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              AI Scribe
            </Link>
            <Link href="/patients-fullscreen" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              Patient Tasks
            </Link>
            <Link href="/predictive-analytics" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              Predictive Insights
            </Link>
            <Link href="/clinical-scoring-tools" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              Risk & Scoring
            </Link>
            <Link href="/diagnostic-assistance" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              AI Medical Assistant
            </Link>
            <Link href="/semantic-search" className="text-sm font-medium text-gray-600 hover:text-teal-600">
              Policy Search
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────────────── Sidebar toggle buttons ───────────────── */}
      {/* left (chat) */}
      <div
        className="absolute z-30"
        style={{
          top: headerHeight - 18, // align with bottom border of header
          left: showChatbar ? 210 : 0, // inside edge of chatbar
          transition: 'left 0.3s ease',
        }}
      >
        {showChatbar ? (
          <CloseSidebarButton side="left" onClick={handleToggleChatbar} />
        ) : (
          <OpenSidebarButton side="left" onClick={handleToggleChatbar} />
        )}
      </div>

      {/* right (prompt bar) */}
      <div
        className="absolute z-30"
        style={{
          top: headerHeight - 18,
          right: showSidePromptbar ? 250 : 0,
          transition: 'right 0.3s ease',
        }}
      >
        {showSidePromptbar ? (
          <CloseSidebarButton side="right" onClick={handleTogglePromptbar} />
        ) : (
          <OpenSidebarButton side="right" onClick={handleTogglePromptbar} />
        )}
      </div>

      {/* ───────────────── Main Row ───────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <Chatbar />
        <main className="flex-1 flex flex-col overflow-y-auto relative">
          {children}
        </main>
        <Tasks />
      </div>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-gray-600 text-sm">
        <div className="flex justify-between items-center">
          <div>© {new Date().getFullYear()} Metrix AI. All rights reserved.</div>
          <div>
            <Link href="https://www.metrixai.com/privacy" className="hover:text-teal-600 hover:underline">
              Privacy Policy
            </Link>
            {' | '}
            <Link href="https://www.metrixai.com/terms" className="hover:text-teal-600 hover:underline">
              Terms of Service
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
