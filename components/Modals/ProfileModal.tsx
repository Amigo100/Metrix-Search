// /components/Modals/ProfileModal.tsx

import { useState, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';

export const ProfileModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'profile') return null;

  // Example defaults
  const [fullName, setFullName] = useState('Dr James Deighton');
  const [site, setSite] = useState('Whanganui Hospital, New Zealand');
  const [email, setEmail] = useState('j.deighton@metrixai.com');
  const [password, setPassword] = useState('');
  const [signOff, setSignOff] = useState('Dr James Deighton, MBBS');

  const handleClose = () => {
    dispatch({ field: 'openModal', value: null });
  };

  const handleSaveProfile = () => {
    dispatch({ field: 'userSignOff', value: signOff });
    alert('Profile saved! (placeholder)');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl p-6 rounded shadow overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('My Profile')}
        </h2>
        <div className="flex flex-col md:flex-row">
          {/* Left column: Profile Form */}
          <div className="md:w-1/2 md:pr-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Full Name')}
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                  dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Site')}
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                  dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                value={site}
                onChange={(e) => setSite(e.target.value)}
              />
            </label>

            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Email')}
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                  dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Password')}
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                  dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                placeholder={t('Enter new password') as string}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Document Sign-Off / Credentials')}
              <textarea
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                  dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 h-20"
                value={signOff}
                onChange={(e) => setSignOff(e.target.value)}
              />
            </label>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 
                  dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={handleClose}
              >
                {t('Cancel')}
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={handleSaveProfile}
              >
                {t('Save')}
              </button>
            </div>
          </div>

          {/* Right column: Additional Info */}
          <div className="md:w-1/2 md:pl-4 mt-6 md:mt-0">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {t('Recent Changes')}
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>- {t('Updated UI for better user experience')}</li>
                <li>- {t('Bug fixes in transcription')}</li>
                <li>- {t('Enhanced security for local ML usage')}</li>
                <li>- {t('Refined sign-off field')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
