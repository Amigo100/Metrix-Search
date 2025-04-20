// file: /components/Sidebar/components/OpenCloseButton.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  side: 'left' | 'right';
  onClick: () => void;
}

/*  HEADER_HEIGHT MUST match AppLayout (80 px)  */
const HEADER_HEIGHT = 80;

/* width of the sidebar */
const SIDEBAR_WIDTH = 260;

export const CloseSidebarButton: React.FC<Props> = ({ side, onClick }) => (
  <button
    onClick={onClick}
    className={`
      fixed z-40
      top-[${HEADER_HEIGHT}px]
      ${side === 'left' ? `left-[${SIDEBAR_WIDTH}px]` : `right-[${SIDEBAR_WIDTH}px]`}
      m-0 flex h-8 w-8 items-center justify-center
      rounded-r-md bg-teal-600 text-white hover:bg-teal-700
    `}
  >
    {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </button>
);

export const OpenSidebarButton: React.FC<Props> = ({ side, onClick }) => (
  <button
    onClick={onClick}
    className={`
      fixed z-40
      top-[${HEADER_HEIGHT}px]
      ${side === 'left' ? 'left-0 rounded-r-md' : 'right-0 rounded-l-md'}
      m-0 flex h-8 w-8 items-center justify-center
      bg-teal-600 text-white hover:bg-teal-700
    `}
  >
    {side === 'left' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
  </button>
);
