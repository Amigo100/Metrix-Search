// /components/Sidebar/SidebarButton.tsx
// UPDATED VERSION

import React, { FC } from 'react'; // Ensure React is imported if JSX is used (implicitly needed)

interface Props {
  text: string;
  icon: JSX.Element; // Icon is passed as a pre-rendered element
  onClick: () => void;
  // featured?: boolean; // Removing featured for now unless specific styling is defined
  disabled?: boolean; // Added disabled prop
}

export const SidebarButton: FC<Props> = ({ text, icon, onClick, disabled }) => {
  return (
    <button
      className={`
        flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
        transition-colors duration-150 ease-in-out cursor-pointer
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-teal-50'
        }
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Clone the icon to potentially add classes if needed, otherwise render directly */}
      {/* React.cloneElement(icon, { size: 18, className: 'flex-shrink-0' }) */}
      {/* Simpler: Render directly, assuming icon has size set */}
      {icon}
      <span className="truncate">{text}</span> {/* Added truncate for long text */}
    </button>
  );
};

// No default export needed if imported directly by name
