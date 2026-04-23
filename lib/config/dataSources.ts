export const DATA_SOURCE_RULES = {
  faq: {
    source: "faq",
    cache: true,
  },
  product: {
    source: "db",
    cache: false,
  },
  shipping: {
    source: "db",
    cache: false,
  },
  order: {
    source: "api",
    cache: false,
  },
  general: {
    source: "ai",
    cache: true,
  },
} as const;
