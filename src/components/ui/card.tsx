import * as React from "react"

// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Card Component
 *
 * A versatile container component that provides a visually distinct block for grouping related content.
 * It features a default background, border, shadow, and consistent spacing.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the card\'s container.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card container.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card" // Custom data attribute for styling or targeting.
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardHeader Component
 *
 * Used within a `Card` to define the header section. It provides a structured layout
 * for titles, descriptions, and optional actions, with consistent padding and bottom border.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the header\'s container.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card header.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header" // Custom data attribute for styling or targeting.
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardTitle Component
 *
 * Renders the main title of a card, typically placed within a `CardHeader`.
 * It applies default styling for font weight and line height.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the title.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card title.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title" // Custom data attribute for styling or targeting.
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * CardDescription Component
 *
 * Renders a descriptive text for a card, usually accompanying a `CardTitle` within a `CardHeader`.
 * It applies default styling for text color and font size.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the description.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card description.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description" // Custom data attribute for styling or targeting.
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * CardAction Component
 *
 * A container for action elements within a `CardHeader`. It\'s typically positioned
 * to the right of the title and description in a two-column grid.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the action\'s container.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card action container.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action" // Custom data attribute for styling or targeting.
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardContent Component
 *
 * Renders the main content area of a card. It provides consistent horizontal padding.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the content area.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card content.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content" // Custom data attribute for styling or targeting.
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * CardFooter Component
 *
 * Used within a `Card` to define the footer section. It centers items and provides
 * consistent horizontal padding, with an optional top border.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the footer\'s container.
 * @param {React.ComponentProps<"div">} [props...] - Additional props to be passed to the underlying `div` element.
 * @returns {JSX.Element} The rendered card footer.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer" // Custom data attribute for styling or targeting.
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

// Export all Card-related components for use throughout the application.
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
