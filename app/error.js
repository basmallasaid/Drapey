'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-serif tracking-widest uppercase mb-4 text-gray-400">
        Something went wrong
      </h2>
      <p className="text-gray-500 text-sm mb-8 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-gray-200 px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
