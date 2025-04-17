// file: /components/Modals/HelpModal.tsx

import { useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
// IMPROVEMENT: Use Heroicons
import {
  XMarkIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  DocumentTextIcon, // For T&C/Privacy links/summaries
  BookOpenIcon // For Quick Start Guide
} from '@heroicons/react/24/outline';

// Placeholder for version - replace with actual app version if available dynamically
const APP_VERSION = '1.0.0-demo';

// Helper component for consistent section layout
const HelpSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-6 last:mb-0">
    <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
      {icon && <span className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-400">{icon}</span>}
      {title}
    </h3>
    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        {children}
    </div>
  </div>
);

// Helper component for styled FAQ <details>
const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <details
      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border
                 border-gray-200 dark:border-teal-800/60 group transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {/* IMPROVEMENT: Add custom marker and better styling */}
      <summary className="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 list-none">
        {question}
        <svg className="h-4 w-4 text-gray-400 group-open:rotate-180 transform transition-transform duration-150" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-teal-800/50 text-xs text-gray-600 dark:text-gray-300 space-y-1">
        {children}
      </div>
    </details>
);


export const HelpModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'help') return null;

  const handleClose = () => {
    dispatch({ type: 'change', field: 'openModal', value: null });
  };

  return (
    // IMPROVEMENT: Consistent overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {/* IMPROVEMENT: Consistent modal container styling */}
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   border border-gray-200 dark:border-teal-700/50 p-6 flex flex-col overflow-hidden" // Use flex layout
      >
        {/* IMPROVEMENT: Consistent Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-teal-700/50 mb-6 flex-shrink-0">
            <h2 className='text-xl font-semibold text-teal-800 dark:text-teal-300 flex items-center'>
                <InformationCircleIcon className="h-6 w-6 mr-2"/> {/* Added Icon */}
                {t('Help & Information')}
            </h2>
            {/* IMPROVEMENT: Themed Close Button */}
            <button
                onClick={handleClose}
                className='p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                title={t('Close') || ''}
            >
                <span className="sr-only">{t('Close')}</span>
                <XMarkIcon className='h-5 w-5' />
            </button>
        </div>

        {/* IMPROVEMENT: Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">

          {/* Quick Start Section */}
          <HelpSection title={t('Quick Start Guide')} icon={<BookOpenIcon/>}>
             {/* IMPROVEMENT: Better list styling */}
            <ul className="list-disc list-outside ml-5 space-y-1">
              <li>{t('Open the Chat interface and click “Start New Session” to begin.')}</li>
              <li>{t('Use the Voice Mode button (microphone icon) to dictate your notes.')}</li>
              <li>{t('Select a template (e.g., “ED Triage Note”) from the Templates menu to structure the output.')}</li>
              <li>{t('You can switch between different AI models (like GPT-4 or Gemini) using the model selector.')}</li>
              <li>{t('Use the "Profile" menu to set your sign-off and common phrases for personalization.')}</li>
            </ul>
          </HelpSection>

          {/* Privacy & Security */}
          <HelpSection title={t('Privacy & Security')} icon={<ShieldCheckIcon/>}>
            <p>
              {t('Metrix AI is designed with security as a priority. When using internal models or on-site deployments, your data does not leave your local network. For cloud models (like GPT-4), data is sent securely and processed according to the provider\'s terms, but Metrix AI itself does not store your clinical dictation content long-term.')}
            </p>
             {/* IMPROVEMENT: Add link/placeholder for full policy */}
            <p>
                {t('For more details, please refer to our ')}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                    {t('Privacy Policy')}
                </a>. {/* Replace # with actual link */}
            </p>
          </HelpSection>

          {/* FAQ */}
          {/* IMPROVEMENT: Use HelpSection and FaqItem components */}
          <HelpSection title={t('Frequently Asked Questions')} icon={<QuestionMarkCircleIcon/>}>
            <FaqItem question={t('How does Metrix AI handle patient data?')}>
              <p>{t('Metrix AI processes dictation data transiently to generate notes. It does not store identifiable patient health information persistently within the Metrix AI system itself. For on-site deployments, data remains within your network.')}</p>
            </FaqItem>
            <FaqItem question={t('Which browsers are supported?')}>
                <p>{t('Metrix AI works best on modern desktop browsers. We recommend the latest versions of Google Chrome, Apple Safari, or Microsoft Edge.')}</p>
            </FaqItem>
            <FaqItem question={t('Can I use internal ML models?')}>
              <p>{t('Yes, the platform supports integration with internal or locally hosted machine learning models. This ensures data can be processed entirely within your organization\'s infrastructure if required. Configuration details are available in the deployment guide.')}</p>
            </FaqItem>
            <FaqItem question={t('How do I customize templates?')}>
                <p>{t('Click the "Templates" button in the main interface. You can create new templates, edit existing ones, or import/export them as JSON files.')}</p>
            </FaqItem>
             <FaqItem question={t('How can I contact support?')}>
                <p>{t('For technical issues or questions, please contact your local IT support or the designated Metrix AI administrator first. You can also reach out via the contact details provided in your service agreement or email support@example.com.')}</p> {/* Replace with actual support email */}
            </FaqItem>
          </HelpSection>

          {/* IMPROVEMENT: Added Terms and Conditions Section */}
          <HelpSection title={t('Terms and Conditions')} icon={<DocumentTextIcon/>}>
            <p>
                {t('Your use of the Metrix AI platform is subject to the terms agreed upon by your institution. Please consult the official documentation or contact your administrator for details.')}
            </p>
            {/* Optional: Link to full T&Cs if available */}
            {/* <p>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                    {t('View Full Terms and Conditions')}
                </a>.
            </p> */}
          </HelpSection>

           {/* IMPROVEMENT: Added About Section */}
          <HelpSection title={t('About Metrix AI')} icon={<InformationCircleIcon/>}>
            <p>
                {t('Metrix AI Clinical Assistant Platform')} <br/>
                {t('Version:')} {APP_VERSION} <br/>
                &copy; {new Date().getFullYear()} Metrix Health Ltd. {/* Or your company name */}
            </p>
          </HelpSection>

        </div> {/* End Scrollable Content Area */}

        {/* Footer (Optional or integrate Close button into header as done above) */}
         {/* <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-teal-700/50 flex-shrink-0'>
            <button
            // ... Close Button styling ...
            </button>
         </div> */}

      </div> {/* End Modal Container */}
    </div> /* End Modal Overlay */
  );
};

export default HelpModal;
