import { NextResponse } from 'next/server'; // Next.js API response utility.
import { cookies } from 'next/headers'; // Next.js utility to access request cookies.
import { createServerClient } from '@supabase/ssr'; // Supabase client for server-side operations with RLS.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Standard Supabase client, used here for admin access (bypassing RLS).

/**
 * POST /api/prescriptions
 *
 * This API route handles the creation of medical prescriptions for liver reports.
 * It performs the following steps:
 * 1. Authenticates the user session and verifies if the user is a doctor.
 * 2. Parses the incoming request body containing the report ID, prescription text, and optional follow-up date.
 * 3. Validates essential input fields.
 * 4. Fetches the associated liver report to verify doctor ownership and retrieve patient ID.
 * 5. Inserts the new prescription into the Supabase database.
 * 6. Handles potential unique constraint violations (e.g., a prescription already exists for the report).
 * 7. Returns a success message and the created prescription data, or an error message.
 *
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing either
 *                                  the prescription details or an error message.
 */
export async function POST(request: Request) {
    try {
        const cookieStore = cookies(); // Access the cookie store for session management.
        const reqCookies = await cookieStore; // Retrieve all cookies.

        // Initialize Supabase client for server-side operations, respecting RLS.
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return reqCookies.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => reqCookies.set(name, value, options));
                        } catch {
                            // This catch block is for when `setAll` is called from a Server Component,
                            // which can be safely ignored if middleware is refreshing user sessions.
                        }
                    },
                },
            }
        );

        // Authenticate the user session. Returns unauthorized if no user is found.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json(); // Parse the JSON request body.
        const { report_id, prescription_text, follow_up_date } = body; // Destructure necessary fields.

        // Validate required fields.
        if (!report_id || !prescription_text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Supabase client with service role key for elevated permissions.
        // This is used to bypass RLS for fetching reports and inserting prescriptions.
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get the report details to find the patient_id and verify doctor ownership.
        const { data: report, error: reportError } = await supabaseAdmin
            .from('liver_reports')
            .select('patient_id, doctor_id')
            .eq('id', report_id)
            .single();

        if (reportError || !report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Security check: Only the doctor who created the report can add a prescription to it.
        if (report.doctor_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden. You do not own this report.' }, { status: 403 });
        }

        // Insert the new prescription into the database.
        const { data: prescription, error: insertError } = await supabaseAdmin
            .from('prescriptions')
            .insert({
                report_id,
                doctor_id: user.id,
                patient_id: report.patient_id,
                prescription_text,
                follow_up_date: follow_up_date || null // Store follow-up date, or null if not provided.
            })
            .select() // Select the newly inserted row.
            .single(); // Expect a single record to be returned.

        if (insertError) {
            if (insertError.code === '23505') { // PostgreSQL unique_violation error code.
                return NextResponse.json({ error: 'A prescription already exists for this report.' }, { status: 400 });
            }
            console.error('Prescription Insert Error:', insertError);
            return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
        }

        // Return a successful response with the created prescription.
        return NextResponse.json({ message: 'Prescription created successfully.', prescription }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error); // Log any unexpected errors during API execution.
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
