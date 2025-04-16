// file: /pages/dashboard.tsx

import React from 'react';
import Link from 'next/link'; // Import Next.js Link component
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
    BarChart3, // Stats/Analytics Icon (Can still use for general stats)
    Server, // System Status Icon
    Clock, // Added for LOS/Wait Time
    LogIn // Added for Admission Risk
} from 'lucide-react';
// Removed Recharts import

// --- Placeholder Data (Replace with actual data fetching) ---
const userName = "Dr. Evans"; // Fetch actual user name
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
// Updated placeholder data for text display
const predictiveSnippet = {
    waitTimeMetric: "Est. ED Wait Time",
    waitTimeValue: "~45 min",
    waitTimeTrend: "stable", // 'up', 'down', 'stable'
    admissionMetric: "Avg. Admission Risk",
    admissionValue: "Moderate", // Example value
    admissionTrend: "up",
};
const pendingAlerts = overdueTaskCount; // Example: Alerts = Overdue Tasks

// --- Core Tool Links ---
const coreTools = [
  { title: 'AI Clinical Scribe', description: 'Generate notes from conversations.', href: '/clinical-scribe', icon: FileText },
  { title: 'AI Assistant Chat', description: 'Ask clinical questions.', href: '/diagnostic-assistance', icon: BrainCircuit },
  { title: 'Risk & Scoring Tools', description: 'Calculate clinical scores.', href: '/clinical-scoring-tools', icon: Calculator },
  { title: 'Guideline Search', description: 'Find local protocols.', href: '/guideline-search', icon: Search }, // Add this page if it exists
  { title: 'Predictive Insights', description: 'View ED forecasts.', href: '/predictive-analytics', icon: TrendingUp },
//   { title: 'Patient Tracker', description: 'Manage tasks & timers.', href: '/#tasks', icon: ClipboardCheck }, // Example if linking to sidebar toggle needed
];


// --- Reusable Quick Access Card Component (Reverted: No Link/a tag inside) ---
interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string; // Keep className if needed for direct styling
}

