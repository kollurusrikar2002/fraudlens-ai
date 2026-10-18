export interface Field {
  label: string;
  value: string;
}

export function extractFields(body: string): Field[] {
  const found: Field[] = [];
  const take = (label: string, pattern: RegExp) => {
    for (const match of body.matchAll(pattern)) {
      const value = match[0].replace(/\s+/g, " ").trim();
      if (!found.some((field) => field.value === value)) found.push({ label, value });
    }
  };
  take("Amount", /Rs\s?[\d,]+(?:\.\d+)?(?:\s?cr)?/g);
  take("Amount", /GBP\s?[\d,]+/g);
  take("Share", /\d+\s?percent/gi);
  take("Quantity", /\d+\s+reams/gi);
  take("Date", /\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}/g);
  return found.slice(0, 8);
}
