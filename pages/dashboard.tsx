// /pages/dashboard.tsx

import React from 'react';
import Link from 'next/link';

/**
 * Data for each feature card:
 * - title and description (optional overlay text)
 * - href: link route
 * - bgImage: path to a PNG image in /public/images/ folder
 */
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
];

export default function DashboardPage() {
  return (
    /**
     * Full container:
     *  - Takes remaining page height after header (80px).
     *  - 2 cols × 2 rows = 4 cells, each 1/4 of the container area.
     */
    <div className="w-full h-[calc(100vh-80px)] grid grid-cols-2 grid-rows-2">
      {features.map((feature) => (
        <Link
          key={feature.title}
          href={feature.href}
          className="relative flex items-end overflow-hidden 
                     group cursor-pointer focus:outline-none 
                     hover:shadow-xl transition"
        >
          {/* Background image, scaled on hover */}
          <div
            style={{
              backgroundImage: `url(${feature.bgImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
          />
          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Text overlay at bottom */}
          <div className="relative z-10 p-4 text-white">
            <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm opacity-90">{feature.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
