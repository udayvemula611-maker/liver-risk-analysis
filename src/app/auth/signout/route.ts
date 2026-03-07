import { createClient } from '@/lib/supabaseServer' // Supabase client for server-side operations.
import { revalidatePath } from 'next/cache' // Utility to revalidate Next.js cache.
import { NextResponse } from 'next/server' // Next.js API response utility.

/**
 * POST /auth/signout
 *
 * This API route handles user sign-out. It checks if a user is currently logged in,
 * signs them out if they are, revalidates the cache for the root layout, and then
 * redirects the user to the login page.
 *
 * @param {Request} req - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a redirect response.
 */
export async function POST(req: Request) {
    const supabase = await createClient() // Initialize Supabase client.

    // Check if a user is currently logged in.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If a user is logged in, perform the sign-out operation.
    if (user) {
        await supabase.auth.signOut()
    }

    // Revalidate the cache for the root layout to reflect the signed-out state.
    revalidatePath('/', 'layout')
    // Redirect the user to the login page after signing out.
    return NextResponse.redirect(new URL('/login', req.url), {
        status: 302, // 302 Found status code for temporary redirection.
    })
}
