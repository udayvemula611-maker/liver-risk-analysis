"use client"

import {
  CircleCheckIcon, // Icon for success toasts.
  InfoIcon,         // Icon for info toasts.
  Loader2Icon,      // Icon for loading toasts, with animation.
  OctagonXIcon,     // Icon for error toasts.
  TriangleAlertIcon, // Icon for warning toasts.
} from "lucide-react"
import { useTheme } from "next-themes" // Hook to access and manage the current theme (light/dark/system).
import { Toaster as Sonner, type ToasterProps } from "sonner" // The Sonner toast library\'s main component and its props type.

/**
 * Toaster Component
 *
 * This component provides a styled and themed toast notification system using `sonner`.
 * It integrates with `next-themes` to automatically apply the current theme to toasts.
 * Custom icons from `lucide-react` are provided for different toast types (success, info, warning, error, loading).
 *
 * @param {ToasterProps} props - The properties for the Sonner Toaster component.
 * @param {any} [props...] - Additional props to be passed directly to the `Sonner` component.
 * @returns {JSX.Element} The configured Sonner Toaster component.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  // Get the current theme from `next-themes`, defaulting to "system".
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]} // Apply the current theme to the toaster.
      className="toaster group" // Base and group class for styling.
      icons={{
        // Custom icons for different toast types for enhanced visual feedback.
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Custom CSS properties to integrate Sonner\'s styling with application\'s design tokens.
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props} // Spreads any additional props passed to the Toaster component.
    />
  )
}

// Export the Toaster component for external use throughout the application.
export { Toaster }
