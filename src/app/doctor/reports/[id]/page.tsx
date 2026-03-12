import { redirect } from 'next/navigation'; // For redirecting users.
import { checkRole } from '@/lib/auth'; // Utility to check user roles.
import Sidebar from '@/components/Sidebar'; // Sidebar navigation component.
import RiskBadge from '@/components/RiskBadge'; // Component to display risk level badges.
import PDFExportButton from '@/components/PDFExportButton'; // Button component for exporting reports as PDF.
import ReactMarkdown from 'react-markdown'; // Component for rendering Markdown content.
import PrescriptionManager from '@/components/PrescriptionManager'; // Component for managing prescriptions.
import { createClient } from '@/lib/supabaseServer'; // Supabase client for server-side operations with RLS.
import { notFound } from 'next/navigation'; // Utility to render a 404 page.
import * as motion from 'framer-motion/client'; // Animation library.
import {
    Activity, // Icon for general activity.
    Beaker, // Icon for lab tests.
    Droplets, // Icon for fluid/blood tests.
    HeartPulse, // Icon for vital signs/health.
    Timer, // Icon for time-related metrics.
    ActivitySquare, // Another activity-related icon.
    AlertTriangle, // Icon for warnings/moderate risk.
    ShieldCheck, // Icon for clear/low risk.
    Dna, // Icon for biological/histology data.
    Pill, // Icon for medication/steroids.
    Syringe, // Icon for antivirals.
    Thermometer, // Icon for clinical indicators.
    Sparkles,
    FileText
} from 'lucide-react';

/**
 * ReportDetail Component
 *
 * This page displays the detailed view of a specific liver report. It fetches the report data,
 * associated hospital branding template, prescription details, and doctor information.
 * It also renders various lab metrics, clinical indicators, an AI-generated medical summary,
 * and a prescription management interface (for doctors). Access is restricted based on user roles.
 *
 * @param {object} props - The properties for the component.
 * @param {{ id: string }} props.params - The route parameters, containing the report's ID.
 * @returns {Promise<JSX.Element>} The rendered detailed report page.
 */
