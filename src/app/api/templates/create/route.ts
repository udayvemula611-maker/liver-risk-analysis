import { NextResponse } from 'next/server'; // Next.js API response utility.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Supabase client, used here for admin access (bypassing RLS).
import { z } from 'zod'; // Zod for schema validation.

/**
 * Defines the Zod schema for validating incoming template data.
 * This ensures that template submissions adhere to the required structure and data types.
 */
const templateSchema = z.object({
    hospital_name: z.string().min(2, "Hospital name is required"), // Hospital name must be at least 2 characters.
    logo_url: z.string().url("Must be a valid URL").or(z.literal('')), // Optional logo URL, must be a valid URL if provided.
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid HEX color code (e.g. #1E3A8A)"), // Primary color must be a valid HEX code.
    disclaimer_text: z.string().optional(), // Optional disclaimer text.
    is_active: z.boolean().default(false) // Boolean indicating if the template is active, defaults to false.
});

/**
 * POST /api/templates/create
 *
 * This API route handles the creation of new hospital report templates.
 * It performs the following steps:
 * 1. Parses and validates the incoming request body against the `templateSchema`.
 * 2. If the new template is set as 'active', it deactivates all other existing templates
 *    to ensure only one template is active at a time.
 * 3. Inserts the new template record into the `report_templates` table in Supabase
 *    using an admin client to bypass Row-Level Security (RLS).
 * 4. Returns a success message if the template is saved successfully, or an error message.
 *
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing either
 *                                  a success message or an error message.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json(); // Parse the JSON request body.
        const result = templateSchema.safeParse(body); // Validate the body against the template schema.

        // If validation fails, return a 400 Bad Request error.
        if (!result.success) {
            console.error("Template validation error:", result.error.issues); // Corrected to use .issues
            return NextResponse.json({ error: 'Invalid template data provided.' }, { status: 400 });
        }

        const data = result.data; // Extract the validated data.

        // Initialize Supabase client with service role key for elevated permissions.
        // This is necessary to insert into the strictly protected `report_templates` table
        // and to update `is_active` status across all templates.
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // If the new template is marked as active, first deactivate all other templates.
        // This ensures that only one template can be active globally at any given time.
        if (data.is_active) {
            // Update all templates where the ID is not a dummy ID (to ensure it's not trying to update non-existent templates).
            // In a real application, this might target existing active templates more precisely.
            await supabaseAdmin.from('report_templates').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Insert the new template record into the database.
        const { error: insertError } = await supabaseAdmin.from('report_templates').insert({
            hospital_name: data.hospital_name,
            logo_url: data.logo_url && data.logo_url !== '' ? data.logo_url : null, // Store logo_url or null if empty.
            primary_color: data.primary_color,
            disclaimer_text: data.disclaimer_text || null, // Store disclaimer_text or null if empty.
            is_active: data.is_active
        });

        if (insertError) {
            console.error('Failed to insert template into database:', insertError);
            return NextResponse.json({ error: 'Failed to insert template into database.' }, { status: 500 });
        }

        // Return a successful response.
        return NextResponse.json({ message: 'Template saved successfully.' }, { status: 201 });

    } catch (error: any) {
        console.error('API Error saving template:', error); // Log any unexpected errors.
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
