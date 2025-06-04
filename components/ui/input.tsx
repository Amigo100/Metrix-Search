// components/ui/input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Minimal input that matches usage in login.tsx (type="email", type="password", etc.)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const baseStyles =
      'block w-full rounded-md border border-gray-300 bg-white text-gray-900 ' +
      'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 ' +
      'focus:border-teal-500 transition-colors';

    return (
      <input
        ref={ref}
        className={cn(baseStyles, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