export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // Extract report ID from route parameters.

    // Authenticate user. Doctors, Patients, and Admins can view reports.
    // RLS policies in Supabase will restrict access to only relevant reports.
    const user = await checkRole(['doctor', 'patient', 'admin']);
    if (!user) {
        redirect('/login');
    }

    const supabase = await createClient(); // Initialize Supabase client, respecting RLS policies.

    // Fetch the specific liver report using its ID.
    const { data: report, error } = await supabase
        .from('liver_reports')
        .select('*')
        .eq('id', id)
        .single();

    // If report not found or an error occurs, render a 404 page.
    if (error || !report) {
        notFound();
    }

    // Fetch the active Hospital Branding template.
    // RLS policy for templates typically allows anyone to SELECT, but ensures consistency.
    const { data: template } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .single();

    // Fetch Prescription Data associated with this report.
    const { data: prescription } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('report_id', id)
        .single();

    // Fetch Doctor Information associated with the report.
    const { data: doctor } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', report.doctor_id)
        .single();

    // Format the report creation date for display.
    const date = new Date(report.created_at).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar role={user.role as any} /> {/* Renders the appropriate sidebar based on user role. */}
            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Animated container for the main report content. */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border p-8">
                        {/* Report Header: Patient name, demographics, date, PDF export, and overall risk score. */}
                        <div className="flex justify-between items-start mb-8 pb-8 border-b">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2 leading-tight">
                                    {report.patient_name}'s Analysis
                                </h1>
                                <p className="text-muted-foreground font-medium mb-4">
                                    {report.age} years old &bull; {report.gender} &bull; Generated {date}
                                </p>
                                {/* PDF Export Button */}
                                <PDFExportButton
                                    report={report}
                                    template={template}
                                    prescription={prescription || null}
                                    doctorName={doctor?.full_name || 'Hepatology Specialist'}
                                />
                            </div>
                            {/* Overall Risk Score Display */}
                            <div className="text-right">
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Overall Risk Score</p>
                                <div className="flex items-center gap-4 justify-end">
                                    <span className="text-5xl font-extrabold text-primary">{report.risk_score}</span>
                                    <RiskBadge level={report.risk_level} /> {/* Displays a visual risk badge. */}
                                </div>
                            </div>
                        </div>

                        {/* Lab Test Values Grid */}
                        <div className="mb-10">
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Laboratory Metrics
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Metric Card: Total Bilirubin */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Bilirubin</span>
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors"><Beaker className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.total_bilirubin}</span>
                                        <span className="text-sm font-semibold text-muted-foreground">mg/dL</span>
                                    </div>
                                </div>
                                {/* Metric Card: Albumin */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Albumin</span>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><Droplets className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.albumin}</span>
                                        <span className="text-sm font-semibold text-muted-foreground">g/dL</span>
                                    </div>
                                </div>
                                {/* Metric Card: SGPT (ALT) */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">SGPT (ALT)</span>
                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors"><HeartPulse className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.sgpt}</span>
                                        <span className="text-sm font-semibold text-muted-foreground">U/L</span>
                                    </div>
                                </div>
                                {/* Metric Card: SGOT (AST) */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">SGOT (AST)</span>
                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors"><ActivitySquare className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.sgot}</span>
                                        <span className="text-sm font-semibold text-muted-foreground">U/L</span>
                                    </div>
                                </div>
                                {/* Metric Card: Alk Phosphate */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Alk Phosphate</span>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors"><Sparkles className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.alk_phosphate || '-'}
                                        </span>
                                        {report.alk_phosphate && <span className="text-sm font-semibold text-muted-foreground">U/L</span>}
                                    </div>
                                </div>
                                {/* Metric Card: Prothrombin Time */}
                                <div className="bg-white border hover:border-blue-200 hover:ring-2 hover:ring-blue-100 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Prothrombin Time</span>
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors"><Timer className="w-4 h-4" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{report.protime || '-'}
                                        </span>
                                        {report.protime && <span className="text-sm font-semibold text-muted-foreground">s</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Indicators and AI Synthesis Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Column: Clinical Indicators */}
                            <div className="lg:col-span-5">
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-primary" />
                                    Clinical Indicators
                                </h3>
                                
                                <div className="bg-white rounded-2xl p-6 border shadow-sm">
                                    <div className="flex flex-col gap-4">
                                        {/* Histology Rating Badge */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-xl mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><Dna className="w-4 h-4" /></div>
                                                <span className="font-bold text-gray-700">Histology Rating</span>
                                            </div>
                                            <span className="px-3 py-1 bg-indigo-600 text-white font-extrabold rounded-md shadow-sm">
                                                {report.histology || 'None'}
                                            </span>
                                        </div>

                                        {/* Individual Clinical Indicators */}
                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Ascites Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.ascites ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.ascites ? 'text-red-800' : 'text-gray-600'}`}>Ascites</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.ascites ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.ascites ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.ascites ? 'DETECTED' : 'CLEAR'}
                                                </div>
                                            </div>

                                            {/* Varices Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.varices ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.varices ? 'text-red-800' : 'text-gray-600'}`}>Varices</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.varices ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.varices ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.varices ? 'DETECTED' : 'CLEAR'}
                                                </div>
                                            </div>

                                            {/* Fatigue Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.fatigue ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.fatigue ? 'text-amber-800' : 'text-gray-600'}`}>Fatigue</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.fatigue ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.fatigue ? <ActivitySquare className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.fatigue ? 'PRESENT' : 'CLEAR'}
                                                </div>
                                            </div>

                                            {/* Spider Naevi Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.spiders ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.spiders ? 'text-amber-800' : 'text-gray-600'}`}>Spider Naevi</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.spiders ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.spiders ? <Sparkles className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.spiders ? 'PRESENT' : 'CLEAR'}
                                                </div>
                                            </div>

                                            {/* Steroid Use Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.steroid ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.steroid ? 'text-blue-800' : 'text-gray-600'}`}>Steroid Use</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.steroid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.steroid ? <Pill className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.steroid ? 'ACTIVE' : 'NONE'}
                                                </div>
                                            </div>

                                            {/* Antivirals Use Indicator */}
                                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${report.antivirals ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <span className={`font-bold ${report.antivirals ? 'text-teal-800' : 'text-gray-600'}`}>Antivirals</span>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${report.antivirals ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {report.antivirals ? <Syringe className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                    {report.antivirals ? 'ACTIVE' : 'NONE'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: AI Medical Synthesis */}
                            <div className="lg:col-span-7 flex flex-col">
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                    AI Medical Synthesis
                                </h3>
                                <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 flex-1 shadow-inner relative overflow-hidden group">
                                    {/* Background icon for visual effect. */}
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                                        <FileText className="w-32 h-32 text-indigo-900" />
                                    </div>
                                    <div className="relative z-10">
                                        {report.ai_summary ? (
                                            <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed font-medium">
                                                <ReactMarkdown>{report.ai_summary}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                                <AlertTriangle className="w-12 h-12 text-indigo-200 mb-4" />
                                                <p className="text-indigo-900/60 font-semibold text-lg">No AI summary generated for this report.</p>
                                                <p className="text-indigo-900/40 text-sm mt-1">This report might have been logged manually or without AI assistance.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prescription Manager Section (only visible to doctors/admins) */}
                        <div className="mt-12 border-t-2 border-dashed border-gray-200 pt-10 no-print">
                            <PrescriptionManager
                                reportId={report.id}
                                role={user.role as string}
                                doctorName={doctor?.full_name || 'Hepatology Specialist'}
                                initialPrescription={prescription || null}
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
