import { createClient } from '@/lib/supabaseServer'; // Supabase client for server-side operations with Row-Level Security (RLS).
import { NextResponse } from 'next/server'; // Next.js API response utility.

/**
 * GET /api/users
 *
 * This API route retrieves user profiles from the Supabase database.
 * Row-Level Security (RLS) policies are automatically enforced to filter
 * the results based on the authenticated user's role:
 * - Administrators can view all user profiles.
 * - Regular users (doctors, patients) can only view their own profile.
 *
 * The user profiles are ordered by their creation date in descending order (newest first).
 *
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing
 *                                  an array of user profiles or an error message.
 */
export async function GET() {
    const supabase = await createClient(); // Initialize Supabase client, respecting RLS policies.

    // Fetch user profiles from the database. RLS policies on the 'profiles' table
    // will automatically filter the results based on the authenticated user's role.
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*') // Select all columns for the user profiles.
        .order('created_at', { ascending: false }); // Order the results by creation date, newest first.

    // If an error occurs during data fetching, return an error response.
    if (error) {
        console.error("API Users GET Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the fetched user profiles as a JSON response.
    return NextResponse.json(users);
}
