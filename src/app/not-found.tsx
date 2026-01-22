import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
			<div className="max-w-2xl w-full text-center">
				<div className="mb-8">
					<h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
					<h2 className="text-4xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
					<p className="text-xl text-gray-600 mb-8">
						Sorry, we couldn't find the page you're looking for.
					</p>
				</div>

				<div className="space-y-4">
					<Link
						href="/"
						className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
						Go Back Home
					</Link>
					<div className="text-sm text-gray-500">
						or try searching for what you need
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-gray-200">
					<p className="text-sm text-gray-500">
						Error Code: 404 | Page Not Found
					</p>
				</div>
			</div>
		</div>
	);
}
