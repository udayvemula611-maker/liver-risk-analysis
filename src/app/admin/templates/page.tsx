import { redirect } from 'next/navigation'; // For redirecting users.
import { checkRole } from '@/lib/auth'; // Utility to check user roles.
import Sidebar from '@/components/Sidebar'; // Sidebar navigation component.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client for admin operations.
import TemplateEditorClient from './TemplateEditorClient'; // Client component for editing templates.

/**
 * AdminTemplatesPage Component
 *
 * This page allows administrators to manage hospital report templates. It fetches existing
 * templates from the database and passes them to the `TemplateEditorClient` component for editing.
 * Access to this page is restricted to users with the 'admin' role.
 *
 * @returns {Promise<JSX.Element>} The rendered admin templates management page.
 */
export default async function AdminTemplatesPage() {
    // Authenticate user and check for 'admin' role. Redirects to login if not authorized.
    const user = await checkRole(['admin']);
    if (!user) {
        redirect('/login');
    }

    // Initialize Supabase client with service role key for elevated permissions.
    // This bypasses Row-Level Security (RLS) to fetch all report template data.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all existing report templates from the database, ordered by creation date.
    const { data: templates } = await supabaseAdmin
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar role="admin" /> {/* Renders the admin-specific sidebar navigation. */}
            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Page Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hospital Templates</h1>
                        <p className="text-gray-500">Manage branding and styling generated on PDF patient reports.</p>
                    </div>
                </div>

                {/* Template Editor Client Component */}
                <TemplateEditorClient templates={templates || []} />
            </main>
        </div>
    );
}
