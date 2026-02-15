export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">403</h1>
        <p className="mt-1 text-base text-gray-600">Unauthorized Access</p>
        <p className="mt-0.5 text-sm text-gray-500">
          You don't have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
