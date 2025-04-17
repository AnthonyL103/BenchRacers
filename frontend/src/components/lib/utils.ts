import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

//for applying your own tailwind styles to the ui elements that you want to reuse differently without causing conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
