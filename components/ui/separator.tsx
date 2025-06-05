import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** orientation: horizontal (default) or vertical */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', className = '', ...props }, ref) => {
    const base =
      orientation === 'vertical'
        ? 'h-full w-px bg-gray-200'
        : 'w-full h-px bg-gray-200';
    return <div ref={ref} className={`${base} ${className}`} {...props} />;
  },
);
Separator.displayName = 'Separator';

export default Separator;
