import { redirect, notFound } from 'next/navigation'; // For redirection and handling not-found cases.
import { checkRole } from '@/lib/auth'; // Utility to check user roles.
import Sidebar from '@/components/Sidebar'; // Sidebar navigation component.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client for admin operations.
import Link from 'next/link'; // Next.js Link component for client-side navigation.
import { ArrowLeft } from 'lucide-react'; // Icon for navigation.
import ReportCard from '@/components/ReportCard'; // Component to display individual report summaries.
import * as motion from 'framer-motion/client'; // Animation library.

/**
 * AdminUserProfilePage Component
 *
 * This page displays the detailed profile of a specific user for administrators.
 * It fetches the user's profile, their associated liver reports (as either a doctor or patient),
 * and calculates relevant statistics. Access is restricted to 'admin' roles.
 *
 * @param {object} props - The properties for the component.
 * @param {{ id: string }} props.params - The route parameters, containing the user's ID.
 * @returns {Promise<JSX.Element>} The rendered admin user profile page.
 */
export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // Extract user ID from route parameters.

    // Authenticate admin user. Redirects to login if not authorized.
    const adminUser = await checkRole(['admin']);
    if (!adminUser) redirect('/login');

    // Initialize Supabase client with service role key for elevated permissions.
    // This bypasses Row-Level Security (RLS) to fetch all user and report data.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the target user's profile based on the ID.
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    if (!profile) return notFound(); // If no profile is found, render a 404 page.

    // Fetch related reports for the user, either as a doctor (doctor_id) or a patient (patient_id).
    const { data: reports } = await supabaseAdmin
        .from('liver_reports')
        .select('*')
        .or(`doctor_id.eq.${profile.id},patient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false }); // Order reports by creation date, newest first.

    // Determine the assigned doctor's name if the user is a patient.
    let assignedDoctorName = 'None';
    if (profile.role === 'patient' && profile.assigned_doctor) {
        const { data: dr } = await supabaseAdmin.from('profiles').select('full_name').eq('id', profile.assigned_doctor).single();
        if (dr) assignedDoctorName = dr.full_name;
    }

    // Calculate summary statistics for the user's reports.
    const totalReports = reports?.length || 0;
    const highRiskReports = reports?.filter(r => r.risk_level === 'High').length || 0;

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar role="admin" /> {/* Renders the admin-specific sidebar navigation. */}
            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Animated container for the page content. */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* Link to navigate back to the Users management page. */}
                    <Link href="/admin/users" className="flex items-center text-sm text-[#3B82F6] hover:text-[#1E3A8A] font-medium mb-6 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Users
                    </Link>

                    {/* User Profile Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {/* User Full Name and Role Badge */}
                                <h1 className="text-3xl font-extrabold tracking-tight text-primary">{profile.full_name || 'Anonymous User'}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profile.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                    profile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    {profile.role}
                                </span>
                            </div>
                            <p className="text-muted-foreground">{profile.email}</p>

                            {/* Additional User Details (Age, Gender, Assigned Doctor, Joined Date) */}
                            <div className="mt-6 flex gap-8">
                                {profile.role === 'patient' && (
                                    <>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Age</p>
                                            <p className="font-medium">{profile.age || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gender</p>
                                            <p className="font-medium">{profile.gender || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned Doctor</p>
                                            <p className="font-medium text-blue-700">{assignedDoctorName}</p>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Joined Date</p>
                                    <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Statistics Cards (Total Reports, High Risk Diagnoses/Latest Risk Level) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Card: Total Reports Generated/Received by the user. */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Reports {profile.role === 'doctor' ? 'Generated' : 'Received'}</p>
                            <p className="text-4xl font-extrabold text-primary mt-2">{totalReports}</p>
                        </div>
                        {/* Card: High Risk Diagnoses (for doctors) or Latest Risk Level (for patients). */}
                        {profile.role === 'doctor' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">High Risk Diagnoses</p>
                                <p className="text-4xl font-extrabold text-red-600 mt-2">{highRiskReports}</p>
                            </div>
                        )}
                        {profile.role === 'patient' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Latest Risk Level</p>
                                <p className={`text-2xl font-extrabold mt-2 ${reports?.[0]?.risk_level === 'High' ? 'text-red-600' :
                                    reports?.[0]?.risk_level === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {reports?.[0]?.risk_level ? reports[0].risk_level.toUpperCase() : 'N/A'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Report History Section */}
                    <h2 className="text-xl font-bold mb-4 text-primary">Report History</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports?.map(report => (
                            <ReportCard key={report.id} report={report} /> // Displays a summary card for each report in the history.
                        ))}
                        {/* Message displayed if no reports are found for the user. */}
                        {(!reports || reports.length === 0) && (
                            <div className="col-span-full p-8 text-center text-muted-foreground bg-white rounded-xl border border-dashed border-gray-300">
                                No active medical reports found for this user.
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
