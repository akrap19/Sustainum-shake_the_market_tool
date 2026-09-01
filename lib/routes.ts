/**
 * Centralized route + endpoint paths. Never hardcode these strings elsewhere.
 */
export const routes = {
  home: "/",
  api: {
    companies: "/api/companies",
  },
} as const;

export type RoutePath = string;
