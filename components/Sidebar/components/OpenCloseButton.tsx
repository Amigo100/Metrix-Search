// file: /components/Sidebar/components/OpenCloseButton.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  side: 'left' | 'right';
  onClick: () => void;
}

/* Keep in sync with AppLayout */
const HEADER_HEIGHT = 80;   // px
const CHATBAR_WIDTH   = 240; // px → left sidebar inner edge
const PROMPTBAR_WIDTH = 300; // px → right sidebar inner edge

/* ── CLOSE (sidebar is open) ────────────────────────────────────────────── */
export const CloseSidebarButton: React.FC<Props> = ({ side, onClick }) => {
  const offset =
    side === 'left' ? { left: CHATBAR_WIDTH } : { right: PROMPTBAR_WIDTH };

  return (
    <button
      onClick={onClick}
      className="z-40 h-8 w-8 fixed flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:text-white bg-teal-300 shadow"
      style={{ top: HEADER_HEIGHT, ...offset }}
      aria-label="Close sidebar"
    >
      {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
};

/* ── OPEN (sidebar is closed) ───────────────────────────────────────────── */
export const OpenSidebarButton: React.FC<Props> = ({ side, onClick }) => {
  const offset = side === 'left' ? { left: 0 } : { right: 0 };

  return (
    <button
      onClick={onClick}
      className={`z-40 h-8 w-8 fixed flex items-center justify-center
                  ${side === 'left' ? 'rounded-r-md' : 'rounded-l-md'}
                  bg-gray-100 text-gray-600 hover:text-white bg-teal-300 shadow`}
      style={{ top: HEADER_HEIGHT, ...offset }}
      aria-label="Open sidebar"
    >
      {side === 'left' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  );
};
