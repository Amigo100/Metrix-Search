import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  TrendingUp,
  Search,
  ArrowRight,
  type LucideProps,
} from 'lucide-react';

interface Card {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<LucideProps>;
  color: string;
  bgColor: string;
}

const Dashboard: React.FC = () => {
  const [isPromptbarOpen, setIsPromptbarOpen] = useState(false);

  const handleTogglePromptbar = useCallback(() => {
    setIsPromptbarOpen((prev) => !prev);
  }, []);

  const cards: Card[] = [
    {
      title: 'Guideline Search',
      description: 'Find local protocols.',
      href: '/guideline-search',
      icon: Search,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Predictive Insights',
      description: 'View ED forecasts.',
      href: '/predictive-analytics',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Patient Tracker',
      description: 'Manage tasks & timers.',
      onClick: handleTogglePromptbar,
      icon: ClipboardCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-8 text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) =>
          card.href ? (
            <Link
              key={card.title}
              href={card.href}
              className="group relative rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
            >
              <span
                className={`absolute -top-6 inline-flex rounded-full p-3 shadow ${card.bgColor}`}
              >
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </span>
              <h2 className="mt-3 text-lg font-medium">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{card.description}</p>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              key={card.title}
              onClick={card.onClick}
              className="relative rounded-xl bg-white p-6 text-left shadow transition hover:shadow-lg"
            >
              <span
                className={`absolute -top-6 inline-flex rounded-full p-3 shadow ${card.bgColor}`}
              >
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </span>
              <h2 className="mt-3 text-lg font-medium">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{card.description}</p>
            </button>
          ),
        )}
      </div>

      {isPromptbarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="ml-auto w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-medium">Patient Tracker</h3>
              <button
                onClick={handleTogglePromptbar}
                className="rounded-md p-2 hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {/* TODO: Replace with real tracker content */}
              <p className="text-sm text-gray-600">
                Patient tracker promptbar content goes here.
              </p>
            </div>
          </div>
          <div
            className="flex-grow bg-black/40"
            onClick={handleTogglePromptbar}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
