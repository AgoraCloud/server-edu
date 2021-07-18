import { CookieOptions } from 'express';

/**
 * Represents the type of authentication token the server sets in
 * the browser using cookies
 */
enum AuthTokenType {
  Access = 'ACCESS',
  Refresh = 'REFRESH',
}

/**
 * Represents all the cookie configuration settings
 */
interface CookieConfig {
  name: string;
  cookieOptions: CookieOptions;
  expirationTime: number;
}

/**
 * Contains the cookie configuration for all authentication token types
 */
const COOKIE_CONFIG: Record<AuthTokenType, CookieConfig> = {
  ACCESS: {
    name: 'jwt',
    cookieOptions: {
      httpOnly: true,
      path: '/',
    },
    // 1 day
    expirationTime: 86400,
  },
  REFRESH: {
    name: 'jwt_refresh',
    cookieOptions: {
      httpOnly: true,
      path: '/',
    },
    // 365 days
    expirationTime: 31556952,
  },
};

export { AuthTokenType, CookieConfig, COOKIE_CONFIG };
