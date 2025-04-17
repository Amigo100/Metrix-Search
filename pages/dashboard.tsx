// file: /pages/dashboard.tsx

import React from 'react';
import Link from 'next/link';
import {
    LayoutGrid, // General Dashboard/Layout
    ClipboardCheck, // Tasks/Tracker
    Activity, // Activity Log
    FileText, // Scribe
    TrendingUp, // Predictive
    Calculator, // Scoring
    BrainCircuit, // Diagnostic/Chatbot
    Search, // Guideline Search (replace if needed)
    Bell, // Notifications/Alerts
    CheckCircle2, // Completed Tasks
    AlertCircle, // Expired/Alert Tasks
    ArrowRight, // Links
    BarChart3, // Stats/Analytics Icon (Can be used as placeholder)
    Server, // System Status Icon
    Clock, // Wait times
    LogIn, // Admission Likelihood
} from 'lucide-react';
// --- Removed Recharts Import ---
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Placeholder Data (Replace with actual data fetching) ---
const userName = "Dr. Dobrogowska"; // Fetch actual user name
const pendingTaskCount = 3; // Fetch from task state/context
const overdueTaskCount = 1; // Fetch from task state/context
const systemStatus = { online: true, message: "All systems operational." }; // Fetch status
const recentActivities = [
    { id: 1, text: "Calculated Wells Score for Patient ID 789012", time: "1h ago", href: "/clinical-scoring-tools" },
    { id: 2, text: "Generated ED note for Patient ID 345678", time: "3h ago", href: "/clinical-scribe" },
    { id: 3, text: "Searched local sepsis guidelines", time: "Yesterday", href: "/guideline-search" }, // Assuming a guideline search page
];
const upcomingTasks = [
    { id: 't1', text: "Review Patient X's blood results", due: "in 15m", urgent: true },
    { id: 't2', text: "Check Patient Y's response to diuretics", due: "in 1h", urgent: false },
];
const predictiveSnippet = {
    metric: "Avg. ED Wait Time",
    value: "~45 min",
    trend: "stable", // 'up', 'down', 'stable'
};

// --- Removed waitTimeData for chart ---
// const waitTimeData = [ ... ];

