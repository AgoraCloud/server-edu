export const accessTokenConstants = {
  name: 'jwt',
  cookieOptions: {
    httpOnly: true,
    path: '/',
  },
};

export const refreshTokenConstants = {
  name: 'jwt_refresh',
  cookieOptions: {
    httpOnly: true,
    path: '/',
  },
};
