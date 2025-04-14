// components/Sidebar.tsx
import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react';
import { ReactNode } from 'react';
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

  /** Optionally, override the container's default classes. */
  className?: string; // <-- ADDED

  // The following props are optional—if you supply children, those will be rendered instead.
  addItemButtonTitle?: string;
  items?: T[];
  itemComponent?: ReactNode;
  folderComponent?: ReactNode;
  footerComponent?: ReactNode;
  searchTerm?: string;
  handleSearchTerm?: (searchTerm: string) => void;
  handleCreateItem?: () => void;
  handleCreateFolder?: () => void;
  handleDrop?: (e: any) => void;
  children?: ReactNode;
}

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

  // Drag & drop helpers
  const allowDrop = (e: any) => {
    e.preventDefault();
  };
  const highlightDrop = (e: any) => {
    e.target.style.background = '#3f3f46'; // e.g. dark gray to indicate drop target
  };
  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };

  return isOpen ? (
    <div>
      <div
        // Merge default classes with optional className
        className={`
          fixed top-0 ${side}-0 z-40 flex h-full w-[260px] flex-col space-y-2
          bg-neutral-50 text-black p-2 text-[14px] transition-all
          sm:relative sm:top-0
          ${className ?? ''}
        `}
      >
        {children ? (
          // If custom children are provided, render them
          children
        ) : (
          // Otherwise, render the default layout (used by Chatbar, etc.)
          <>
            <div className="flex items-center">
              {handleCreateItem && addItemButtonTitle && (
                <button
                  className={`
                    flex w-[190px] flex-shrink-0 cursor-pointer items-center gap-3
                    rounded-md border border-gray-200 p-3 text-black
                    transition-colors duration-200 hover:bg-gray-100
                  `}
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
                  className={`
                    ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3
                    rounded-md border border-gray-200 p-3 text-sm text-black
                    transition-colors duration-200 hover:bg-gray-100
                  `}
                  onClick={handleCreateFolder}
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

            <div className="flex-grow overflow-auto">
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
                <div className="mt-8 select-none text-center opacity-50">
                  <IconMistOff className="mx-auto mb-3" />
                  <span className="text-[14px] leading-normal">{t('No data.')}</span>
                </div>
              )}
            </div>

            {footerComponent}
          </>
        )}
      </div>

      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  );
};

export default Sidebar;
