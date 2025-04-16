import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react';
import React, { ReactNode } from 'react'; // Import React
import { useTranslation } from 'react-i18next';

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton'; // Adjust path as needed

import Search from '../Search'; // Adjust path as needed

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
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void; // Corrected type for e
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
  const { t } = useTranslation('promptbar'); // Assuming 'promptbar' is the correct namespace

  // Drag & drop helpers
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => { // Corrected type
    e.preventDefault();
  };
  const highlightDrop = (e: React.DragEvent<HTMLDivElement>) => { // Corrected type
    // Updated highlight color for light theme
    (e.target as HTMLElement).style.background = 'rgba(20, 184, 166, 0.1)'; // teal-500 with low opacity
  };
  const removeHighlight = (e: React.DragEvent<HTMLDivElement>) => { // Corrected type
    (e.target as HTMLElement).style.background = 'none';
  };

  return isOpen ? (
    <div className="relative h-full"> {/* Added relative positioning for close button */}
      <div
        // Updated styling for light theme
        className={`
          fixed top-0 ${side}-0 z-20 flex h-full w-[260px] flex-col space-y-3 /* Increased space */
          bg-white shadow-lg border-r border-gray-200 /* Changed border side */
          text-gray-800 p-3 text-sm transition-transform duration-300 ease-in-out /* Adjusted padding */
          /* Removed sm:relative sm:top-0 as AppLayout handles responsiveness */
          ${className ?? ''}
        `}
      >
        {children ? (
          // If custom children are provided, render them
          children
        ) : (
          // Otherwise, render the default layout (used by Chatbar, etc.)
          <>
            <div className="flex items-center gap-2"> {/* Use gap */}
              {handleCreateItem && addItemButtonTitle && (
                <button
                  // Updated button styling
                  className={`
                    flex flex-grow items-center gap-2 cursor-pointer
                    rounded-md border border-gray-300 p-3 text-gray-700
                    transition-colors duration-200 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700
                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500
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
                  // Updated button styling
                  className={`
                    flex flex-shrink-0 cursor-pointer items-center justify-center
                    rounded-md border border-gray-300 p-3 text-gray-600
                    transition-colors duration-200 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700
                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500
                  `}
                  onClick={handleCreateFolder}
                  title="Create Folder" // Added title
                >
                  <IconFolderPlus size={16} />
                </button>
              )}
            </div>

            {/* Assuming Search component is styled consistently */}
            {handleSearchTerm && (
              <Search
                placeholder={t('Search...') || ''}
                searchTerm={searchTerm || ''}
                onSearch={handleSearchTerm}
              />
            )}

            {/* Main content area */}
            <div className="flex-grow overflow-auto pr-1" style={{ scrollbarWidth: 'thin' }}> {/* Added padding-right for scrollbar */}
              {items && items.length > 0 && folderComponent && (
                // Updated border color
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
                 // Updated "No data" state styling
                <div className="mt-8 select-none text-center text-gray-400">
                  <IconMistOff className="mx-auto mb-3 h-8 w-8" /> {/* Made icon larger */}
                  <span className="text-sm leading-normal">{t('No data.')}</span>
                </div>
              )}
            </div>

            {/* Footer area */}
            {footerComponent && (
                // Updated border color
                <div className="pt-2 border-t border-gray-200 flex-shrink-0">
                    {footerComponent}
                </div>
            )}
          </>
        )}
      </div>

      {/* Close button positioned relative to the sidebar itself */}
      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  );
};

export default Sidebar;
