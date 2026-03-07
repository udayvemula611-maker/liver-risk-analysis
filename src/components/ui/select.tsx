"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
// Import individual components from Radix UI Select.
import {
  Root,
  Group,
  Value,
  Trigger,
  Content,
  Item,
  Label as SelectPrimitiveLabel, // Renamed to avoid conflict with local Label component.
  Separator,
  ScrollUpButton,
  ScrollDownButton,
  ItemIndicator,
  ItemText,
  Portal,
  Viewport, // Directly import Viewport
  Icon // Directly import Icon
} from "@radix-ui/react-select"

// `cn` is a utility function that conditionally joins CSS class names together and merges Tailwind CSS classes.
import { cn } from "@/lib/utils"

/**
 * Select Component
 *
 * The root component for a custom select dropdown. It manages the open/closed state
 * and value of the select. This component is a wrapper around `Root` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {React.ComponentProps<typeof Root>} [props...] - Additional props to be passed to the underlying `Root` element.
 * @returns {JSX.Element} The rendered select root.
 */
function Select({
  ...props
}: React.ComponentProps<typeof Root>) {
  return <Root data-slot="select" {...props} />
}

/**
 * SelectGroup Component
 *
 * Used within `SelectContent` to group related select items. This component is a wrapper
 * around `Group` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the group.
 * @param {React.ComponentProps<typeof Group>} [props...] - Additional props to be passed to the underlying `Group` element.
 * @returns {JSX.Element} The rendered select group.
 */
function SelectGroup({
  ...props
}: React.ComponentProps<typeof Group>) {
  return <Group data-slot="select-group" {...props} />
}

/**
 * SelectValue Component
 *
 * Displays the currently selected value of the select dropdown. This component is a wrapper
 * around `Value` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the displayed value.
 * @param {React.ComponentProps<typeof Value>} [props...] - Additional props to be passed to the underlying `Value` element.
 * @returns {JSX.Element} The rendered select value.
 */
function SelectValue({
  ...props
}: React.ComponentProps<typeof Value>) {
  return <Value data-slot="select-value" {...props} />
}

/**
 * SelectTrigger Component
 *
 * The interactive element that opens the select dropdown. It includes a chevron icon
 * and supports different sizes. This component is a wrapper around `Trigger` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the trigger.
 * @param {"sm" | "default"} [props.size="default"] - The size of the select trigger.
 * @param {React.ReactNode} props.children - The content to be rendered inside the trigger (typically a `SelectValue`).
 * @param {React.ComponentProps<typeof Trigger>} [props...] - Additional props to be passed to the underlying `Trigger` element.
 * @returns {JSX.Element} The rendered select trigger.
 */
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <Trigger
      data-slot="select-trigger" // Custom data attribute for styling or targeting.
      data-size={size} // Custom data attribute for size-based styling.
      className={cn(
        // Base styling for the select trigger, including border, background, text, and focus states.
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*=\'text-\\'\])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        // Conditional height based on size prop.
        "data-[size=default]:h-9 data-[size=sm]:h-8",
        // Styling for the SelectValue and embedded SVG icons.
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\\'\])]:size-4",
        className // Additional classes provided by the user.
      )}
      {...props} // Spreads any additional HTML attributes.
    >
      {children}
      <Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" /> {/* Down arrow icon for the trigger. */}
      </Icon>
    </Trigger>
  )
}

