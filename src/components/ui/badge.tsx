import * as React from "react"
// `cva` (Class Variance Authority) is used for creating highly composable and customizable Tailwind CSS class strings.
import { cva, type VariantProps } from "class-variance-authority"
// `Slot` from `radix-ui` is used for flexible component rendering, allowing a component to render as a different HTML tag or React component.
import { Slot } from "radix-ui"

// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Defines the style variants for the Badge component using `cva`.
 * This allows for different visual styles of the badge (e.g., default, secondary, destructive).
 * Each variant specifies a set of Tailwind CSS classes.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Default badge style: primary background with foreground text.
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        // Secondary badge style.
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        // Destructive badge style: typically red background for warning/error.
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // Outline badge style: transparent background with border and foreground text.
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Ghost badge style: minimal styling, often used for hover effects.
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Link badge style: resembles a text link.
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default", // Sets the default variant to 'default'.
    },
  }
)

/**
 * Badge Component
 *
 * A customizable badge component that can display text and optionally render
 * as a child component using the `asChild` prop. It supports different visual
 * variants defined by `badgeVariants`.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the badge.
 * @param {keyof typeof badgeVariants.variants.variant} [props.variant="default"] - The visual variant of the badge.
 * @param {boolean} [props.asChild=false] - If true, the badge will render its child component instead of a `span`, merging its props.
 * @param {any} [props...] - Additional props to be passed to the underlying HTML element or child component.
 * @returns {JSX.Element} The rendered badge component.
 */
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  // Determine the component to render: either a `Slot.Root` (if `asChild` is true) or a `span`.
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)} // Combine base badge styles with variant-specific and additional classes.
      {...props}
    />
  )
}

// Export the Badge component and its variants for external use.
export { Badge, badgeVariants }
