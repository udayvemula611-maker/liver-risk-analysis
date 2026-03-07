import * as React from "react"

// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Input Component
 *
 * A customizable input field component that supports various HTML input types.
 * It applies a consistent style with a border, shadow, and focus-visible states,
 * and handles disabled states. It also includes styling for file inputs.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the input.
 * @param {React.HTMLInputTypeAttribute} [props.type="text"] - The type of the input (e.g., "text", "email", "password").
 * @param {React.ComponentProps<"input">} [props...] - Additional props to be passed to the underlying `input` element.
 * @returns {JSX.Element} The rendered input element.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type} // Sets the HTML input type.
      data-slot="input" // Custom data attribute for styling or targeting.
      className={cn(
        // Base styling for the input field.
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus-visible styling for accessibility.
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Styling for invalid states (e.g., when validation fails).
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className // Additional classes provided by the user.
      )}
      {...props} // Spreads any additional HTML input attributes.
    />
  )
}

// Export the Input component for external use.
export { Input }
