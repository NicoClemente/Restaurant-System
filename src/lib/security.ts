const TAG_REGEX = /<[^>]*>/g;

export const sanitizeText = (value: string) =>
  value.replace(TAG_REGEX, "").replace(/\s+/g, " ").trim();

export const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, "");
  return digits.length ? digits : null;
};
