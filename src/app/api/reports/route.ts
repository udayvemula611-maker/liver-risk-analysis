import { createClient } from '@/lib/supabaseServer'; // Supabase client for server-side operations with Row-Level Security (RLS).
import { NextResponse } from 'next/server'; // Next.js API response utility.

/**
 * GET /api/reports
 *
 * This API route retrieves liver reports from the Supabase database.
 * Row-Level Security (RLS) policies are enforced to ensure that:
 * - Doctors can only view reports they have created.
 * - Patients can only view reports that are assigned to them.
 * - Administrators can view all reports.
 *
 * The reports are ordered by their creation date in descending order (newest first).
 *
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing
 *                                  an array of liver reports or an error message.
 */
export async function GET() {
    const supabase = await createClient(); // Initialize Supabase client, respecting RLS policies.

    // Fetch liver reports from the database. RLS policies on the 'liver_reports' table
    // will automatically filter the results based on the authenticated user's role.
    const { data: reports, error } = await supabase
        .from('liver_reports')
        .select('*') // Select all columns for the reports.
        .order('created_at', { ascending: false }); // Order the results by creation date, newest first.

    // If an error occurs during data fetching, return an error response.
    if (error) {
        console.error("API Reports GET Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the fetched reports as a JSON response.
    return NextResponse.json(reports);
}
