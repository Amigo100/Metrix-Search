import React from 'react';
import Link from 'next/link';
// Import icons from lucide-react
import { FileText, TrendingUp, Calculator, BrainCircuit, ArrowRight } from 'lucide-react';

// Define feature data with icons
const features = [
  {
    title: 'Clinical Scribe',
    description: 'AI-powered transcription & note generation.',
    href: '/clinical-scribe',
    icon: FileText, // Assign icon component
    // bgImage: '/images/scribetool.png', // Removed bgImage for light theme cards
  },
  {
    title: 'Predictive Analytics',
    description: 'Forecast ED wait times & more with data insights.',
    href: '/predictive-analytics',
    icon: TrendingUp,
    // bgImage: '/images/analyticstool.png',
  },
  {
    title: 'Clinical Scoring Tools',
    description: 'Access essential medical calculations & risk scores.',
    href: '/clinical-scoring-tools',
    icon: Calculator,
    // bgImage: '/images/scoringtools.png',
  },
  {
    title: 'Diagnostic Assistance',
    description: 'Get AI suggestions for diagnosis & management.',
    href: '/diagnostic-assistance',
    icon: BrainCircuit,
    // bgImage: '/images/diagnostic-assistance.png',
  },
];

export default function DashboardPage() {
  return (
    // Added light gradient background, consistent padding
    <div className="w-full min-h-[calc(100vh-80px)] overflow-auto p-6 md:p-8 space-y-6 md:space-y-8 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* 1. Welcome Message */}
      {/* Consistent card styling */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900"> {/* Updated text color */}
          Welcome to Metrix!
        </h1>
        <p className="mt-1 text-gray-600">Your clinical assistant dashboard.</p>
      </div>

      {/* 2. Recent Activity Log */}
       {/* Consistent card styling */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3"> {/* Updated text color */}
          Recent Activity
        </h2>
        {/* Added teal bullets */}
        <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside marker:text-teal-500">
          <li>Edited patient John Doe's note (today at 09:15)</li>
          <li>Viewed ED wait time predictions for Jane Smith (yesterday)</li>
          <li>Used Wells Score for Mark Johnson (2 days ago)</li>
          <li>Searched local antibiotic guidelines (2 days ago)</li>
          {/* Add more placeholder items or fetch real data */}
        </ul>
         <div className="mt-4">
            <Link href="/activity-log" legacyBehavior>
                <a className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">
                    View all activity &rarr;
                </a>
            </Link>
        </div>
      </div>

      {/* 3. Feature Cards (Redesigned for Light Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"> {/* Adjusted grid columns */}
        {features.map((feature) => {
          const Icon = feature.icon; // Get the icon component
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <div className="flex-shrink-0 mb-4">
                {/* Icon */}
                <div className="h-12 w-12 rounded-lg inline-flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-md">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              {/* Text Content */}
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              {/* Go to link */}
              <div className="mt-4">
                <span className="text-sm font-medium text-teal-600 group-hover:text-teal-500 group-hover:underline inline-flex items-center">
                  Go to {feature.title}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