// ** Component now returns a div, Link wrapper will be outside **
const QuickAccessCard: React.FC<QuickAccessCardProps> =
    ({ title, description, icon: Icon, className }) => {
        // Using consistent teal theme internally
        const iconBgColor = 'bg-teal-50';
        const iconTextColor = 'text-teal-600';
        const linkTextColor = 'text-teal-600';
        const linkHoverTextColor = 'hover:text-teal-700';
        const hoverBorderColor = 'hover:border-teal-200'; // Subtle teal border on hover

        return (
            // Root element is now a div
            <div
                className={`group relative flex flex-col justify-between p-6 rounded-xl shadow-lg bg-white border border-gray-100 hover:shadow-xl ${hoverBorderColor} hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 overflow-hidden h-full ${className || ''}`}
            >
                <div>
                    <div className={`mb-3 inline-flex items-center justify-center h-10 w-10 rounded-lg ${iconBgColor} ${iconTextColor}`}>
                        <Icon size={20} aria-hidden="true" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-1 text-gray-900`}>{title}</h3>
                    <p className={`text-sm text-gray-600`}>{description}</p>
                </div>
                <div className="mt-4">
                    <span className={`text-sm font-medium ${linkTextColor} ${linkHoverTextColor} group-hover:underline inline-flex items-center`}>
                        Open Tool <ArrowRight size={16} className="ml-1 transition-transform duration-200 group-hover:translate-x-1"/>
                    </span>
                </div>
                <div className={`absolute bottom-0 right-0 h-16 w-16 ${iconTextColor} opacity-5 rounded-full -mr-4 -mb-4`}></div>
            </div>
        );
    };
// QuickAccessCard.displayName = 'QuickAccessCard';


// --- Dashboard Page Component ---
export default function DashboardPage() {
  // Helper to get trend indicator color (Kept functional colors)
  const getTrendColor = (trend: string) => { /* ... function code ... */ switch (trend) { case 'up': return 'text-red-600'; case 'down': return 'text-green-600'; default: return 'text-gray-500'; } };
  const getTrendIndicator = (trend: string) => { /* ... function code ... */ switch (trend) { case 'up': return '↑'; case 'down': return '↓'; default: return '→'; } }

  return (
    // Main container
    <div className="w-full min-h-[calc(100vh-72px)] overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-white via-teal-50 to-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Greeting and Quick Stats Row */}
        <section className="animate-fadeInUp">
           {/* Greeting and Alert Button */}
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900"> Welcome back, <span className="text-teal-700">{userName}</span>! </h1>
                <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors duration-200 ${pendingAlerts > 0 ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-teal-600 hover:bg-teal-700'}`}> <Bell size={16} className="mr-2" /> {pendingAlerts > 0 ? `${pendingAlerts} Pending Alert${pendingAlerts > 1 ? 's' : ''}` : 'No Pending Alerts'} </button>
           </div>
           {/* Stat Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 text-yellow-600 flex items-center justify-center"> <AlertCircle size={20} /> </div> <div> <p className="text-sm text-gray-500">Overdue Tasks</p> <p className="text-lg font-semibold text-gray-900">{overdueTaskCount}</p> </div> </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 text-blue-600 flex items-center justify-center"> <ClipboardCheck size={20} /> </div> <div> <p className="text-sm text-gray-500">Pending Tasks</p> <p className="text-lg font-semibold text-gray-900">{pendingTaskCount}</p> </div> </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 text-green-600 flex items-center justify-center"> <Server size={20} /> </div> <div> <p className="text-sm text-gray-500">System Status</p> <p className={`text-lg font-semibold ${systemStatus.online ? 'text-green-700' : 'text-red-700'}`}> {systemStatus.online ? 'Online' : 'Offline'} </p> </div> </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center space-x-3"> <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 text-indigo-600 flex items-center justify-center"> <Activity size={20} /> </div> <div> <p className="text-sm text-gray-500">Active Metric</p> <p className="text-lg font-semibold text-gray-900">--</p> </div> </div>
           </div>
        </section>

        {/* 2. Quick Access Tools Grid */}
        <section className="animate-fadeInUp delay-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreTools.map((tool) => (
                 // *** FIX: Reverted to legacyBehavior + <a> wrapper ***
                 <Link key={tool.title} href={tool.href} legacyBehavior>
                     <a className="block h-full"> {/* Anchor tag wraps the card */}
                         <QuickAccessCard // Pass props needed for display only
                             title={tool.title}
                             description={tool.description}
                             icon={tool.icon}
                         />
                     </a>
                 </Link>
                 // *** END FIX ***
            ))}
          </div>
        </section>

        {/* 3. Task & Activity Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeInUp delay-200">
          {/* Upcoming Tasks */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Tasks</h2>
            {upcomingTasks.length > 0 ? ( <ul className="space-y-3"> {upcomingTasks.map(task => ( <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg ${task.urgent ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}> <span className={`text-sm ${task.urgent ? 'font-medium text-red-700' : 'text-gray-700'}`}>{task.text}</span> <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${task.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{task.due}</span> </li> ))} </ul> ) : ( <p className="text-sm text-gray-500 italic">No upcoming tasks due soon.</p> )}
            <div className="mt-4 text-right"> <button className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View All Tasks &rarr;</button> </div>
          </div>
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            {recentActivities.length > 0 ? ( <ul className="space-y-3"> {recentActivities.map(activity => ( <li key={activity.id} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-b-0"> <Link href={activity.href} legacyBehavior> <a className="text-sm text-gray-700 hover:text-teal-600 flex-1 mr-2 truncate">{activity.text}</a> </Link> <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{activity.time}</span> </li> ))} </ul> ) : ( <p className="text-sm text-gray-500 italic">No recent activity.</p> )}
             <div className="mt-4 text-right"> <Link href="/activity-log" legacyBehavior> <a className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View Full Log &rarr;</a> </Link> </div>
          </div>
        </section>

        {/* 4. Predictive Insights Snapshot */}
        <section className="animate-fadeInUp delay-300">
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Predictive Insights Snapshot</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg">
                    {/* Wait Time Metric */}
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200 shadow-sm"> <div> <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{predictiveSnippet.waitTimeMetric}</p> <p className="text-2xl font-bold text-teal-700 mt-1">{predictiveSnippet.waitTimeValue}</p> <p className={`text-xs mt-1 font-medium ${getTrendColor(predictiveSnippet.waitTimeTrend)}`}> Trend: {predictiveSnippet.waitTimeTrend} {getTrendIndicator(predictiveSnippet.waitTimeTrend)} </p> </div> <Clock size={28} className="text-teal-500 flex-shrink-0 opacity-70"/> </div>
                    {/* Admission Risk Metric */}
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200 shadow-sm"> <div> <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{predictiveSnippet.admissionMetric}</p> <p className="text-2xl font-bold text-indigo-700 mt-1">{predictiveSnippet.admissionValue}</p> <p className={`text-xs mt-1 font-medium ${getTrendColor(predictiveSnippet.admissionTrend)}`}> Trend: {predictiveSnippet.admissionTrend} {getTrendIndicator(predictiveSnippet.admissionTrend)} </p> </div> <LogIn size={28} className="text-indigo-500 flex-shrink-0 opacity-70"/> </div>
                </div>
                 <div className="mt-4 text-right"> <Link href="/predictive-analytics" legacyBehavior> <a className="text-sm font-medium text-teal-600 hover:text-teal-500 hover:underline">View Full Forecast &rarr;</a> </Link> </div>
             </div>
        </section>

      </div>
    </div>
  );
}
