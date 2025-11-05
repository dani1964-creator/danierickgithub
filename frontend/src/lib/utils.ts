import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
    const m = (err as { message?: unknown }).message;
    return typeof m === 'string' ? m : JSON.stringify(err);
  }
  try {
    return typeof err === 'string' ? err : JSON.stringify(err);
  } catch {
    return 'Ocorreu um erro desconhecido';
  }
}

// Gera slug robusto a partir de um texto
export function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
