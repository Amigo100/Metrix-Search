// components/ui/Dialog.tsx
import React from 'react';
import { cn } from '@/lib/utils';

// --- Dialog Root ---
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className }) => {
  // Basic modal logic: render if open. onOpenChange would typically be
  // connected to close buttons or overlay clicks in a real implementation.
  // This mock version relies on the parent controlling the 'open' prop.
  if (!open) {
    return null;
  }

  return (
    // Basic overlay and centering structure
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      {/* Dialog container - basic styling */}
      <div
        className={cn('bg-card rounded-lg shadow-lg w-full max-w-md', className)}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
};
Dialog.displayName = 'Dialog';


// --- Dialog Content ---
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={`p-6 ${className ?? ''}`}>
    {children}
  </div>
);
DialogContent.displayName = 'DialogContent';


// --- Dialog Header ---
interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  // Added border-b for common styling
  <div className={`mb-4 pb-4 border-b ${className ?? ''}`}>
    {children}
  </div>
);
DialogHeader.displayName = 'DialogHeader';


// --- Dialog Title ---
interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold ${className ?? ''}`}>
    {children}
  </h2>
);
DialogTitle.displayName = 'DialogTitle';


// --- Dialog Description ---
interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground ${className ?? ''}`}>
    {children}
  </p>
);
DialogDescription.displayName = 'DialogDescription';


// --- Dialog Footer ---
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  // Added border-t for common styling
  <div className={`mt-6 pt-4 border-t flex justify-end space-x-2 ${className ?? ''}`}>
    {children}
  </div>
);
DialogFooter.displayName = 'DialogFooter';


// --- Dialog Close ---
interface DialogCloseProps {
  children: React.ReactElement; // Expects a single React element (like a Button)
  onClick?: () => void; // Optional onClick, primarily handled by onOpenChange
  asChild?: boolean; // Include if using Slot pattern
}

const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) => {
  // Clones the child element (e.g., Button) and adds the onClick handler.
  // In a real Dialog, this onClick would typically call props.onOpenChange(false)
  // from the Dialog root component, passed down via context or props.
  // This mock version just attaches any passed onClick.
  return React.cloneElement(children, {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      if (children.props.onClick) {
        children.props.onClick(event); // Call original onClick if exists
      }
      if (onClick) {
        onClick(); // Call the onClick passed to DialogClose
      }
      // In a real implementation, you'd likely trigger the close action here,
      // perhaps by calling a function received via context from the Dialog root.
    },
  });
};
DialogClose.displayName = 'DialogClose';


// Export all related components
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};