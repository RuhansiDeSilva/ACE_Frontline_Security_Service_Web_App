import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getApiErrorMessage(err: any, defaultMsg: string = "An error occurred") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err instanceof Error) return err.message;
  return defaultMsg;
}

export function hslVar(name: string) {
  return `hsl(var(${name}))`;
}