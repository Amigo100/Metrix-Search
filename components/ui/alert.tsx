import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`rounded-md p-4 ${className ?? ''}`} {...props} />
  ),
);
Alert.displayName = 'Alert';

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <p ref={ref} className={className} {...props} />
));
AlertDescription.displayName = 'AlertDescription';
