// Utility for combining and merging Tailwind CSS classes.
import { cn } from '@/lib/utils';

/**
 * RiskBadge Component
 *
 * This component displays a colored badge indicating a specific risk level (e.g., "High", "Moderate", "Low").
 * The badge's color and text content are dynamically set based on the `level` prop.
 * It uses the `cn` utility function for conditional and merged Tailwind CSS class application.
 *
 * @param {object} props - The properties for the component.
 * @param {string} props.level - The risk level to display (e.g., "High", "Moderate", "Low", "Unknown").
 */
export default function RiskBadge({ level }: { level: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors shadow-sm border",
                // Apply specific background, text, and border colors based on the risk level.
                level === "High" && "bg-red-50 text-red-700 border-red-200",
                level === "Moderate" && "bg-amber-50 text-amber-700 border-amber-200",
                level === "Low" && "bg-green-50 text-green-700 border-green-200",
                // Default styling for unrecognized or 'Unknown' risk levels.
                !['High', 'Moderate', 'Low'].includes(level) && "bg-gray-100 text-gray-800 border-gray-200"
            )}
        >
            {/* Inner circle indicator, colored according to the risk level. */}
            <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                level === "High" && "bg-red-500",
                level === "Moderate" && "bg-amber-500",
                level === "Low" && "bg-green-500",
                // Default color for the indicator if the level is unknown.
                !['High', 'Moderate', 'Low'].includes(level) && "bg-gray-500"
            )} />
            {/* Displays the risk level text in uppercase. */}
            {level === "High" ? "HIGH" : level === "Moderate" ? "MODERATE" : level === "Low" ? "LOW" : level}
        </span>
    );
}
