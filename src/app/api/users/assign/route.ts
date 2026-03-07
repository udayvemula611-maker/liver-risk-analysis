import { NextResponse } from 'next/server'; // Next.js API response utility.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client, used here for admin access (bypassing RLS).
import { cookies } from 'next/headers'; // Next.js utility to access request cookies.
import { createServerClient } from '@supabase/ssr'; // Supabase client for server-side operations with RLS.

/**
 * POST /api/users/assign
 *
 * This API route handles assigning a doctor to a patient or unassigning a doctor.
 * It performs the following steps:
 * 1. Authenticates the user session and verifies if the user has an 'admin' role.
 * 2. Parses the incoming request body containing `patient_id` and `doctor_id`.
 * 3. Validates that `patient_id` is provided.
 * 4. Updates the `assigned_doctor` field for the specified patient in the Supabase `profiles` table.
 * 5. Returns a success message if the assignment is updated successfully, or an error message.
 *
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing either
 *                                  a success message or an error message.
 */
export async function POST(request: Request) {
    try {
        const cookieStore = cookies(); // Access the cookie store for session management.
        const reqCookies = await cookieStore; // Retrieve all cookies.

        // Initialize Supabase client for server-side operations to verify admin access.
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return reqCookies.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => reqCookies.set(name, value, options));
                        } catch (error) {
                            // This catch block is for when `setAll` is called from a Server Component.
                            // It can be safely ignored if middleware is refreshing user sessions.
                            console.warn("Could not set cookies from Server Component in assign route:", error);
                        }
                    },
                },
            }
        );

        // Authenticate the user session. Returns unauthorized if no user is found.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Initialize Supabase client with service role key for elevated permissions.
        // This is necessary to bypass RLS and update user profiles.
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify that the authenticated user has 'admin' role.
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const body = await request.json(); // Parse the JSON request body.
        const { patient_id, doctor_id } = body; // Destructure `patient_id` and `doctor_id`.

        // Validate required fields.
        if (!patient_id) {
            return NextResponse.json({ error: 'Patient ID is required.' }, { status: 400 });
        }

        // Determine the ID to assign. If `doctor_id` is provided, use it; otherwise, set to null for unassignment.
        const assignId = doctor_id ? doctor_id : null;

        // Update the patient's profile with the assigned doctor's ID.
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ assigned_doctor: assignId })
            .eq('id', patient_id);

        if (error) {
            console.error('Error updating patient assignment:', error);
            return NextResponse.json({ error: 'Failed to assign doctor.' }, { status: 500 });
        }

        // Return a successful response.
        return NextResponse.json({ message: 'Patient assignment updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Error in assign route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
