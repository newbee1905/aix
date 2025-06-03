import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function genTags(): string[] {
	return Array.from({ length: 3 }, () =>
		Math.random().toString(36).slice(2, 8)
	);
}

export function rateToxicity(): number {
	return parseFloat(Math.random().toFixed(2));
}

export const fetcher = (url: string) => fetch(url).then(res => res.json());
