import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-semibold text-teal-700">
          Metrix AI
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-teal-700">
            Policy Search
          </Link>
          <Link href="/clinical-scoring-tools" className="text-gray-600 hover:text-teal-700">
            Risk &amp; Scoring Tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
