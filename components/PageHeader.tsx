import Image from 'next/image';
import { ReactNode } from 'react';

/**
 * Canonical page header:
 *  – 64 × 64 centred logo
 *  – main heading
 *  – optional subtitle
 *  – optional “left slot” (e.g. toggle buttons on the AI‑scribe page)
 */
type Props = {
  title: string;
  subtitle?: string;
  leftSlot?: ReactNode;
};

export default function PageHeader({ title, subtitle, leftSlot }: Props) {
  return (
    <header className="relative flex flex-col items-center pt-6 pb-4">
      {/* optional controls pinned top‑left */}
      {leftSlot && (
        <div className="absolute left-4 top-6 flex items-center space-x-2">
          {leftSlot}
        </div>
      )}

      {/* logo */}
      <Image
        src="/MetrixAI.png"     // <‑‑ make sure this path is correct
        alt="Metrix logo"
        width={64}
        height={64}
        priority
      />

      {/* heading & subtitle */}
      <h1 className="mt-3 text-2xl font-bold text-center">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
          {subtitle}
        </p>
      )}
    </header>
  );
}
