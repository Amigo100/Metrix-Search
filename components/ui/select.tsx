import React from 'react';

import { cn } from '@/lib/utils';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  children,
  className,
}: SelectProps) {
  const items = React.Children.toArray(children).filter(
    (child: any) => child.type && child.type.displayName === 'SelectItem',
  ) as React.ReactElement<SelectItemProps>[];

  return (
    <select
      className={cn(
        'block w-full rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
        className,
      )}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {items}
    </select>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>;
}
SelectItem.displayName = 'SelectItem';

export const SelectTrigger: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
export const SelectValue: React.FC = () => null;
export const SelectContent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
