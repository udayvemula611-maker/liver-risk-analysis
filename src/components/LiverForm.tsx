
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Activity, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/types/user';
import { calculateRisk } from '@/lib/riskEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as motion from 'framer-motion/client';

// Zod schema for validating the liver form inputs. Each field is defined with its type, validation rules, and error messages.
const formSchema = z.object({
    patient_id: z.string().min(1, "Please select a registered patient"),
    age: z.coerce.number().min(1, "Age must be at least 1").max(120, "Age cannot exceed 120"),
    gender: z.string().min(1, "Gender is required"),
    total_bilirubin: z.coerce.number().min(0, "Total Bilirubin cannot be negative").step(0.1, "Total Bilirubin must be a multiple of 0.1"),
    sgpt: z.coerce.number().min(0, "SGPT cannot be negative"),
    sgot: z.coerce.number().min(0, "SGOT cannot be negative"),
    albumin: z.coerce.number().min(0, "Albumin cannot be negative").step(0.1, "Albumin must be a multiple of 0.1"),
    alk_phosphate: z.coerce.number().min(0, "Alkaline Phosphate cannot be negative").optional(),
    protime: z.coerce.number().min(0, "Prothrombin Time cannot be negative").optional(),
    fatigue: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    spiders: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    ascites: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    varices: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    steroid: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    antivirals: z.preprocess((val) => val === 'true' || val === true, z.boolean()), // Converts string 'true'/'false' or boolean to boolean.
    histology: z.string().default('None'), // Defaults to 'None' if not provided.
});

// Type definition for the form data, inferred from the Zod schema.
type FormData = z.infer<typeof formSchema>;

/**
 * LiverForm Component
 *
 * This component provides a comprehensive form for doctors to input patient's liver function data,
 * calculate a real-time risk assessment, and generate an AI-synthesized report. It integrates
 * with `react-hook-form` for efficient form management and `zod` for robust schema validation.
 * Patient data can be pre-filled if a registered patient is selected.
 *
 * @param {object} props - The properties for the component.
 * @param {UserProfile[]} [props.patients=[]] - An optional array of patient user profiles to populate the patient selection dropdown.
 */
