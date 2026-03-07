import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';

/**
 * Navbar Component
 *
 * This component renders the main navigation bar for the application.
 * It conditionally displays navigation links based on the user's authentication status.
 * If a user is logged in, it shows a "Portal Access" badge and a "Sign Out" button.
 * Otherwise, it displays a "Provider & Patient Login" link.
 *
 * @returns {Promise<JSX.Element>} A Promise that resolves to the Navbar JSX element.
 */
export default async function Navbar() {
    // Create a Supabase client instance for server-side operations to fetch user session.
    const supabase = await createClient();
    // Fetch the authenticated user's session data.
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
                {/* Application Logo and Title */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-[#1E3A8A] rounded-md flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <span className="font-bold sm:inline-block text-xl text-[#1E3A8A] tracking-tight">
                        Liver Analysis
                    </span>
                </Link>

                {/* User Authentication Status and Actions */}
                <div className="flex items-center space-x-4 text-sm font-medium">
                    {user ? (
                        // Render if user is logged in
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold bg-blue-50 text-[#1E3A8A] px-3 py-1 rounded-full border border-blue-100">Portal Access</span>
                            {/* Sign Out Form */}
                            <form action="/auth/signout" method="post">
                                <button className="text-gray-500 hover:text-red-600 transition-colors font-semibold">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    ) : (
                        // Render if no user is logged in
                        <>
                            <Link href="/login" className="bg-[#1E3A8A] text-white px-5 py-2 rounded-lg hover:bg-[#152b66] transition-colors shadow-sm font-medium">
                                Provider & Patient Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
