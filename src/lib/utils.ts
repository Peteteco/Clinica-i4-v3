import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número de telefone para o padrão brasileiro (XX) XXXXX-XXXX
 * Aceita vários formatos de entrada:
 * - 5511977748661@s.whatsapp.net
 * - 5511977748661
 * - 11977748661
 * - (11) 97774-8661
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // Remover tudo que não é número
  const cleanPhone = phone.replace(/\D/g, "");

  // Se começar com 55 (código do Brasil), remover
  const phoneWithoutCountry = cleanPhone.startsWith("55") 
    ? cleanPhone.substring(2) 
    : cleanPhone;

  // Extrair DDD e número
  if (phoneWithoutCountry.length >= 10) {
    const ddd = phoneWithoutCountry.substring(0, 2);
    const firstPart = phoneWithoutCountry.substring(2, phoneWithoutCountry.length - 4);
    const lastPart = phoneWithoutCountry.substring(phoneWithoutCountry.length - 4);
    
    return `(${ddd}) ${firstPart}-${lastPart}`;
  }

  // Se não conseguir formatar, retornar original
  return phone;
}