export default function LiverForm({ patients = [] }: { patients?: UserProfile[] }) {
    const router = useRouter(); // Next.js router for navigation actions.
    const [loading, setLoading] = useState(false); // Manages loading state during form submission.
    const [error, setError] = useState(''); // Stores and displays any error messages from API calls.

    // Initializes react-hook-form with Zod resolver for schema validation.
    const {
        register, // Function to register inputs with React Hook Form, connecting them to the form state.
        handleSubmit, // Function to handle form submission, includes validation and calls onSubmit or onError.
        watch, // Function to subscribe to and watch input values for real-time updates without re-renders.
        setValue, // Function to programmatically set input values.
        formState: { errors } // Object containing form validation errors, accessible for display.
    } = useForm<FormData>({
        resolver: zodResolver(formSchema) as any, // Integrates Zod schema for validation rules.
        defaultValues: { // Sets initial default values for form fields.
            patient_id: '',
            age: 0,
            gender: '',
            fatigue: false,
            spiders: false,
            ascites: false,
            varices: false,
            steroid: false,
            antivirals: false,
            histology: 'None',
        }
    });

    // Watches the selected patient ID to trigger auto-filling of age and gender.
    const selectedPatientId = watch('patient_id');

    // Effect hook to auto-fill Age and Gender when a patient is selected from the dropdown.
    // This enhances user experience by populating known patient demographic data.
    useEffect(() => {
        const selectedPatient = patients.find(p => p.id === selectedPatientId);
        if (selectedPatient) {
            // Update form fields with patient's age and gender if available.
            if (selectedPatient.age) setValue('age', selectedPatient.age);
            if (selectedPatient.gender) setValue('gender', selectedPatient.gender);
        }
    }, [selectedPatientId, patients, setValue]); // Dependencies for the effect: re-run when patient selection or patient list changes.

    // Watches all form values to enable real-time risk calculation feedback.
    const currentFormValues = watch();

    // Calculates live risk based on current form values. Values are safely coerced to numbers
    // to handle potential undefined or non-numeric inputs gracefully for the risk engine.
    const liveRisk = calculateRisk({
        patient_name: '', // Patient name is not directly used in the risk calculation logic.
        ...currentFormValues,
        total_bilirubin: Number(currentFormValues.total_bilirubin) || 0,
        sgpt: Number(currentFormValues.sgpt) || 0,
        sgot: Number(currentFormValues.sgot) || 0,
        albumin: Number(currentFormValues.albumin) || 0,
        alk_phosphate: Number(currentFormValues.alk_phosphate) || 0,
        protime: Number(currentFormValues.protime) || 0,
        age: Number(currentFormValues.age) || 0,
        gender: currentFormValues.gender || 'Unknown',
    } as any); // Type assertion is used here as ReportInput might be slightly different from currentFormValues

    /**
     * Handles the form submission after successful validation.
     * This function sends the patient data to the backend for AI analysis and report generation,
     * then navigates the user to the generated report page upon success.
     * @param {FormData} data - The validated form data containing all patient and lab values.
     */
    const onSubmit = async (data: FormData) => {
        setLoading(true); // Set loading state to true to disable form and show feedback.
        setError('');     // Clear any previous error messages.

        // Find the selected patient to include their full name in the payload for the backend.
        const selectedPatient = patients.find(p => p.id === data.patient_id);
        const payload = {
            ...data,
            patient_name: selectedPatient ? selectedPatient.full_name : 'Unknown Patient'
        };

        console.log("LiverForm: Submitting Data", payload); // Log the payload for debugging purposes.

        try {
            // Make an asynchronous API call to the '/api/analyze' endpoint to generate the report.
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), // Send the prepared payload as a JSON string.
            });

            const result = await res.json(); // Parse the JSON response from the API.
            console.log("LiverForm: API Response", result); // Log the API response for review.

            if (!res.ok) {
                // If the HTTP response status is not OK, throw an error with a message from the API or a default.
                throw new Error(result.error || 'Failed to submit report');
            }

            toast.success('Analysis completed successfully!'); // Display a success notification to the user.
            router.push(`/doctor/reports/${result.reportId}`); // Redirect the user to the newly generated report page.
        } catch (err: any) {
            // Catch and handle any errors that occur during the API call or response processing.
            setError(err.message); // Update the error state with the error message.
            toast.error(err.message); // Display an error notification to the user.
        } finally {
            setLoading(false); // Ensure loading state is reset to false, regardless of success or failure.
        }
    };

    /**
     * Handles form validation errors. This function is called if `handleSubmit` encounters validation issues.
     * @param {any} errors - The errors object from react-hook-form, containing details about validation failures.
     */
    const onError = (errors: any) => {
        console.error("LiverForm Validation Errors:", errors); // Log validation errors for developer debugging.
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} // Initial animation state (start slightly transparent and below position).
            animate={{ opacity: 1, y: 0 }} // Animate to full opacity and original position.
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            {/* Left Panel: Contains the main form for clinical inputs. It spans two columns on large screens. */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-md">
                    <CardHeader className="bg-primary/5 border-b pb-6">
                        <CardTitle className="text-2xl font-extrabold text-primary">Clinical Variables</CardTitle>
                        <CardDescription>Enter patient lab values to calculate risk and generate an AI-assisted report.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form id="liver-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">

                            {/* Patient Selection Section */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-foreground">Registered Patient Profile</label>
                                <select
                                    {...register('patient_id')}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white text-foreground"
                                >
                                    <option value="">-- Select Patient --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name || 'Anonymous'}</option>
                                    ))}
                                </select>
                                {errors.patient_id && <p className="text-destructive text-xs font-medium">{errors.patient_id.message}</p>}
                            </div>

                            {/* Age and Gender Inputs Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-foreground">Age</label>
                                    <input
                                        type="number"
                                        {...register('age')}
                                        readOnly={!!selectedPatientId} // Age is read-only if a patient is selected.
                                        className={`w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors ${selectedPatientId ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'}`}
                                        placeholder="7"
                                    />
                                    {errors.age && <p className="text-destructive text-xs font-medium">{errors.age.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-foreground">Gender</label>
                                    <div className={`flex space-x-4 pt-2 p-1 rounded ${selectedPatientId ? 'bg-gray-50' : ''}`}>
                                        <label className={`flex items-center space-x-2 ${selectedPatientId ? 'cursor-not-allowed' : ''}`}>
                                            <input type="radio" value="Male" {...register('gender')} className={`text-primary focus:ring-primary h-4 w-4 ${selectedPatientId ? 'pointer-events-none opacity-50' : ''}`} />
                                            <span className={`text-sm ${selectedPatientId ? 'text-muted-foreground' : ''}`}>Male</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 ${selectedPatientId ? 'cursor-not-allowed' : ''}`}>
                                            <input type="radio" value="Female" {...register('gender')} className={`text-primary focus:ring-primary h-4 w-4 ${selectedPatientId ? 'pointer-events-none opacity-50' : ''}`} />
                                            <span className={`text-sm ${selectedPatientId ? 'text-muted-foreground' : ''}`}>Female</span>
                                        </label>
                                    </div>
                                    {errors.gender && <p className="text-destructive text-xs font-medium">{errors.gender.message}</p>}
                                </div>
                            </div>

                            {/* Steroid and Antivirals Inputs Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-foreground">Have you Addicted to Steroids?</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="false" {...register('steroid')} defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">No</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="true" {...register('steroid')} className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                    </div>
                                    {errors.steroid && <p className="text-destructive text-xs font-medium">{errors.steroid.message as string}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-foreground">Have you Addicted to Antivirals?</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="false" {...register('antivirals')} defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">No</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="true" {...register('antivirals')} className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                    </div>
                                    {errors.antivirals && <p className="text-destructive text-xs font-medium">{errors.antivirals.message as string}</p>}
                                </div>
                            </div>

                            {/* Fatigue and Spiders Inputs Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-foreground">Are You Fatigued?</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="false" {...register('fatigue')} defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">No</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="true" {...register('fatigue')} className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                    </div>
                                    {errors.fatigue && <p className="text-destructive text-xs font-medium">{errors.fatigue.message as string}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-foreground">Presence of Spider Naevi</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="false" {...register('spiders')} defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">No</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" value="true" {...register('spiders')} className="text-primary focus:ring-primary h-4 w-4" />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                    </div>
                                    {errors.spiders && <p className="text-destructive text-xs font-medium">{errors.spiders.message as string}</p>}
                                </div>
                            </div>

                            {/* Varices and Ascites Inputs Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-foreground">Presence of Varices</label>
                                    <select
                                        {...register('varices')}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white"
                                    >
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                    {errors.varices && <p className="text-destructive text-xs font-medium">{errors.varices.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-foreground">Presence of Ascites</label>
                                    <select
                                        {...register('ascites')}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white"
                                    >
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                    {errors.ascites && <p className="text-destructive text-xs font-medium">{errors.ascites.message as string}</p>}
                                </div>
                            </div>

                            {/* Liver Function Test (LFT) Results Section */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-lg font-bold text-primary mb-4">Liver Function Test (LFT) Results</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Total Bilirubin Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">Total Bilirubin</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register('total_bilirubin')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-16 bg-white"
                                                placeholder="1.0"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">mg/dL</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 0.1 - 1.2</span>
                                            {errors.total_bilirubin && <span className="text-destructive text-right">{errors.total_bilirubin.message}</span>}
                                        </p>
                                    </div>

                                    {/* Albumin Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">Albumin</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register('albumin')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-16 bg-white"
                                                placeholder="4.0"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">g/dL</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 3.4 - 5.4</span>
                                            {errors.albumin && <span className="text-destructive text-right">{errors.albumin.message}</span>}
                                        </p>
                                    </div>

                                    {/* SGPT / ALT Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">SGPT / ALT</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('sgpt')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-12 bg-white"
                                                placeholder="30"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">U/L</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 7 - 56</span>
                                            {errors.sgpt && <span className="text-destructive text-right">{errors.sgpt.message}</span>}
                                        </p>
                                    </div>

                                    {/* SGOT / AST Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">SGOT / AST</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('sgot')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-12 bg-white"
                                                placeholder="25"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">U/L</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 8 - 48</span>
                                            {errors.sgot && <span className="text-destructive text-right">{errors.sgot.message}</span>}
                                        </p>
                                    </div>

                                    {/* Alk Phostate Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">Alk Phostate</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('alk_phosphate')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-12 bg-white"
                                                placeholder="100"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">U/L</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 44 - 147</span>
                                        </p>
                                    </div>

                                    {/* Protime Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">Protime</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('protime')}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors pr-12 bg-white"
                                                placeholder="12"
                                            />
                                            <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-medium">sec</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium flex justify-between">
                                            <span>Reference: 11 - 13.5</span>
                                        </p>
                                    </div>

                                    {/* Histology Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-foreground">Histology</label>
                                        <select
                                            {...register('histology')}
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white"
                                        >
                                            <option value="None">No</option>
                                            <option value="F0">F0 - Normal</option>
                                            <option value="F1">F1 - Mild Fibrosis</option>
                                            <option value="F2">F2 - Moderate Fibrosis</option>
                                            <option value="F3">F3 - Severe Fibrosis</option>
                                            <option value="F4">F4 - Cirrhosis</option>
                                        </select>
                                    </div>

                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Live Risk & Action */}
            <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                    {/* Risk Preview Card */}
                    <Card className={`border-2 transition-colors duration-500 shadow-md ${liveRisk.level === 'High' ? 'border-destructive/50 bg-destructive/5' :
                            liveRisk.level === 'Moderate' ? 'border-amber-500/50 bg-amber-500/5' :
                                liveRisk.level === 'Low' ? 'border-green-500/50 bg-green-500/5' :
                                    'border-border'
                        }`}>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Risk Preview</span>
                                {/* Displays appropriate icon based on risk level. */}
                                {liveRisk.level === 'High' && <AlertCircle className="w-5 h-5 text-destructive animate-pulse" />}
                                {liveRisk.level === 'Moderate' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                {liveRisk.level === 'Low' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                {liveRisk.level === 'Unknown' && <Activity className="w-5 h-5 text-muted-foreground" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Risk Level Display */}
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <motion.div
                                    key={liveRisk.level} // Key for animating changes in risk level.
                                    initial={{ scale: 0.8, opacity: 0 }} // Initial animation state.
                                    animate={{ scale: 1, opacity: 1 }} // Animation to stable state.
                                    className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 shadow-inner ${liveRisk.level === 'High' ? 'bg-destructive text-destructive-foreground' :
                                            liveRisk.level === 'Moderate' ? 'bg-amber-500 text-white' :
                                                liveRisk.level === 'Low' ? 'bg-green-600 text-white' :
                                                    'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    <span className="text-3xl font-black tracking-tighter uppercase">{liveRisk.level}</span>
                                </motion.div>
                                <p className="text-sm text-foreground font-medium px-4">
                                    {liveRisk.level === 'Unknown' ? 'Enter values to see risk estimation.' :
                                        liveRisk.level === 'High' ? 'Critical condition detected. Immediate attention recommended.' :
                                            liveRisk.level === 'Moderate' ? 'Elevated values observed. Monitor closely.' :
                                                'Values appear within nominal ranges.'}
                                </p>
                            </div>

                            {/* Generate Report Button */}
                            <div className="pt-6 border-t border-border border-dashed">
                                <button
                                    type="submit"
                                    form="liver-form"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                            Analyzing via AI...
                                        </>
                                    ) : (
                                        'Generate AI Synthesized Report'
                                    )}
                                </button>
                                {error && <p className="text-destructive text-xs mt-3 text-center">{error}</p>}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
