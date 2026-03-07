// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Skeleton Component
 *
 * A visual placeholder component used to indicate loading states. It renders a `div`
 * with a pulsating animation and a rounded-md shape, typically filling the space
 * of content that is yet to be loaded.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the skeleton.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered skeleton placeholder.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton" // Custom data attribute for styling or targeting.
      className={cn("bg-accent animate-pulse rounded-md", className)} // Base styling with pulse animation.
      {...props} // Spreads any additional HTML attributes.
    />
  )
}

// Export the Skeleton component for external use.
export { Skeleton }
