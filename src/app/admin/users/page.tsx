import { redirect } from 'next/navigation'; // For redirecting users.
import { checkRole } from '@/lib/auth'; // Utility to check user roles.
import Sidebar from '@/components/Sidebar'; // Sidebar navigation component.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client for admin operations.
import UsersTableClient from '@/app/admin/users/UsersTableClient'; // Client component for displaying and managing users.

/**
 * AdminUsersPage Component
 *
 * This page provides an interface for administrators to manage user accounts (Doctors and Patients).
 * It fetches all user profiles from the database and displays them in a table via `UsersTableClient`.
 * Access to this page is restricted to users with the 'admin' role.
 *
 * @returns {Promise<JSX.Element>} The rendered admin user management page.
 */
export default async function AdminUsersPage() {
    // Authenticate user and check for 'admin' role. Redirects to login if not authorized.
    const user = await checkRole(['admin']);
    if (!user) {
        redirect('/login');
    }

    // Initialize Supabase client with service role key for elevated permissions.
    // This bypasses Row-Level Security (RLS) to fetch all user profile data.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all user profiles from the database, ordered by creation date.
    const { data: users } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar role="admin" /> {/* Renders the admin-specific sidebar navigation. */}
            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E3A8A]">User Management</h1>
                        <p className="text-gray-500 mt-1">Create and manage Doctor and Patient accounts for the platform.</p>
                    </div>
                </div>

                {/* Users Table Client Component */}
                <UsersTableClient initialUsers={users || []} />
            </main>
        </div>
    );
}
