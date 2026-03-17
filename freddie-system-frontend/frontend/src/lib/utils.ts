import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600';
  if (rating === 3) return 'text-yellow-600';
  return 'text-red-600';
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'responded':
      return 'bg-green-100 text-green-800';
    case 'escalated':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
