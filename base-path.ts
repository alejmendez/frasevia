/**
 * `/frasevia` o `/`. */
export function basePath(): string {
  const raw = process.env.BASE_PATH?.trim();
  if (!raw || raw === "/") {
    return "/";
  }

  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}
