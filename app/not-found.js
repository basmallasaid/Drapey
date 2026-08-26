import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h2 className="text-2xl font-serif tracking-widest uppercase mb-6 text-gray-400">
        Page Not Found
      </h2>
      <Link
        href="/"
        className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
