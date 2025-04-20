// file: /components/Sidebar/SidebarButton.tsx
// -----------------------------------------------------------------------------
// Adds a default export so the component can be imported either as
//   import SidebarButton from '...'
// or
//   import { SidebarButton } from '...'
// -----------------------------------------------------------------------------

import React, { FC } from 'react';

interface Props {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
}

export const SidebarButton: FC<Props> = ({
  text,
  icon,
  onClick,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
        transition-colors duration-150 ease-in-out
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-teal-50'}
      `}
    >
      {/* icon is pre‑rendered with desired size */}
      {icon}
      <span className="truncate">{text}</span>
    </button>
  );
};

/* Default export so both import styles work */
export default SidebarButton;
