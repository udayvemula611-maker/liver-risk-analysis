"use client"

import * as React from "react"
// `LabelPrimitive` from `radix-ui` provides an accessible label primitive for form controls.
import { Label as LabelPrimitive } from "radix-ui"

// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Label Component
 *
 * A customizable label component that wraps the `LabelPrimitive.Root` from `radix-ui`.
 * It provides consistent styling for labels associated with form controls, including
 * handling of disabled states for both the label's parent group and peer elements.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the label.
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} [props...] - Additional props to be passed to the underlying `LabelPrimitive.Root` element.
 * @returns {JSX.Element} The rendered label element.
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label" // Custom data attribute for styling or targeting.
      className={cn(
        // Base styling for the label, including font, text size, and user-select behavior.
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        // Styling for disabled states, affecting pointer events and opacity.
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className // Additional classes provided by the user.
      )}
      {...props} // Spreads any additional HTML attributes.
    />
  )
}

// Export the Label component for external use.
export { Label }
