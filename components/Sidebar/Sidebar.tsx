// file: /components/Sidebar/Sidebar.tsx
import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton';

import Search from '../Search';

interface Props<T> {
  isOpen: boolean;
  side: 'left' | 'right';
  toggleOpen: () => void;
  className?: string;

  addItemButtonTitle?: string;
  items?: T[];
  itemComponent?: ReactNode;
  folderComponent?: ReactNode;
  footerComponent?: ReactNode;
  searchTerm?: string;
  handleSearchTerm?: (searchTerm: string) => void;
  handleCreateItem?: () => void;
  handleCreateFolder?: () => void;
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}

const SIDEBAR_WIDTH = 260;        // px   (matches w-[260px] below)
const HEADER_HEIGHT = 80;         // px   (from AppLayout)

const Sidebar = <T,>({
  isOpen,
  side,
  toggleOpen,
  className,
  addItemButtonTitle,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
  children,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');

  /* ---------------- drag helpers ---------------- */
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const highlightDrop = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.background = 'rgba(20, 184, 166, 0.1)';
  };
  const removeHighlight = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.background = 'none';
  };

  /* ───────────── OPEN STATE ───────────── */
  if (isOpen) {
    return (
      <>
        {/* fixed sidebar body */}
        <div className="relative h-full">
          <div
            className={`
              fixed top-0 ${side}-0 z-20 flex h-full w-[${SIDEBAR_WIDTH}px] flex-col space-y-3
              bg-white shadow-lg border-r border-gray-200 text-gray-800 p-3 text-sm
              transition-transform duration-300 ease-in-out
              ${className ?? ''}
            `}
          >
            {children ? (
              children
            ) : (
              <>
                {/* header buttons */}
                <div className="flex items-center gap-2">
                  {handleCreateItem && addItemButtonTitle && (
                    <button
                      className="flex flex-grow items-center gap-2 rounded-md border border-gray-300 p-3 text-gray-700 transition hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                      onClick={() => {
                        handleCreateItem();
                        handleSearchTerm && handleSearchTerm('');
                      }}
                    >
                      <IconPlus size={16} />
                      {addItemButtonTitle}
                    </button>
                  )}
                  {handleCreateFolder && (
                    <button
                      className="flex flex-shrink-0 items-center justify-center rounded-md border border-gray-300 p-3 text-gray-600 transition hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                      onClick={handleCreateFolder}
                      title="Create Folder"
                    >
                      <IconFolderPlus size={16} />
                    </button>
                  )}
                </div>

                {handleSearchTerm && (
                  <Search
                    placeholder={t('Search...') || ''}
                    searchTerm={searchTerm || ''}
                    onSearch={handleSearchTerm}
                  />
                )}

                {/* main list */}
                <div
                  className="flex-grow overflow-auto pr-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {items && items.length > 0 && folderComponent && (
                    <div className="flex border-b border-gray-200 pb-2">
                      {folderComponent}
                    </div>
                  )}
                  {items && items.length > 0 && itemComponent ? (
                    <div
                      className="pt-2"
                      onDrop={handleDrop}
                      onDragOver={allowDrop}
                      onDragEnter={highlightDrop}
                      onDragLeave={removeHighlight}
                    >
                      {itemComponent}
                    </div>
                  ) : (
                    <div className="mt-8 select-none text-center text-gray-400">
                      <IconMistOff className="mx-auto mb-3 h-8 w-8" />
                      <span className="text-sm leading-normal">
                        {t('No data.')}
                      </span>
                    </div>
                  )}
                </div>

                {footerComponent && (
                  <div className="pt-2 border-t border-gray-200 flex-shrink-0">
                    {footerComponent}
                  </div>
                )}
              </>
            )}
          </div>

          {/* close button – fixed, aligned to inner edge */}
          <div
            className="fixed z-30"
            style={{
              top: HEADER_HEIGHT,
              [side]: SIDEBAR_WIDTH,
            }}
          >
            <CloseSidebarButton onClick={toggleOpen} side={side} />
          </div>
        </div>
      </>
    );
  }

  /* ───────────── CLOSED STATE ───────────── */
  return (
    <div
      className="fixed z-30"
      style={{
        top: HEADER_HEIGHT,
        [side]: 0,
      }}
    >
      <OpenSidebarButton onClick={toggleOpen} side={side} />
    </div>
  );
};

export default Sidebar;
