// /components/Modals/ProfileModal.tsx
// ---------------------------------------------------------------------------
// Demo‑friendly profile modal:
// • Persists sign‑off + clinical context (incl. common phrases) in global state
// • Email field kept for completeness – clearly marked as not stored.
// ---------------------------------------------------------------------------

import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
// IMPROVEMENT: Switch to Heroicons for consistency
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

// Define reusable input classes for consistency
const inputClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-teal-700/50
                      rounded-md shadow-sm text-sm
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent`;

const disabledInputClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                              rounded-md shadow-sm text-sm
                              bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400
                              cursor-not-allowed`; // Added cursor style


export const ProfileModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  /* ---------- open / close --------- */
  if (state.openModal !== 'profile') return null;
  const handleClose = () =>
    dispatch({ type: 'change', field: 'openModal', value: null });

  /* ---------- local form state ----- */
  // Keep existing demo state values
  const [fullName, setFullName]        = useState('Dr James Deighton');
  const [site, setSite]                = useState('Whanganui Hospital, NZ');
  const [email, setEmail]              = useState('demo@example.com');
  const [clinicalContext, setContext] = useState(
    'ED registrar – prefers concise bullet‑point notes.',
  );
  const [signOff, setSignOff]          = useState('Dr James Deighton MBBS');
  const [phrases, setPhrases] = useState<{ abbr: string; exp: string }[]>([
    { abbr: 'SOB', exp: 'Shortness of breath' },
    { abbr: 'HTN', exp: 'Hypertension' },
  ]);

  // Phrase handlers remain the same
  const addPhrase = () =>
    setPhrases([...phrases, { abbr: '', exp: '' }]);

  const updatePhrase = (
    idx: number,
    field: 'abbr' | 'exp',
    value: string,
  ) => {
    const next = [...phrases];
    next[idx][field] = value;
    setPhrases(next);
  };

  const removePhrase = (idx: number) =>
    setPhrases(phrases.filter((_, i) => i !== idx));

  /* ---------- save handler ---------- */
  // Save handler remains the same
  const handleSaveProfile = () => {
    const phraseBlock =
      phrases.length > 0
        ? phrases
            .filter((p) => p.abbr && p.exp)
            .map((p) => `• ${p.abbr} = ${p.exp}`)
            .join('\n')
        : '';

    const userContext = `
Site/Hospital: ${site}
Role/Notes: ${clinicalContext}

Common Phrases:
${phraseBlock || '(none)'}
    `.trim();

    dispatch({ type: 'change', field: 'userContext', value: userContext });
    dispatch({ type: 'change', field: 'userSignOff', value: signOff });

    alert('Profile saved (demo only – not persisted to a database).');
    handleClose();
  };

  /* ---------- UI -------------------- */
  return (
    // Use consistent overlay style from TemplatesModal
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm'>
      {/* IMPROVEMENT: Use consistent modal container styling */}
      <div className='w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      border border-gray-200 dark:border-teal-700/50 p-6 flex flex-col overflow-hidden'> {/* Changed overflow-auto to flex structure */}

        {/* IMPROVEMENT: Consistent Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-teal-700/50 mb-6 flex-shrink-0">
            <h2 className='text-xl font-semibold text-teal-800 dark:text-teal-300'>
              {t('My Profile & Preferences')} {/* Slightly more descriptive title */}
            </h2>
            <button
                onClick={handleClose}
                className='p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                title={t('Close') || ''}
            >
                <span className="sr-only">{t('Close')}</span>
                <XMarkIcon className='h-5 w-5' /> {/* Use Heroicon */}
            </button>
        </div>

        {/* IMPROVEMENT: Make content scrollable, not the whole modal card */}
        <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Add padding compensation for scrollbar */}
          <div className='flex flex-col md:flex-row gap-6'>

            {/* ───────── Left column = form ───────── */}
            <div className='md:w-1/2 space-y-4'>
              {/* Full Name */}
              <div> {/* Wrap label/input for better spacing control */}
                <label htmlFor="profile-fullname" className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  {t('Full Name')}
                </label>
                <input
                  id="profile-fullname"
                  type='text'
                  className={inputClasses} // Use themed classes
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Site */}
              <div>
                <label htmlFor="profile-site" className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  {t('Site / Department')}
                </label>
                <input
                  id="profile-site"
                  type='text'
                  className={inputClasses} // Use themed classes
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                />
              </div>

              {/* Email (display‑only) */}
              <div>
                <label htmlFor="profile-email" className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  {t('E‑mail (demo – not stored)')}
                </label>
                <input
                  id="profile-email"
                  type='email'
                  className={disabledInputClasses} // Use themed disabled classes
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly // Make explicitly readOnly
                  aria-describedby="email-helper-text"
                />
                <p id="email-helper-text" className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  {t('This field is not saved in the demo version.')}
                </p>
              </div>

              {/* Clinical Context */}
              <div>
                <label htmlFor="profile-context" className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  {t('Clinical Context / Preferences')}
                </label>
                <textarea
                  id="profile-context"
                  className={`${inputClasses} h-24`} // Use themed classes, adjust height
                  value={clinicalContext}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={t('e.g., Your role, common note formats, preferred abbreviations...') || ''}
                />
              </div>

              {/* Sign‑off */}
              <div>
                <label htmlFor="profile-signoff" className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  {t('Document Sign‑off / Credentials')}
                </label>
                <textarea
                  id="profile-signoff"
                  className={`${inputClasses} h-20`} // Use themed classes, adjust height
                  value={signOff}
                  onChange={(e) => setSignOff(e.target.value)}
                   placeholder={t('e.g., Dr. Example MBBS FRACP') || ''}
                />
              </div>
            </div> {/* End Left Column */}

            {/* ───────── Right column = common phrases ───────── */}
            <div className='md:w-1/2'>
              <h3 className='text-md font-semibold text-gray-800 dark:text-gray-200 mb-3'>
                {t('Common Phrases / Abbreviations')}
              </h3>

              {/* IMPROVEMENT: Add border around phrase list */}
              <div className='space-y-3 p-3 border border-gray-200 dark:border-teal-800/60 rounded-md bg-gray-50 dark:bg-gray-700/30'>
                {phrases.map((p, idx) => (
                  <div key={idx} className='flex flex-wrap gap-2 items-center'> {/* Added flex-wrap */}
                    <input
                      aria-label={t('Abbreviation') || 'Abbreviation'}
                      placeholder={t('ABBR') || 'ABBR'}
                      // IMPROVEMENT: Apply themed styles to phrase inputs
                      className={`grow shrink basis-1/4 min-w-[60px] px-2 py-1 border border-gray-300 dark:border-teal-700/50 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      value={p.abbr}
                      onChange={(e) => updatePhrase(idx, 'abbr', e.target.value)}
                    />
                    <span className='text-gray-500 dark:text-gray-400 flex-shrink-0'>=</span>
                    <input
                      aria-label={t('Expanded meaning') || 'Expanded meaning'}
                      placeholder={t('Expanded meaning') || 'Expanded meaning'}
                      // IMPROVEMENT: Apply themed styles to phrase inputs
                      className={`grow shrink basis-1/2 min-w-[120px] px-2 py-1 border border-gray-300 dark:border-teal-700/50 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      value={p.exp}
                      onChange={(e) => updatePhrase(idx, 'exp', e.target.value)}
                    />
                    <button
                      onClick={() => removePhrase(idx)}
                      // IMPROVEMENT: Apply consistent icon button styling
                      className='p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0'
                      title={t('Remove phrase') || ''}
                    >
                      <TrashIcon className='h-4 w-4' /> {/* Use Heroicon */}
                    </button>
                  </div>
                ))}

                {phrases.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                    {t('No common phrases added yet.')}
                  </p>
                )}

                {/* IMPROVEMENT: Style Add Phrase button */}
                <button
                  onClick={addPhrase}
                  className='mt-3 inline-flex items-center rounded-md bg-teal-50 dark:bg-teal-800/50 px-3 py-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300 shadow-sm hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors duration-200'
                  title={t('Add a new phrase row') || ''}
                >
                  <PlusIcon className='h-4 w-4 mr-1' /> {t('Add Phrase')} {/* Use Heroicon */}
                </button>
              </div>
            </div> {/* End Right Column */}
          </div> {/* End flex row */}
        </div> {/* End Scrollable content area */}

        {/* ───────── footer buttons ───────── */}
        {/* IMPROVEMENT: Apply themed button styles */}
        <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-teal-700/50 flex-shrink-0'>
          <button
            className='inline-flex items-center rounded-md bg-gray-200 dark:bg-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200'
            onClick={handleClose}
          >
            <XMarkIcon className='h-4 w-4 mr-1' /> {t('Cancel')}
          </button>
          <button
            className='inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-colors duration-200'
            onClick={handleSaveProfile}
          >
            <CheckIcon className='h-4 w-4 mr-1' /> {t('Save Profile')}
          </button>
        </div>
      </div> {/* End Modal Container */}
    </div> /* End Modal Overlay */
  );
};

export default ProfileModal;