// --- Core Tool Links ---
const coreTools = [
  { title: 'AI Clinical Scribe', description: 'Generate notes from conversations.', href: '/clinical-scribe', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'AI Assistant Chat', description: 'Ask clinical questions.', href: '/diagnostic-assistance', icon: BrainCircuit, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { title: 'Risk & Scoring Tools', description: 'Calculate clinical scores.', href: '/clinical-scoring-tools', icon: Calculator, color: 'text-green-600', bgColor: 'bg-green-50' },
  { title: 'Guideline Search', description: 'Find local protocols.', href: '/guideline-search', icon: Search, color: 'text-orange-600', bgColor: 'bg-orange-50' }, // Add this page if it exists
  { title: 'Predictive Insights', description: 'View ED forecasts.', href: '/predictive-analytics', icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-50' },
  { title: 'Patient Tracker', description: 'Manage tasks & timers.', href: '/#tasks', // Link to open task sidebar? Or a dedicated page?
    icon: ClipboardCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
];

// --- Reusable Quick Access Card Component ---
interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType; // Pass icon component directly
  color: string; // Tailwind color class for icon bg/text (e.g., 'text-teal-600', 'bg-teal-50')
  bgColor: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, description, href, icon: Icon, color, bgColor }) => {
  const hoverBorderColor = color.replace('text-', 'hover:border-').replace('600', '300'); // Generate hover border color

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl ${hoverBorderColor} hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${bgColor} overflow-hidden`} // Use specific bg color
    >
        <div>
            {/* Use opacity variation for icon background */}
            <div className={`mb-3 inline-flex items-center justify-center h-10 w-10 rounded-lg ${bgColor.replace('bg-', 'bg-opacity-50')} ${color}`}>
                <Icon size={20} aria-hidden="true" />
            </div>
            {/* Use opacity variation for text colors */}
            <h3 className={`text-lg font-semibold mb-1 ${color.replace('text-', 'text-opacity-90')}`}>{title}</h3>
            <p className={`text-sm ${color.replace('600', '700').replace('text-', 'text-opacity-80')}`}>{description}</p>
        </div>
        <div className="mt-4">
            <span className={`text-sm font-medium ${color} group-hover:underline inline-flex items-center`}>
                Open Tool <ArrowRight size={16} className="ml-1 transition-transform duration-200 group-hover:translate-x-1"/>
            </span>
        </div>
         {/* Optional: Subtle background pattern or gradient */}
         <div className={`absolute bottom-0 right-0 h-16 w-16 ${color} opacity-10 rounded-full -mr-4 -mb-4`}></div>
    </Link>
  );
};


// --- Dashboard Page Component ---
export default function DashboardPage() {
  return (
    // Main container with consistent padding and background
    <div className="w-full min-h-[calc(100vh-72px)] overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-white via-teal-50 to-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Greeting and Quick Stats Row */}
        <section className="animate-fadeInUp"> {/* Assuming animate-fadeInUp is defined globally */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {userName}!
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Example Stat Cards - Replace with real data */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue Tasks</p>
                <p className="text-lg font-semibold text-gray-900">{overdueTaskCount}</p>
              </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-lg font-semibold text-gray-900">{pendingTaskCount}</p>
              </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                 <Server size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <p className={`text-lg font-semibold ${systemStatus.online ? 'text-green-700' : 'text-red-700'}`}>
                    {systemStatus.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Notifications</p>
                <p className="text-lg font-semibold text-gray-900">0 New</p> {/* Placeholder */}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Quick Access Tools Grid */}
        <section className="animate-fadeInUp delay-100"> {/* Assuming animate-fadeInUp is defined globally */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {coreTools.map((tool) => (
                <QuickAccessCard
                    key={tool.title}
                    title={tool.title}
                    description={tool.description}
                    href={tool.href}
                    icon={tool.icon}
                    color={tool.color}
                    bgColor={tool.bgColor}
                />
            ))}
          </div>
        </section>

        {/* 3. Task & Activity Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeInUp delay-200"> {/* Assuming animate-fadeInUp is defined globally */}
          {/* Upcoming Tasks */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Tasks</h2>
            {upcomingTasks.length > 0 ? (
                <ul className="space-y-3">
                    {upcomingTasks.map(task => (
                        <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg ${task.urgent ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <span className={`text-sm ${task.urgent ? 'font-medium text-red-700' : 'text-gray-700'}`}>{task.text}</span>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${task.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{task.due}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">No upcoming tasks due soon.</p>
            )}
            <div className="mt-4 text-right">
                {/* Link to open Task sidebar or dedicated page */}
                {/* TODO: Implement actual sidebar toggle or link to task page */}
                <button className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View All Tasks &rarr;</button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            {recentActivities.length > 0 ? (
                 <ul className="space-y-3">
                    {recentActivities.map(activity => (
                        <li key={activity.id} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-b-0">
                           <Link href={activity.href} legacyBehavior>
                             <a className="text-sm text-gray-700 hover:text-teal-600 flex-1 mr-2">{activity.text}</a>
                           </Link>
                            <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                 <p className="text-sm text-gray-500 italic">No recent activity.</p>
            )}
             <div className="mt-4 text-right">
                 {/* Link to dedicated activity log page */}
                <Link href="/activity-log" legacyBehavior>
                    <a className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View Full Log &rarr;</a>
                </Link>
            </div>
          </div>
        </section>

        {/* 4. (Optional) Predictive Insights Snippet */}
        <section className="animate-fadeInUp delay-300"> {/* Assuming animate-fadeInUp is defined globally */}
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Predictive Insights Snapshot</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg">
                    {/* Metrics */}
                    <div className="md:col-span-1 flex flex-col space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                            <div>
                                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider">Est. Wait Time</p>
                                <p className="text-xl font-semibold text-emerald-900">{predictiveSnippet.value}</p> {/* Use predictiveSnippet.value */}
                            </div>
                            <Clock size={24} className="text-emerald-500"/>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-amber-100 rounded-lg border border-amber-200">
                            <div>
                                <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">Avg. Admission Risk</p>
                                <p className="text-xl font-semibold text-amber-900">Moderate</p> {/* Placeholder */}
                            </div>
                            <LogIn size={24} className="text-amber-500"/>
                        </div>
                    </div>

                    {/* --- Chart Placeholder --- */}
                    <div className="md:col-span-2 h-48 w-full flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-gray-500">
                        <BarChart3 size={48} className="mb-2 opacity-50"/>
                        <p className="text-sm text-center">Wait time trend chart will display here.</p>
                        <p className="text-xs mt-1">(Requires 'recharts' library)</p>
                    </div>
                    {/* --- End Chart Placeholder --- */}

                </div>
                 <div className="mt-4 text-right">
                    <Link href="/predictive-analytics" legacyBehavior>
                        <a className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View Full Forecast &rarr;</a>
                    </Link>
                </div>
             </div>
        </section>

      </div>
    </div>
  );
}

// No redundant export needed here
