import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function dataUriToFile(dataUri: string, fileName: string, mimeType: string): Promise<File> {
  const response = await fetch(dataUri);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}
