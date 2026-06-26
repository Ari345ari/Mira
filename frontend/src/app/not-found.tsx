import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 text-center px-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">404</p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">Page not found</h1>
      <p className="mb-6 text-sm text-zinc-400">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-500 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
