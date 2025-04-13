// file: /pages/dashboard.tsx

import React from 'react';
import Link from 'next/link';

const features = [
  {
    title: 'Clinical Scribe',
    description: 'AI-powered transcription & note generation.',
    href: '/clinical-scribe',
    bgImage: '/images/scribetool.png',
  },
  {
    title: 'Predictive Analytics',
    description: 'Forecast ED wait times & more with data insights.',
    href: '/predictive-analytics',
    bgImage: '/images/analyticstool.png',
  },
  {
    title: 'Clinical Scoring Tools',
    description: 'Access essential medical calculations & risk scores.',
    href: '/clinical-scoring-tools',
    bgImage: '/images/scoringtools.png',
  },
  {
    title: 'Diagnostic Assistance',
    description: 'Get AI suggestions for diagnosis & management.',
    href: '/diagnostic-assistance',
    bgImage: '/images/diagnostic-assistance.png',
  },
  {
    title: 'Guidelines Search',
    description: 'Semantic search through local policies/guidelines.',
    href: '/guidelines-search',
    bgImage: '/images/guidelines-search.png',
  },
];

export default function DashboardPage() {
  return (
    <div className="w-full h-[calc(100vh-80px)] overflow-auto p-6 space-y-6">
      {/* 1. Welcome Message */}
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-2xl font-bold text-brand-dark">
          Welcome to ClinSync!
        </h1>
        <p className="mt-2 text-gray-600">
          Your one-stop platform for streamlined clinical documentation,
          scoring tools, diagnostic assistance, and more.
        </p>
      </div>

      {/* 2. Recent Activity Log */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-brand-dark mb-2">
          Recent Activity
        </h2>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Edited patient John Doe's note (today at 09:15)</li>
          <li>Viewed ED wait time predictions for Jane Smith (yesterday)</li>
          <li>Used Wells Score for Mark Johnson (2 days ago)</li>
          <li>...</li>
        </ul>
      </div>

      {/* 3. Feature Cards (2 columns for wide screens) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="relative flex items-end overflow-hidden 
                       group cursor-pointer focus:outline-none 
                       hover:shadow-xl transition rounded-lg"
          >
            {/* Background image, scaled on hover */}
            <div
              style={{
                backgroundImage: `url(${feature.bgImage})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
              className="absolute inset-0 transition-transform duration-300 group-hover:scale-105 rounded-lg"
            />
            {/* Dark overlay for text contrast */}
            <div className="absolute inset-0 bg-black/50 rounded-lg" />
            {/* Text overlay at bottom */}
            <div className="relative z-10 p-4 text-white">
              <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm opacity-90">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
