// /components/Modals/ProfileModal.tsx
import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';

/* Utility class for inputs */
const inputCls =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded dark:border-gray-600 ' +
  'dark:bg-gray-700 dark:text-gray-100';

export const ProfileModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'profile') return null;

  /* example defaults – can come from backend later */
  const [fullName, setFullName] = useState('Dr James Deighton');
  const [site, setSite] = useState('Whanganui Hospital, NZ');
  const [role, setRole] = useState('Emergency Physician');
  const [dept, setDept] = useState('Emergency Department');
  const [common, setCommon] = useState('CHF, AF, COPD exacerbations');
  const [style, setStyle] = useState('Concise, bullet‑points');
  const [signOff, setSignOff] = useState('Dr J Deighton MBBS FACEM');

  const close = () =>
    dispatch({ type: 'change', field: 'openModal', value: null });

  const handleSave = () => {
    const ctx = `
Role/Title: ${role}
Site: ${site}
Department/Service: ${dept}
Common cases/phrases: ${common}
Preferred writing style: ${style}
`.trim();

    dispatch({ type: 'change', field: 'userContext', value: ctx });
    dispatch({ type: 'change', field: 'userSignOff', value: signOff });

    alert('Profile saved!');
    close();
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center'>
      <div className='bg-white w-full max-w-3xl p-6 rounded shadow overflow-auto max-h-[90vh]'>
        <h2 className='text-xl font-semibold mb-4'>{t('My Profile')}</h2>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <label className='block text-sm font-medium'>
              Full Name
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Site
              <input className={inputCls} value={site} onChange={(e) => setSite(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Role / Title
              <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Department / Service
              <input className={inputCls} value={dept} onChange={(e) => setDept(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Common cases / phrases
              <textarea className={`${inputCls} h-20`} value={common} onChange={(e) => setCommon(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Preferred writing style
              <input className={inputCls} value={style} onChange={(e) => setStyle(e.target.value)} />
            </label>

            <label className='block text-sm font-medium'>
              Document sign‑off / credentials
              <textarea className={`${inputCls} h-20`} value={signOff} onChange={(e) => setSignOff(e.target.value)} />
            </label>
          </div>

          <div className='bg-gray-50 p-4 rounded text-sm'>
            <p className='font-semibold mb-2'>Tip</p>
            <p>
              The <strong>Context</strong> fields personalise AI output. Sign‑off is
              appended to every clinical document.
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-2'>
          <button onClick={close} className='px-4 py-2 bg-gray-200 rounded'>
            {t('Cancel')}
          </button>
          <button onClick={handleSave} className='px-4 py-2 bg-blue-600 text-white rounded'>
            {t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
