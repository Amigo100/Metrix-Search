// /components/Modals/ProfileModal.tsx
// ---------------------------------------------------------------------------
// Demo‑friendly profile modal:
// • Persists sign‑off + clinical context (incl. common phrases) in global state
// • Email field kept for completeness – clearly marked as not stored.
// ---------------------------------------------------------------------------

import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { X, Plus, Trash } from 'lucide-react';

export const ProfileModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  /* ---------- open / close --------- */
  if (state.openModal !== 'profile') return null;
  const handleClose = () =>
    dispatch({ type: 'change', field: 'openModal', value: null });

  /* ---------- local form state ----- */
  const [fullName, setFullName]       = useState('Dr James Deighton');
  const [site, setSite]               = useState('Whanganui Hospital, NZ');
  const [email, setEmail]             = useState('demo@example.com');
  const [clinicalContext, setContext] = useState(
    'ED registrar – prefers concise bullet‑point notes.',
  );
  const [signOff, setSignOff]         = useState('Dr James Deighton MBBS');

  /* common phrases = [{abbr,exp}] */
  const [phrases, setPhrases] = useState<{ abbr: string; exp: string }[]>([
    { abbr: 'SOB', exp: 'Shortness of breath' },
    { abbr: 'HTN', exp: 'Hypertension' },
  ]);

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
  const handleSaveProfile = () => {
    /* Build a single multi‑line context string */
    const phraseBlock =
      phrases.length > 0
        ? phrases
            .filter((p) => p.abbr && p.exp)
            .map((p) => `• ${p.abbr} = ${p.exp}`)
            .join('\n')
        : '';

    const userContext = `
Site/Hospital: ${site}
Role/Notes: ${clinicalContext}

Common Phrases:
${phraseBlock || '(none)'}
    `.trim();

    dispatch({ type: 'change', field: 'userContext', value: userContext });
    dispatch({ type: 'change', field: 'userSignOff', value: signOff });

    alert('Profile saved (demo only – not persisted to a database).');
    handleClose();
  };

  /* ---------- UI -------------------- */
  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center'>
      <div className='bg-white dark:bg-gray-800 w-full max-w-3xl p-6 rounded shadow overflow-auto max-h-[90vh] relative'>

        {/* Close X */}
        <button
          onClick={handleClose}
          className='absolute top-3 right-3 text-gray-400 hover:text-gray-600'
        >
          <X size={20} />
        </button>

        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
          {t('My Profile')}
        </h2>

        <div className='flex flex-col md:flex-row gap-6'>

          {/* ───────── Left column = form ───────── */}
          <div className='md:w-1/2 space-y-4'>

            {/* Full Name */}
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
              {t('Full Name')}
              <input
                type='text'
                className='mt-1 block w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-gray-100'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            {/* Site */}
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
              {t('Site / Department')}
              <input
                type='text'
                className='mt-1 block w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-gray-100'
                value={site}
                onChange={(e) => setSite(e.target.value)}
              />
            </label>

            {/* Email (display‑only) */}
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
              {t('E‑mail (demo – not stored)')}
              <input
                type='email'
                className='mt-1 block w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className='text-xs text-gray-400'>
                This field is <strong>not saved</strong> in the demo version.
              </span>
            </label>

            {/* Clinical Context */}
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
              Clinical Context / Preferences
              <textarea
                className='mt-1 block w-full px-3 py-2 border rounded h-20 dark:bg-gray-700 dark:text-gray-100'
                value={clinicalContext}
                onChange={(e) => setContext(e.target.value)}
              />
            </label>

            {/* Sign‑off */}
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200'>
              Document Sign‑off / Credentials
              <textarea
                className='mt-1 block w-full px-3 py-2 border rounded h-16 dark:bg-gray-700 dark:text-gray-100'
                value={signOff}
                onChange={(e) => setSignOff(e.target.value)}
              />
            </label>

          </div>

          {/* ───────── Right column = common phrases ───────── */}
          <div className='md:w-1/2'>
            <h3 className='text-md font-semibold text-gray-800 dark:text-gray-100 mb-2'>
              Common Phrases / Abbreviations
            </h3>

            <div className='space-y-2'>
              {phrases.map((p, idx) => (
                <div key={idx} className='flex gap-2 items-center'>
                  <input
                    placeholder='ABBR'
                    className='flex-1 px-2 py-1 border rounded text-sm'
                    value={p.abbr}
                    onChange={(e) =>
                      updatePhrase(idx, 'abbr', e.target.value)
                    }
                  />
                  <span className='text-gray-500'>=</span>
                  <input
                    placeholder='Expanded meaning'
                    className='flex-[2] px-2 py-1 border rounded text-sm'
                    value={p.exp}
                    onChange={(e) =>
                      updatePhrase(idx, 'exp', e.target.value)
                    }
                  />
                  <button
                    onClick={() => removePhrase(idx)}
                    className='text-red-500 hover:text-red-700'
                    title='Remove'
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}

              <button
                onClick={addPhrase}
                className='mt-2 inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-900'
              >
                <Plus size={16} /> Add phrase
              </button>
            </div>
          </div>
        </div>

        {/* ───────── footer buttons ───────── */}
        <div className='flex justify-end gap-2 mt-6'>
          <button
            className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            onClick={handleSaveProfile}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
