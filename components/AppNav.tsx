import {
  BookOpenText,
  FilePen,
  LayoutGrid,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useState } from 'react';

import Link from 'next/link';

const AppNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="p-2 rounded-md hover:bg-gray-100"
        onClick={() => setOpen(!open)}
        aria-label="Open app navigation"
      >
        <LayoutGrid className="h-6 w-6 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="grid grid-cols-2 gap-4 p-4 text-gray-700 text-xs">
            <Link
              href="/ed-triage"
              className="flex flex-col items-center hover:text-teal-600"
            >
              <Stethoscope className="h-6 w-6 mb-1" />
              <span>ED Triage</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center hover:text-teal-600"
            >
              <Phone className="h-6 w-6 mb-1" />
              <span>Switchboard</span>
            </Link>
            <Link
              href="/"
              className="flex flex-col items-center hover:text-teal-600"
            >
              <BookOpenText className="h-6 w-6 mb-1" />
              <span>Guidelines</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center hover:text-teal-600"
            >
              <FilePen className="h-6 w-6 mb-1" />
              <span>Scribe</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppNav;
