import { redirect } from 'next/navigation'; // For redirecting users.
import { checkRole } from '@/lib/auth'; // Utility to check user roles.
import Sidebar from '@/components/Sidebar'; // Sidebar navigation component.
import LiverForm from '@/components/LiverForm'; // Form component for liver analysis.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client for admin operations.

/**
 * NewReportPage Component
 *
 * This page provides an interface for doctors to create new patient liver analysis reports.
 * It fetches a list of patients assigned to the current doctor (bypassing RLS with an admin client)
 * and passes them to the `LiverForm` component. Access is restricted to 'doctor' roles.
 *
 * @returns {Promise<JSX.Element>} The rendered new report creation page.
 */
export default async function NewReportPage() {
    // Authenticate user and check for 'doctor' role. Redirects to login if not authorized.
    const user = await checkRole(['doctor']);
    if (!user) {
        redirect('/login');
    }

    // Initialize Supabase client with service role key for elevated permissions.
    // This bypasses Row-Level Security (RLS) to fetch patient data,
    // ensuring a doctor can see all their assigned patients.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Fetch patient profiles that are assigned to the current doctor, ordered by creation date.
    const { data: patients } = await supabaseAdmin.from('profiles').select('id, full_name, role, age, gender, created_at').eq('role', 'patient').eq('assigned_doctor', user.id).order('created_at', { ascending: false });

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar role="doctor" /> {/* Renders the doctor-specific sidebar navigation. */}
            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Analysis</h1>
                    <p className="text-gray-500">Enter patient lab values to generate an AI-assisted risk report.</p>
                </div>

                {/* Liver Analysis Form Component */}
                <LiverForm patients={patients || []} />
            </main>
        </div>
    );
}
