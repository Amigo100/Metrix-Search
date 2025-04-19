// components/ui/Card.tsx
import React from 'react';

// --- Card Root ---
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    const baseStyle = 'rounded-lg border bg-card text-card-foreground shadow-sm';
    const combinedClassName = `${baseStyle} ${className ?? ''}`;

    return (
      <div
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';


// --- Card Header ---
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    const baseStyle = 'flex flex-col space-y-1.5 p-4'; // Adjusted default padding based on common usage
    const combinedClassName = `${baseStyle} ${className ?? ''}`;

    return (
      <div
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';


// --- Card Title ---
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    const baseStyle = 'text-lg font-semibold leading-none tracking-tight'; // Adjusted default font size
    const combinedClassName = `${baseStyle} ${className ?? ''}`;

    return (
      <h3
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';


// --- Card Content ---
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    const baseStyle = 'p-4 pt-0'; // Adjusted default padding based on common usage
    const combinedClassName = `${baseStyle} ${className ?? ''}`;

    return (
      <div
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';


// Export all related components
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
};