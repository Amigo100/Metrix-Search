import * as React from 'react';

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className ?? ''}`}>{children}</div>;
}

export function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  return <img className="aspect-square h-full w-full" src={src} alt={alt} />;
}

export function AvatarFallback({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={`flex h-full w-full items-center justify-center rounded-full ${className ?? ''}`}>{children}</span>;
}
