export const accessTokenConstants = {
  name: 'jwt',
  cookieOptions: {
    httpOnly: true,
    path: '/',
  },
  // 1 day
  expirationTime: 86400,
};

export const refreshTokenConstants = {
  name: 'jwt_refresh',
  cookieOptions: {
    httpOnly: true,
    path: '/',
  },
  // 365 days
  expirationTime: 31556952,
};
