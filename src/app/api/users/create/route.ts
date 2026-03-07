import { NextResponse } from 'next/server'; // Next.js API response utility.
import { createServerClient } from '@supabase/ssr'; // Supabase client for server-side operations with RLS.
import { cookies } from 'next/headers'; // Next.js utility to access request cookies.
import { z } from 'zod'; // Zod for schema validation.

/**
 * Defines the Zod schema for validating incoming user creation data.
 * This ensures that new user submissions adhere to the required structure and data types.
 */
const createUserSchema = z.object({
    email: z.string().email('Invalid email address'), // Email must be a valid email format.
    password: z.string().min(6, 'Password must be at least 6 characters'), // Password must be at least 6 characters long.
    full_name: z.string().min(2, 'Full name is required'), // Full name must be at least 2 characters.
    role: z.enum(['doctor', 'patient']), // Role must be either 'doctor' or 'patient'.
    age: z.string().optional(), // Optional age, stored as a string initially.
    gender: z.string().optional(), // Optional gender.
    assigned_doctor: z.string().optional().nullable() // Optional assigned doctor ID for patients, can be null.
});

/**
 * POST /api/users/create
 *
 * This API route handles the creation of new user accounts (doctors or patients) by an administrator.
 * It performs the following steps:
 * 1. Verifies that the requester is an authenticated administrator.
 * 2. Parses and validates the incoming request body against the `createUserSchema`.
 * 3. Creates the new user account in Supabase using the admin client.
 * 4. Updates additional profile fields (age, gender, assigned doctor) in the `profiles` table.
 * 5. Returns a success message and the new user's basic information, or an error message.
 *
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing either
 *                                  the new user's details or an error message.
 */
export async function POST(request: Request) {
    try {
        const cookieStore = cookies(); // Access the cookie store for session management.
        const reqCookies = await cookieStore; // Retrieve all cookies.

        // 1. Verify the requester is an Admin using a standard Supabase client.
        // This ensures the current session has admin privileges before allowing user creation.
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return reqCookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                reqCookies.set(name, value, options)
                            );
                        } catch (error) {
                            // This catch block is for when `setAll` is called from a Server Component.
                            // It can be safely ignored if middleware is refreshing user sessions.
                            console.warn("Could not set cookies from Server Component in create user route:", error);
                        }
                    },
                },
            }
        );

        // Get the authenticated user's session.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use a Supabase Admin client (bypassing RLS) to check the current user's role.
        // This is a critical security step to ensure only admins can create other users.
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => { } } } // Admin client doesn't use cookies from request.
        );

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        // 2. Validate new user data from the request body.
        const body = await request.json();
        const result = createUserSchema.safeParse(body);

        // If validation fails, return a 400 Bad Request error with the first validation issue message.
        if (!result.success) {
            console.error("User creation validation error:", result.error.issues); // Log detailed validation errors.
            return NextResponse.json({ error: result.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
        }

        const { email, password, full_name, role, age, gender, assigned_doctor } = result.data;

        // 3. Create the new user using the Supabase Admin client's `createUser` method.
        // This bypasses email confirmation if configured in Supabase and allows setting initial user metadata.
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Set to true to confirm email upon creation.
            user_metadata: {
                full_name: full_name,
                role: role,
                age: age ? parseInt(age) : null, // Convert age to number if present.
                gender: gender || null
            }
        });

        if (createError) {
            console.error("Supabase create user error:", createError.message);
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        // 4. Update additional profile fields in the `profiles` table.
        // The auth trigger might not copy all custom metadata, so this step ensures all fields are set.
        if (newUser.user) {
            const updatePayload: any = {
                // Initialize with an empty object or specific fields that are always updated.
            };
            if (age) updatePayload.age = parseInt(age); // Update age if provided.
            if (gender) updatePayload.gender = gender; // Update gender if provided.
            if (role === 'patient' && assigned_doctor) {
                updatePayload.assigned_doctor = assigned_doctor; // Assign doctor if user is a patient.
            }

            // Only perform an update if there are fields to update.
            if (Object.keys(updatePayload).length > 0) {
                const { error: updateProfileError } = await supabaseAdmin
                    .from('profiles')
                    .update(updatePayload)
                    .eq('id', newUser.user.id);

                if (updateProfileError) {
                    console.error("Supabase profile update error:", updateProfileError);
                    // This error might not prevent user creation but is important to log.
                }
            }
        }

        // Return a successful response with the new user's basic details.
        return NextResponse.json({
            message: `Successfully created ${role} account for ${full_name}`,
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                role: role
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating user endpoint:', error); // Log any unexpected errors.
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
