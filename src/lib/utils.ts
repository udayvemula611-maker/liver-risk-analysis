// Utility for constructing className strings conditionally.
import { clsx, type ClassValue } from "clsx"
// Utility for merging Tailwind CSS classes without style conflicts.
import { twMerge } from "tailwind-merge"

/**
 * Conditionally combines and merges Tailwind CSS classes.
 *
 * This function takes an array of `ClassValue` inputs, which can be strings,
 * objects, or arrays, and processes them to generate a final, optimized
 * className string. It uses `clsx` for conditional class joining and
 * `tailwind-merge` to resolve potential conflicts and optimize the output
 * for Tailwind CSS.
 *
 * @param {...ClassValue[]} inputs - A variadic array of class values to process.
 * @returns {string} The merged and optimized Tailwind CSS class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
