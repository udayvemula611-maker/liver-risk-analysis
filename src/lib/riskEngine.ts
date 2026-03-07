import { ReportInput } from '../types/report';

/**
 * Calculates the liver disease risk score, level, and probability based on patient's report input.
 *
 * This function evaluates various biomarkers, clinical symptoms, and historical data
 * to determine a comprehensive risk assessment. Each factor contributes to a total score,
 * which is then used to categorize the risk level and calculate a probability percentage.
 *
 * @param {ReportInput} values - An object containing the patient's liver function report data.
 * @returns {{ score: number; level: string; probability: number }} An object containing:
 *   - `score`: The calculated numerical risk score.
 *   - `level`: The categorized risk level (e.g., "Low", "Moderate", "High", "Critical").
 *   - `probability`: The risk probability as a percentage (0-100).
 */
export function calculateRisk(values: ReportInput): { score: number; level: string; probability: number } {
    let score = 0;

    // 1. Core Lab Values Assessment
    // These markers are fundamental indicators of liver health and function.

    // Total Bilirubin (Normal range: 0.1 - 1.2 mg/dL)
    // Elevated bilirubin can indicate impaired liver function or bile duct obstruction.
    if (values.total_bilirubin > 1.2 && values.total_bilirubin <= 2.0) score += 2;
    else if (values.total_bilirubin > 2.0) score += 4;

    // SGPT / ALT (Normal range: 7 - 56 U/L)
    // Alanine aminotransferase (ALT) is an enzyme found primarily in the liver; elevated levels suggest liver cell damage.
    if (values.sgpt > 56 && values.sgpt <= 100) score += 1;
    else if (values.sgpt > 100 && values.sgpt <= 200) score += 3;
    else if (values.sgpt > 200) score += 5;

    // SGOT / AST (Normal range: 8 - 48 U/L)
    // Aspartate aminotransferase (AST) is an enzyme found in the liver, heart, and muscles; elevated levels also indicate liver damage.
    if (values.sgot > 48 && values.sgot <= 100) score += 1;
    else if (values.sgot > 100 && values.sgot <= 200) score += 3;
    else if (values.sgot > 200) score += 5;

    // Albumin (Normal range: 3.5 - 5.0 g/dL)
    // Albumin is a protein made by the liver; low levels can indicate chronic liver disease as the liver's synthetic function is impaired.
    if (values.albumin < 3.5 && values.albumin >= 2.8) score += 3;
    else if (values.albumin < 2.8 && values.albumin > 0) score += 5;

    // 2. Advanced Biomarkers Assessment
    // These provide additional insights into specific liver conditions or their severity.

    // Alkaline Phosphatase (Normal range: 44 - 147 U/L)
    // Elevated alkaline phosphatase can suggest bile duct issues or certain liver diseases.
    if (values.alk_phosphate && values.alk_phosphate > 147 && values.alk_phosphate <= 300) score += 2;
    else if (values.alk_phosphate && values.alk_phosphate > 300) score += 4;

    // Prothrombin Time (Normal range: 11 - 13.5 seconds)
    // Prolonged prothrombin time indicates impaired synthesis of clotting factors by the liver, suggesting severe liver damage.
    if (values.protime && values.protime > 13.5 && values.protime <= 20) score += 2;
    else if (values.protime && values.protime > 20) score += 4;

    // 3. Clinical Symptoms & History Assessment
    // Presence of these symptoms or historical factors can significantly impact the risk.
    if (values.fatigue) score += 1; // Fatigue is a common but non-specific symptom of many conditions, including liver disease.
    if (values.spiders) score += 2; // Spider angioma (spiders) is a cutaneous manifestation often associated with chronic liver disease.
    if (values.ascites) score += 5; // Ascites (fluid accumulation in the abdomen) is a major sign of decompensated cirrhosis.
    if (values.varices) score += 5; // Varices (enlarged veins) indicate portal hypertension, a severe complication of liver disease.

    // Addictions/Medications that can affect liver health
    if (values.steroid) score += 2; // Steroid use can impact liver function.
    if (values.antivirals) score += 2; // Antiviral treatments may indicate a history of viral hepatitis.

    // 4. Histology Scoring (Categorical)
    // Liver biopsy results provide a direct assessment of liver damage and fibrosis stage.
    if (values.histology === 'F1') score += 1; // Mild fibrosis
    else if (values.histology === 'F2') score += 2; // Significant fibrosis
    else if (values.histology === 'F3') score += 4; // Severe fibrosis
    else if (values.histology === 'F4') score += 6; // Cirrhosis

    // 5. Calculate Probability
    // The total risk score is normalized to a percentage to provide a clearer indication of risk.
    const maxScore = 50; // The maximum theoretical risk score achievable.
    const probability = Math.min(Math.round((score / maxScore) * 100), 100); // Ensures probability does not exceed 100%.

    // 6. Determine Adjusted Risk Level
    // Categorizes the calculated risk score into predefined levels for easier interpretation.
    let level = "Low";
    if (score >= 5 && score <= 15) {
        level = "Moderate";
    } else if (score > 15 && score <= 25) {
        level = "High";
    } else if (score > 25) {
        level = "Critical";
    }

    return { score, level, probability };
}
