import { DISPOSABLE_DOMAINS } from "./validation/disposable-email-list";
import { COLORADO_CITIES, COLORADO_ZIP_CODES } from "./validation/colorado-data";
import { STREET_SUFFIXES } from "./validation/address-suffixes";
import dns from 'dns/promises';

// --- Email Validation ---

export async function validateEmailDomain(email: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const domain = email.split('@')[1];
    if (!domain) {
      return { valid: false, error: "Invalid email format" };
    }

    const domainLower = domain.toLowerCase();

    // Check against extended disposable list
    if (DISPOSABLE_DOMAINS.includes(domainLower)) {
      return { valid: false, error: "Invalid email address." };
    }

    // Check MX records
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('DNS resolution timeout')), 5000);
      });

      const mxRecords = await Promise.race([
        dns.resolveMx(domain),
        timeoutPromise
      ]);

      if (!mxRecords || mxRecords.length === 0) {
        return { valid: false, error: "Invalid email address." };
      }

      return { valid: true };
    } catch (dnsError) {
      console.warn(`DNS MX resolution failed for domain ${domain}:`, dnsError);
      // In strict mode, we might reject. Here we allow if DNS fails but it's not on blacklist.
      // But user requested "Check Existence", so failing DNS usually means invalid.
      return { valid: false, error: "Invalid email address." };
    }

  } catch (error) {
    console.error("Email domain validation error:", error);
    return { valid: false, error: "Invalid email address." };
  }
}

// --- Address Validation ---

export function validateAddressFormat(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length < 5) {
    return { valid: false, error: "Invalid address." };
  }

  const cleanAddress = address.trim();
  
  // 1. Must have number
  if (!/\d/.test(cleanAddress)) {
    return { valid: false, error: "Invalid address." };
  }

  // 2. Must have suffix (St, Ave, etc)
  const addressParts = cleanAddress.replace(/,/g, '').split(/\s+/);
  const lastPart = addressParts[addressParts.length - 1].replace(/\./g, ''); // Remove trailing dot
  const secondLastPart = addressParts.length > 1 ? addressParts[addressParts.length - 2].replace(/\./g, '') : '';
  
  // Check if any part matches a suffix (case insensitive)
  const hasSuffix = addressParts.some(part => {
    const cleanPart = part.replace(/\./g, '');
    return STREET_SUFFIXES.some(suffix => suffix.toLowerCase() === cleanPart.toLowerCase());
  });

  if (!hasSuffix) {
     return { valid: false, error: "Invalid address." };
  }

  return { valid: true };
}

// --- City Validation ---

export function validateColoradoCity(city: string): { valid: boolean; error?: string } {
    if (!city) return { valid: false, error: "Invalid city." };
    
    const cleanCity = city.trim().toLowerCase();
    
    // Check if city exists in our whitelist (case insensitive)
    const isValid = COLORADO_CITIES.some(c => c.toLowerCase() === cleanCity);
    
    if (!isValid) {
        return { valid: false, error: "Invalid city." };
    }
    
    return { valid: true };
}

// --- Zip Code Validation ---

export function validateColoradoZipStatic(zip: string): { valid: boolean; error?: string } {
    const cleanZip = zip.replace(/\D/g, '');
    
    if (cleanZip.length !== 5) {
        return { valid: false, error: "Invalid ZIP code." };
    }

    if (!COLORADO_ZIP_CODES.includes(cleanZip)) {
        return { valid: false, error: "Invalid ZIP code." };
    }

    return { valid: true };
}
