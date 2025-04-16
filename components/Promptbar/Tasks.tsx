'use client';
// -------------------------------------------------------------
//  TasksSidebar.tsx – Collapsible patient‑tracker sidebar
//  Fixes applied:
//    • real toggle via HomeContext.setShowSidePromptbar
//    • sidebar border/width classes removed when collapsed
//    • added collapse/expand button in the header
// -------------------------------------------------------------

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useContext,
  useRef,
} from 'react';

import {
  Plus,
  Clock,
  AlertTriangle,
  X,
  Edit3,
  Save,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  MessageSquare,
  BellOff,
  AlarmClockOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  format,
  differenceInMinutes,
  addMinutes,
  formatDistanceToNowStrict,
  parse,
  formatRelative,
  isValid,
  subMinutes,
} from 'date-fns';

//------------------------------------------------------------------
//  HomeContext – now carries BOTH value and setter so consumers
//  re‑render when the sidebar is toggled.
//------------------------------------------------------------------

type HomeCtx = {
  showSidePromptbar: boolean;
  setShowSidePromptbar: React.Dispatch<React.SetStateAction<boolean>>;
};

//  ⚠️  In production this context lives in its own file and the
//  provider wraps <App />.  This in‑file version makes the Tasks
//  component standalone for copy‑paste.
export const HomeContext = React.createContext<HomeCtx>({
  showSidePromptbar: true,
  // eslint‑disable‑next‑line @typescript-eslint/no‑empty‑function
  setShowSidePromptbar: () => {},
});

//------------------------------------------------------------------
//  shadcn/ui stubs – unchanged from your original except where
//  noted (focus rings & colours kept).
//------------------------------------------------------------------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white dark:ring-offset-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-teal-600 text-white hover:bg-teal-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-800',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      ghost: 'hover:bg-gray-100 text-gray-800 hover:text-gray-900',
      link: 'text-teal-600 underline-offset-4 hover:underline hover:text-teal-700',
    };
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`.trim()}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

//  Input / Label components unchanged (trimmed for brevity)
//  ………………………………………………………………………………………………………………………………

//  ─────────────────────────────────────────────────────────────────
//  Type definitions (Patient, Task, etc.) – identical to your draft
//  ─────────────────────────────────────────────────────────────────
//  …  (omitted here for length – keep your existing interfaces)
//  …

//  Helper functions getBorderColor / getBackgroundColor – unchanged
//  ………………………………………………………………………………………………………………………………

//------------------------------------------------------------------
//  MAIN COMPONENT – Tasks
//------------------------------------------------------------------

const Tasks: React.FC = () => {
  // 1️⃣  Grab BOTH value and setter so component re‑renders
  const { showSidePromptbar, setShowSidePromptbar } = useContext(HomeContext);

  //----------------------------------------------------------------
  //  All the state & callbacks from your original file … untouched
  //----------------------------------------------------------------
  //  (For brevity the whole CRUD logic is omitted – paste your
  //   existing code here unchanged.)
  //----------------------------------------------------------------

  // 2️⃣  Classes: remove border + bg when collapsed so element really disappears
  const sidebarClasses = `${
    showSidePromptbar
      ? 'w-80 lg:w-[400px] bg-white shadow-lg border-l border-gray-200'
      : 'w-0'
  } flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out`;

  return (
    <div className={sidebarClasses}>
      {showSidePromptbar && (
        <>
          {/* Header ------------------------------------------------*/}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">Patient Tracker</h2>

            {/* Collapse / Expand toggle */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSidePromptbar(false)}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>

          {/* Scrollable content – paste your existing JSX here       */}
          {/* ………………………………………………………………………………… */}
        </>
      )}

      {/* Tiny expand button when collapsed */}
      {!showSidePromptbar && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 -left-5 shadow-sm border border-gray-200 bg-white"
          onClick={() => setShowSidePromptbar(true)}
          title="Open sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Tasks;

// -----------------------------------------------------------------
//  NOTE
//  1. Keep all your existing task / patient CRUD logic inside the
//     component – only the header and wrapper were changed.
//  2. Wrap your application (or page) with <HomeProvider> so the
//     setter actually works:
//        <HomeProvider>
//          <Tasks />
//        </HomeProvider>
// -----------------------------------------------------------------