/**
 * SelectContent Component
 *
 * Contains the scrollable list of select items. It handles animations, positioning,
 * and includes scroll buttons. This component is a wrapper around `Content` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the content wrapper.
 * @param {React.ReactNode} props.children - The select items or groups to be rendered within the content.
 * @param {"popper" | "item-aligned"} [props.position="item-aligned"] - The positioning strategy for the content.
 * @param {"start" | "center" | "end"} [props.align="center"] - The alignment of the content relative to the trigger.
 * @param {React.ComponentProps<typeof Content>} [props...] - Additional props to be passed to the underlying `Content` element.
 * @returns {JSX.Element} The rendered select content.
 */
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof Content>) {
  return (
    <Portal> {/* Portal renders the content outside the DOM hierarchy for correct positioning. */}
      <Content
        data-slot="select-content" // Custom data attribute.
        className={cn(
          // Base styling for the content dropdown, including background, border, shadow, and animations.
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          // Conditional positioning styles when `position` is \'popper\'.
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className // Additional classes.
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton /> {/* Scroll up button. */}
        <Viewport // Directly import Viewport
          className={cn(
            "p-1",
            // Conditional styling for the viewport when `position` is \'popper\'.
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children} {/* Renders the select items. */}
        </Viewport>
        <SelectScrollDownButton /> {/* Scroll down button. */}
      </Content>
    </Portal>
  )
}

/**
 * SelectLabel Component
 *
 * A non-interactive label within a select content, used to provide a heading for a group of items.
 * This component is a wrapper around `SelectPrimitiveLabel` (Radix UI\\'s Label).
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the label.
 * @param {React.ComponentProps<typeof SelectPrimitiveLabel>} [props...] - Additional props to be passed to the underlying `SelectPrimitiveLabel` element.
 * @returns {JSX.Element} The rendered select label.
 */
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitiveLabel>) {
  return (
    <SelectPrimitiveLabel
      data-slot="select-label" // Custom data attribute.
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

/**
 * SelectItem Component
 *
 * Represents an individual selectable option within a select dropdown.
 * It includes an optional checkmark indicator for selected items and handles disabled states.
 * This component is a wrapper around `Item` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the item.
 * @param {React.ReactNode} props.children - The content to be rendered inside the select item.
 * @param {React.ComponentProps<typeof Item>} [props...] - Additional props to be passed to the underlying `Item` element.
 * @returns {JSX.Element} The rendered select item.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Item>) {
  return (
    <Item
      data-slot="select-item" // Custom data attribute.
      className={cn(
        // Base styling for the select item, including focus, text color, and layout.
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*=\'text-\\'\])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Styling for embedded SVG icons and nested span elements.
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\\'\])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className // Additional classes.
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator" // Custom data attribute for the indicator.
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <ItemIndicator>
          <CheckIcon className="size-4" /> {/* Checkmark icon for selected items. */}
        </ItemIndicator>
      </span>
      <ItemText>{children}</ItemText> {/* The actual text content of the item. */}
    </Item>
  )
}

/**
 * SelectSeparator Component
 *
 * A visual separator used to divide select items into logical groups.
 * This component is a wrapper around `Separator` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the separator.
 * @param {React.ComponentProps<typeof Separator>} [props...] - Additional props to be passed to the underlying `Separator` element.
 * @returns {JSX.Element} The rendered select separator.
 */
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="select-separator" // Custom data attribute.
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

/**
 * SelectScrollUpButton Component
 *
 * A button displayed at the top of the select content to scroll up the item list.
 * This component is a wrapper around `ScrollUpButton` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the scroll button.
 * @param {React.ComponentProps<typeof ScrollUpButton>} [props...] - Additional props to be passed to the underlying `ScrollUpButton` element.
 * @returns {JSX.Element} The rendered scroll up button.
 */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof ScrollUpButton>) {
  return (
    <ScrollUpButton
      data-slot="select-scroll-up-button" // Custom data attribute.
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" /> {/* Up arrow icon for scrolling. */}
    </ScrollUpButton>
  )
}

/**
 * SelectScrollDownButton Component
 *
 * A button displayed at the bottom of the select content to scroll down the item list.
 * This component is a wrapper around `ScrollDownButton` from Radix UI.
 *
 * @param {object} props - The properties for the component.
 * @param {string} [props.className] - Optional additional CSS classes to apply to the scroll button.
 * @param {React.ComponentProps<typeof ScrollDownButton>} [props...] - Additional props to be passed to the underlying `ScrollDownButton` element.
 * @returns {JSX.Element} The rendered scroll down button.
 */
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof ScrollDownButton>) {
  return (
    <ScrollDownButton
      data-slot="select-scroll-down-button" // Custom data attribute.
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" /> {/* Down arrow icon for scrolling. */}
    </ScrollDownButton>
  )
}

// Export all Select-related components for use throughout the application.
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectPrimitiveLabel as SelectLabel, // Export Radix UI Label as SelectLabel to avoid name collision.
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
