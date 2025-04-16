// /components/Chatbar/components/ClearConversations.tsx
// UPDATED VERSION

import { Check, Trash2, X } from 'lucide-react'; // Use Lucide icons
import { FC, useState } from 'react';
import { useTranslation } from 'next-i18next';

import { SidebarButton } from '@/components/Sidebar/SidebarButton'; // Ensure path is correct

// Style constants consistent with the theme
const ghostButtonStyles = "flex items-center justify-center p-1 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300";

interface Props {
  onClearConversations: () => void;
}

export const ClearConversations: FC<Props> = ({ onClearConversations }) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const { t } = useTranslation('sidebar');

  const handleClearConversations = () => {
    onClearConversations();
    setIsConfirming(false);
  };

  // Confirmation State
  if (isConfirming) {
    return (
      // Use warning colors, consistent padding/rounding
      <div className="flex w-full items-center gap-2 rounded-md py-2 px-3 bg-red-50 border border-red-200 text-red-700">
        <Trash2 size={18} className="flex-shrink-0" />
        <div className="flex-1 text-left text-sm font-medium">
          {t('Are you sure?')}
        </div>
        {/* Use themed ghost buttons for actions */}
        <div className="flex items-center gap-1">
           <button
                className={`${ghostButtonStyles} hover:bg-green-100 hover:text-green-700`}
                onClick={(e) => { e.stopPropagation(); handleClearConversations(); }}
                title="Confirm Clear"
            >
                <Check size={18} />
            </button>
            <button
                className={`${ghostButtonStyles} hover:bg-red-100 hover:text-red-700`}
                onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                title="Cancel"
            >
                <X size={18} />
            </button>
        </div>
      </div>
    );
  }

  // Initial State (Uses updated SidebarButton)
  return (
    <SidebarButton
      text={t('Clear conversations')}
      icon={<Trash2 size={18} />} // Use Lucide icon
      onClick={() => setIsConfirming(true)}
    />
  );
};

// No default export needed if imported directly by name
