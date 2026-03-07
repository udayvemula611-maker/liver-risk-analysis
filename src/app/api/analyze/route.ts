import { createClient } from '@/lib/supabaseServer'; // Supabase client for server-side operations with RLS.
import { NextResponse } from 'next/server'; // Next.js API response utility.
import { calculateRisk } from '@/lib/riskEngine'; // Custom utility for calculating liver risk.
import { generateSummary } from '@/lib/ollama'; // AI utility for generating medical summaries.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Standard Supabase client, used here for admin access (bypassing RLS).

/**
 * POST /api/analyze
 *
 * This API route handles the submission of patient liver function data for analysis.
 * It performs the following steps:
 * 1. Authenticates the user and verifies if they have a 'doctor' role.
 * 2. Parses the incoming request body containing patient and lab data.
 * 3. Securely fetches additional patient demographics (age, gender, full_name) using a Supabase service role key.
 * 4. Validates essential input fields.
 * 5. Calculates the liver disease risk using a rule-based engine (`calculateRisk`).
 * 6. Generates an AI-assisted medical summary using the Ollama API (`generateSummary`).
 * 7. Stores the comprehensive liver report record securely in the Supabase database.
 * 8. Returns the newly created report's ID, risk score, risk level, and AI summary to the frontend.
 *
 * @param {Request} req - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Promise that resolves to a JSON response containing either
 *                                  the analysis results or an error message.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient(); // Initialize Supabase client for RLS-enabled operations.

        // Authenticate the user session to ensure a logged-in user.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role verification: ensure only Doctors can submit a new analysis report.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'doctor') {
            console.error(`AI: Unauthorized Role. User ${user.id} is a ${profile?.role}.`);
            return NextResponse.json({ error: 'Only doctors can submit liver analysis reports' }, { status: 403 });
        }

        const body = await req.json(); // Parse the JSON body from the request.
        console.log("AI: Received Request Body:", JSON.stringify(body, null, 2)); // Log the received body for debugging.

        // Destructure relevant fields from the request body.
        const {
            patient_id,
            total_bilirubin,
            sgpt,
            sgot,
            albumin,
            alk_phosphate,
            protime,
            fatigue,
            spiders,
            ascites,
            varices,
            steroid,
            antivirals,
            histology
        } = body;

        // Initialize variables for patient demographics.
        let patient_name = 'Anonymous Patient';
        let age: number | null = null;
        let gender = 'Unknown';

        // Fetch patient demographics securely using a Supabase Admin client (bypasses RLS).
        // This is necessary to retrieve patient details regardless of the current user's RLS policies.
        if (patient_id) {
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: patientProfile, error: profileErr } = await supabaseAdmin.from('profiles').select('full_name, age, gender').eq('id', patient_id).single();
            if (profileErr) {
                console.error("AI: Patient Profile Fetch Error:", profileErr.message);
            } else if (patientProfile) {
                patient_name = patientProfile.full_name || 'Anonymous Patient';
                age = patientProfile.age;
                gender = patientProfile.gender || 'Unknown';
                console.log(`AI: Fetched Demographics for ${patient_id}: Name=${patient_name}, Age=${age}, Gender=${gender}`);
            }
        }

        // Validate essential inputs. Ensure core lab values and patient demographics are present.
        if (!patient_id || age === null || gender === 'Unknown' || total_bilirubin == null || sgpt == null || sgot == null || albumin == null) {
            const missing = [];
            if (!patient_id) missing.push('patient_id');
            if (age === null) missing.push('age');
            if (gender === 'Unknown') missing.push('gender');
            if (total_bilirubin == null) missing.push('total_bilirubin');
            // Additional checks can be added for other required fields.
            console.error("AI: Validation Failed. Missing fields:", missing.join(', '));
            return NextResponse.json({ error: `Missing required lab values or Patient demographics not set: ${missing.join(', ')}` }, { status: 400 });
        }

        // Assemble the full report data, including fetched demographics.
        const fullReportData = {
            ...body,
            patient_name,
            age,
            gender
        };

        // 1. Calculate Risk using the rule-based risk engine.
        const risk = calculateRisk(fullReportData);

        // 2. Generate AI Explanation via the Ollama API for a detailed summary.
        console.log("AI: Starting AI summary generation...");
        const summary = await generateSummary(fullReportData, risk.score, risk.level);
        console.log("AI: Summary generated successfully.");

        // 3. Store the comprehensive liver report securely in Supabase.
        const { data: insertData, error } = await supabase.from('liver_reports').insert({
            doctor_id: user.id,
            patient_id: patient_id || null, // Ensure patient_id is nullable if patient is anonymous.
            patient_name,
            age: Number(age),
            gender,
            total_bilirubin: Number(total_bilirubin),
            sgpt: Number(sgpt),
            sgot: Number(sgot),
            albumin: Number(albumin),
            alk_phosphate: alk_phosphate ? Number(alk_phosphate) : null, // Handle optional numeric fields.
            protime: protime ? Number(protime) : null, // Handle optional numeric fields.
            fatigue: !!fatigue, // Convert to boolean.
            spiders: !!spiders, // Convert to boolean.
            ascites: !!ascites, // Convert to boolean.
            varices: !!varices, // Convert to boolean.
            steroid: !!steroid, // Convert to boolean.
            antivirals: !!antivirals, // Convert to boolean.
            histology: histology || 'None', // Default to 'None' if not provided.
            risk_score: risk.score,
            risk_level: risk.level,
            ai_summary: summary
        }).select('id').single(); // Select the ID of the newly inserted record.

        if (error) {
            console.error("Supabase Insert Error:", error);
            return NextResponse.json({ error: 'Internal database error.' }, { status: 500 });
        }

        // 4. Return success response to the frontend with generated report details.
        return NextResponse.json({
            reportId: insertData.id,
            riskScore: risk.score,
            riskLevel: risk.level,
            summary
        });

    } catch (err: any) {
        console.error("Analysis Endpoint Error:", err); // Log any unexpected errors in the API route.
        return NextResponse.json({ error: 'Server error processing the report.' }, { status: 500 });
    }
}
