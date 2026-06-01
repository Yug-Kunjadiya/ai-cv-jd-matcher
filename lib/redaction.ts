export interface RedactionResult {
  redactedText: string;
  counts: {
    emiratesIds: number;
    passportNumbers: number;
    dobs: number;
    emails: number;
    phones: number;
  };
  originalSnippet: string;
  redactedSnippet: string;
}

/**
 * Mask actual sensitive values to protect PII in audit logs
 * e.g., "784-1995-1234567-8" becomes "784-****-*******-*"
 */
function maskValue(val: string, type: 'eid' | 'passport' | 'dob' | 'email' | 'phone'): string {
  if (type === 'eid') {
    // EID pattern: 784-YYYY-XXXXXXX-Z or similar
    return val.replace(/\d/g, (char, index) => {
      // Keep "784" visible to show country code detection, mask the rest
      return index < 3 ? char : '*';
    });
  }
  if (type === 'passport') {
    return val.substring(0, 2) + '*'.repeat(Math.max(4, val.length - 2));
  }
  if (type === 'dob') {
    return 'DD/MM/YYYY (Masked)';
  }
  if (type === 'email') {
    const parts = val.split('@');
    if (parts.length === 2) {
      return `${parts[0][0]}***@***.${parts[1].split('.').pop()}`;
    }
    return '***@***.com';
  }
  if (type === 'phone') {
    return val.substring(0, 4) + '*'.repeat(Math.max(4, val.length - 4));
  }
  return '***';
}

export function redactPII(text: string): RedactionResult {
  let redactedText = text;
  const counts = {
    emiratesIds: 0,
    passportNumbers: 0,
    dobs: 0,
    emails: 0,
    phones: 0,
  };

  // Safe snippets to illustrate redaction in the audit log
  let originalSnippet = '';
  let redactedSnippet = '';

  // 1. Emirates ID: format 784-YYYY-XXXXXXX-Z (with or without spaces/dashes)
  // Pattern: 784 followed by 4 digits, 7 digits, 1 digit
  const eidRegex = /\b784[- ]?\d{4}[- ]?\d{7}[- ]?\d{1}\b/g;
  let match;
  while ((match = eidRegex.exec(text)) !== null) {
    counts.emiratesIds++;
    const fullMatch = match[0];
    const masked = maskValue(fullMatch, 'eid');
    
    // Store the first match context as a snippet for audit
    if (!originalSnippet) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + fullMatch.length + 40);
      const originalContext = text.substring(start, end);
      originalSnippet = originalContext.replace(fullMatch, masked);
      redactedSnippet = originalContext.replace(fullMatch, '<REDACTED_EMIRATES_ID>');
    }
  }
  redactedText = redactedText.replace(eidRegex, '<REDACTED_EMIRATES_ID>');

  // 2. Passport: Keywords like Passport/Passport No/Passport# followed by alphanumerics
  const passportRegex = /(?:passport\s*(?:no|number|#)?)\s*[:\- ]\s*([a-zA-Z0-9]{7,12})/gi;
  while ((match = passportRegex.exec(text)) !== null) {
    counts.passportNumbers++;
    const fullMatch = match[0];
    const passportVal = match[1];
    const maskedVal = maskValue(passportVal, 'passport');
    const maskedFull = fullMatch.replace(passportVal, maskedVal);
    const redactedFull = fullMatch.replace(passportVal, '<REDACTED_PASSPORT>');

    if (!originalSnippet && counts.emiratesIds === 0) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + fullMatch.length + 40);
      const originalContext = text.substring(start, end);
      originalSnippet = originalContext.replace(fullMatch, maskedFull);
      redactedSnippet = originalContext.replace(fullMatch, redactedFull);
    }
  }
  redactedText = redactedText.replace(passportRegex, (m, p1) => m.replace(p1, '<REDACTED_PASSPORT>'));

  // 3. DOB: Keywords like DOB, Born on, Date of Birth followed by date format
  const dobRegex = /(?:dob|d\.o\.b|date\s*of\s*birth|born\s*on|birth\s*date)\s*[:\- ]\s*([0-9a-zA-Z\/\-,\s]{6,20})/gi;
  while ((match = dobRegex.exec(text)) !== null) {
    counts.dobs++;
    const fullMatch = match[0];
    const dobVal = match[1];
    // Simple filter to ensure we don't accidentally redact experience like "years" or "months"
    if (!/years|months|days|present|current/i.test(dobVal)) {
      const maskedVal = maskValue(dobVal, 'dob');
      const maskedFull = fullMatch.replace(dobVal, maskedVal);
      const redactedFull = fullMatch.replace(dobVal, '<REDACTED_DOB>');

      if (!originalSnippet && counts.emiratesIds === 0 && counts.passportNumbers === 0) {
        const start = Math.max(0, match.index - 40);
        const end = Math.min(text.length, match.index + fullMatch.length + 40);
        const originalContext = text.substring(start, end);
        originalSnippet = originalContext.replace(fullMatch, maskedFull);
        redactedSnippet = originalContext.replace(fullMatch, redactedFull);
      }
    }
  }
  redactedText = redactedText.replace(dobRegex, (m, p1) => {
    if (!/years|months|days|present|current/i.test(p1)) {
      return m.replace(p1, '<REDACTED_DOB>');
    }
    return m;
  });

  // 4. Email redaction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    counts.emails++;
    const fullMatch = match[0];
    const masked = maskValue(fullMatch, 'email');
    if (!originalSnippet && counts.emiratesIds === 0 && counts.passportNumbers === 0 && counts.dobs === 0) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + fullMatch.length + 40);
      const originalContext = text.substring(start, end);
      originalSnippet = originalContext.replace(fullMatch, masked);
      redactedSnippet = originalContext.replace(fullMatch, '<REDACTED_EMAIL>');
    }
  }
  redactedText = redactedText.replace(emailRegex, '<REDACTED_EMAIL>');

  // 5. Phone number redaction
  // UAE typical number styles: +971-5X-XXX-XXXX, 05X-XXX-XXXX, etc.
  const phoneRegex = /(?:\+971|00971|05\d|04|02|03|06|07|09)[- ]?\d{1,2}[- ]?\d{3,4}[- ]?\d{4}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    counts.phones++;
    const fullMatch = match[0];
    const masked = maskValue(fullMatch, 'phone');
    if (!originalSnippet && counts.emiratesIds === 0 && counts.passportNumbers === 0 && counts.dobs === 0 && counts.emails === 0) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + fullMatch.length + 40);
      const originalContext = text.substring(start, end);
      originalSnippet = originalContext.replace(fullMatch, masked);
      redactedSnippet = originalContext.replace(fullMatch, '<REDACTED_PHONE>');
    }
  }
  redactedText = redactedText.replace(phoneRegex, '<REDACTED_PHONE>');

  // Fallback snippets if nothing was redacted but we want a record
  if (!originalSnippet) {
    originalSnippet = text.substring(0, Math.min(text.length, 100)) + '...';
    redactedSnippet = originalSnippet;
  }

  return {
    redactedText,
    counts,
    originalSnippet: originalSnippet.trim(),
    redactedSnippet: redactedSnippet.trim()
  };
}
