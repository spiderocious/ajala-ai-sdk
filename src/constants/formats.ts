export const FORMAT_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
} as const;

export const FORMAT_VALIDATORS = {
  email: (value: string): boolean => FORMAT_PATTERNS.EMAIL.test(value),
  url: (value: string): boolean => FORMAT_PATTERNS.URL.test(value),
  uuid: (value: string): boolean => FORMAT_PATTERNS.UUID.test(value),
  ipv4: (value: string): boolean => FORMAT_PATTERNS.IPV4.test(value),
  ipv6: (value: string): boolean => FORMAT_PATTERNS.IPV6.test(value),
  date: (value: string): boolean => {
    if (!FORMAT_PATTERNS.DATE.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  datetime: (value: string): boolean => {
    if (!FORMAT_PATTERNS.DATETIME.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  string: (): boolean => true, // Always valid for string format
} as const;

export const FORMAT_ERROR_MESSAGES = {
  email: 'Must be a valid email address',
  url: 'Must be a valid URL',
  uuid: 'Must be a valid UUID',
  ipv4: 'Must be a valid IPv4 address',
  ipv6: 'Must be a valid IPv6 address',
  date: 'Must be a valid date in YYYY-MM-DD format',
  datetime: 'Must be a valid datetime in ISO 8601 format',
  string: 'Must be a string',
} as const;

export type FormatType = keyof typeof FORMAT_VALIDATORS;