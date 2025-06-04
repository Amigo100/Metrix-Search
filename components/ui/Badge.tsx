// components/ui/badge.tsx
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * primary – teal background
   * secondary – subtle gray
   * outline – border-only
   */
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide';

    const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
      primary: 'bg-teal-600 text-white',
      secondary: 'bg-gray-200 text-gray-800',
      outline: 'border border-gray-300 text-gray-800',
    };

    return (
      <span
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
