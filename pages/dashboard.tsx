// file: /pages/dashboard.tsx
// UPDATED VERSION

import React, { useContext } from 'react'; // Added useContext
import Link from 'next/link';
import {
    LayoutGrid, ClipboardCheck, Activity, FileText, TrendingUp, Calculator,
    BrainCircuit, Search, Bell, CheckCircle2, AlertCircle, ArrowRight,
    BarChart3, Server, Clock, LogIn
} from 'lucide-react';

import HomeContext from '@/pages/api/home/home.context'; // Added HomeContext import

// --- Placeholder Data (Keep as is) ---
const userName = "Dr. Deighton";
const pendingTaskCount = 3;
const overdueTaskCount = 1;
const systemStatus = { online: true, message: "All systems operational." };
const recentActivities = [
    { id: 1, text: "Calculated Wells Score for Patient ID 789012", time: "1h ago", href: "/clinical-scoring-tools" },
    { id: 2, text: "Generated ED note for Patient ID 345678", time: "3h ago", href: "/clinical-scribe" },
    { id: 3, text: "Searched local sepsis guidelines", time: "Yesterday", href: "/guideline-search" },
];
const upcomingTasks = [
    { id: 't1', text: "Review Patient X's blood results", due: "in 15m", urgent: true },
    { id: 't2', text: "Check Patient Y's response to diuretics", due: "in 1h", urgent: false },
];
const predictiveSnippet = {
    metric: "Avg. ED Wait Time",
    value: "~45 min",
    trend: "stable",
};

// --- Reusable Quick Access Card Component ---
interface QuickAccessCardProps {
  title: string;
  description: string;
  href?: string; // Made href optional
  onClick?: () => void; // Added optional onClick handler
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, description, href, onClick, icon: Icon, color, bgColor }) => {
  const hoverBorderColor = color.replace('text-', 'hover:border-').replace('600', '300');
  const cardBaseClasses = `group relative flex flex-col justify-between p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl ${hoverBorderColor} hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${bgColor} overflow-hidden h-full`; // Added h-full

  const cardContent = (
    <>
        <div>
            <div className={`mb-3 inline-flex items-center justify-center h-10 w-10 rounded-lg ${bgColor.replace('bg-', 'bg-opacity-50')} ${color}`}>
                <Icon size={20} aria-hidden="true" />
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${color.replace('text-', 'text-opacity-90')}`}>{title}</h3>
            <p className={`text-sm ${color.replace('600', '700').replace('text-', 'text-opacity-80')}`}>{description}</p>
        </div>
        <div className="mt-4">
            {/* Adjust text based on action type */}
            <span className={`text-sm font-medium ${color} group-hover:underline inline-flex items-center`}>
                {onClick ? 'Open Tracker' : 'Open Tool'}
                <ArrowRight size={16} className="ml-1 transition-transform duration-200 group-hover:translate-x-1"/>
            </span>
        </div>
        <div className={`absolute bottom-0 right-0 h-16 w-16 ${color} opacity-10 rounded-full -mr-4 -mb-4`}></div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${cardBaseClasses} text-left`}> {/* Added text-left for button */}
        {cardContent}
      </button>
    );
  } else if (href) {
    return (
      <Link href={href} className={cardBaseClasses}>
        {cardContent}
      </Link>
    );
  } else {
      // Fallback or render nothing if neither href nor onClick is provided
      return <div className={`${cardBaseClasses} opacity-50 cursor-not-allowed`}>{cardContent}</div>;
  }
};


// --- Dashboard Page Component ---
export default function DashboardPage() {

  // Get context for dispatching sidebar toggle
  const { state, dispatch } = useContext(HomeContext);
  const { showSidePromptbar } = state; // Get current state

  // Define the handler function inside the component
  const handleTogglePromptbar = () => {
    const newState = !showSidePromptbar;
    dispatch({
      type: 'change',
      field: 'showSidePromptbar',
      value: newState,
    });
    localStorage.setItem('showSidePromptbar', JSON.stringify(newState));
  };

  // --- UPDATED Core Tool Links ---
  const coreTools = [
    { title: 'AI Clinical Scribe', description: 'Generate notes from conversations.', href: '/clinical-scribe', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'AI Assistant Chat', description: 'Ask clinical questions.', href: '/diagnostic-assistance', icon: BrainCircuit, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Risk & Scoring Tools', description: 'Calculate clinical scores.', href: '/clinical-scoring-tools', icon: Calculator, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Guideline Search', description: 'Find local protocols.', href: '/guideline-search', icon: Search, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Predictive Insights', description: 'View ED forecasts.', href: '/predictive-analytics', icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-50' },
    // *** UPDATED Patient Tracker: Removed href, added onClick ***
    { title: 'Patient Tracker', description: 'Manage tasks & timers.', onClick: handleTogglePromptbar, icon: ClipboardCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ];


  return (
    // Main container with consistent padding and background
    <div className="w-full min-h-[calc(100vh-72px)] overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-white via-teal-50 to-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Greeting and Quick Stats Row */}
        <section className="animate-fadeInUp"> {/* Assuming animate-fadeInUp is defined globally */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {userName}!
          </h1>
          {/* Stat Cards ... (kept as is) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overdue Tasks Card */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> {/* ... */} </div>
            {/* Pending Tasks Card */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> {/* ... */} </div>
            {/* System Status Card */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> {/* ... */} </div>
            {/* Notifications Card */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> {/* ... */} </div>
          </div>
        </section>

        {/* 2. Quick Access Tools Grid */}
        <section className="animate-fadeInUp delay-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access Tools</h2>
          {/* *** UPDATED grid columns to 6 *** */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5"> {/* Adjusted gap slightly */}
            {coreTools.map((tool) => (
                <QuickAccessCard
                    key={tool.title}
                    title={tool.title}
                    description={tool.description}
                    // Conditionally pass href or onClick
                    href={tool.href}
                    onClick={tool.onClick}
                    icon={tool.icon}
                    color={tool.color}
                    bgColor={tool.bgColor}
                />
            ))}
          </div>
        </section>

        {/* 3. Task & Activity Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeInUp delay-200">
            {/* Upcoming Tasks Card ... (kept as is) */}
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"> {/* ... */} </div>
            {/* Recent Activity Card ... (kept as is) */}
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"> {/* ... */} </div>
        </section>

        {/* 4. (Optional) Predictive Insights Snippet */}
        <section className="animate-fadeInUp delay-300">
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"> {/* ... */} </div>
        </section>

      </div>
    </div>
  );
}
