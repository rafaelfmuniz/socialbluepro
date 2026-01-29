import { COLORADO_CITIES, COLORADO_ZIP_CODES } from "./validation/colorado-data";
import { STREET_SUFFIXES } from "./validation/address-suffixes";
import { DISPOSABLE_DOMAINS } from "./validation/disposable-email-list";

// --- Address Validation (Client Safe) ---

export function validateAddressFormatClient(address: string): { valid: boolean; error?: string } {
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

// --- City Validation (Client Safe) ---

export function validateColoradoCityClient(city: string): { valid: boolean; error?: string } {
    if (!city) return { valid: false, error: "Invalid city." };
    
    const cleanCity = city.trim().toLowerCase();
    
    // Check if city exists in our whitelist (case insensitive)
    const isValid = COLORADO_CITIES.some(c => c.toLowerCase() === cleanCity);
    
    if (!isValid) {
        return { valid: false, error: "Invalid city." };
    }
    
    return { valid: true };
}

// --- Zip Code Validation (Client Safe) ---

export function validateColoradoZipClient(zip: string): { valid: boolean; error?: string } {
    const cleanZip = zip.replace(/\D/g, '');
    
    if (cleanZip.length !== 5) {
        return { valid: false, error: "Invalid ZIP code." };
    }

    if (!COLORADO_ZIP_CODES.includes(cleanZip)) {
        return { valid: false, error: "Invalid ZIP code." };
    }

    return { valid: true };
}

// --- Email Syntax & Disposable Check (Client Safe) ---
export function validateEmailClient(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: "Invalid email address." };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return { valid: false, error: "Invalid email address." };

    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, error: "Invalid email address." };
    }

    return { valid: true };
}
