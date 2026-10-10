import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the token-based font sizes so `text-sm` and `text-ink` don't cancel each other.
const merge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
