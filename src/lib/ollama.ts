import { ReportInput } from '../types/report';
import { Ollama } from 'ollama';

/**
 * Generates a medical summary based on liver function profile data using an LLM.
 *
 * @param {ReportInput} values - The input values from the liver function report.
 * @param {number} riskScore - The calculated risk score for the patient.
 * @param {string} riskLevel - The determined risk level for the patient.
 * @returns {Promise<string>} A Promise that resolves to the generated medical summary string.
 */
export async function generateSummary(
    values: ReportInput,
    riskScore: number,
    riskLevel: string
): Promise<string> {
    // Privacy First: Explicitly omit the patient name from the LLM payload to maintain clinical confidentiality.
    const prompt = `
You are an expert hepatologist AI assistant.
Analyze the following comprehensive Liver Function Profile for a ${values.age}-year-old ${values.gender}.

Primary Biomarkers:
- Total Bilirubin: ${values.total_bilirubin} mg/dL (Normal: 0.1 - 1.2)
- SGPT (ALT): ${values.sgpt} U/L (Normal: 7 - 56)
- SGOT (AST): ${values.sgot} U/L (Normal: 8 - 48)
- Albumin: ${values.albumin} g/dL (Normal: 3.4 - 5.4)

Advanced Markers & History:
- Alk Phosphate: ${values.alk_phosphate || 'N/A'} U/L (Normal: 44 - 147)
- Prothrombin Time: ${values.protime || 'N/A'} s (Normal: 11 - 13.5)
- Medical History: ${[values.steroid ? 'On Steroids' : null, values.antivirals ? 'On Antivirals' : null].filter(Boolean).join(', ') || 'None reported'}

Clinical Symptoms:
- Fatigue: ${values.fatigue ? 'PRESENT' : 'Absent'}
- Spiders: ${values.spiders ? 'PRESENT' : 'Absent'}
- Ascites: ${values.ascites ? 'PRESENT' : 'Absent'}
- Varices: ${values.varices ? 'PRESENT' : 'Absent'}
- Histology: ${values.histology || 'Not Performed'}

Risk Engine Model Output:
- Risk Score: ${riskScore} / 50
- Risk Level: ${riskLevel}
- Probability Score: ${values.alk_phosphate ? Math.round((riskScore / 50) * 100) : 'N/A'}%

Provide a sophisticated, professional medical synthesis.
1. Correlate clinical symptoms (like Ascites/Varices) with lab abnormalities (Bilirubin/Albumin).
2. Explain the significance of the probability score in the context of these markers.
3. Outline potential differential considerations and specific clinical follow-ups.

Keep the response cleanly formatted in 3-4 concise paragraphs. Focus strictly on the medical data above. Do not output markdown code blocks or conversational filler.
`;

    try {
        // Retrieve API key and base URL from environment variables.
        const apiKey = process.env.OLLAMA_API_KEY || '';
        const baseUrl = process.env.OLLAMA_BASE_URL || 'https://ollama.com';

        console.log(`[AI] Connecting to Cloud Ollama (${baseUrl}) using model gpt-oss:120b...`);

        // Initialize the Ollama client with cloud parameters.
        const ollama = new Ollama({
            host: baseUrl,
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
        });

        // Define the specific cloud model to be used for the chat.
        const model = 'gpt-oss:120b';

        // Make a chat completion request to the Ollama model.
        const response = await ollama.chat({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful medical assistant for doctors.' },
                { role: 'user', content: prompt }
            ],
            stream: false, // Ensure the response is not streamed.
            options: {
                temperature: 0.3 // Set a lower temperature for more deterministic and focused responses.
            }
        });

        return response.message?.content?.trim() || "Generated AI summary could not be extracted.";
    } catch (error: any) {
        console.error("[AI] Cloud Connectivity Error:", error.message);
        return "Error generating AI explanation. " + (error?.message || "Service unavailable.");
    }
}
