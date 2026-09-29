export function safeRedirect(value: string | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/app";
  return value;
}
