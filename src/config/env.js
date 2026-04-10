import 'dotenv/config';

const _require = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const env = {
  port:          process.env.PORT || 5000,
  nodeEnv:       process.env.NODE_ENV || 'development',
  mongoUri:      _require('MONGO_URI'),
  jwtSecret:     _require('JWT_SECRET'),
  jwtExpiresIn:  process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin:  process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  isDev:         process.env.NODE_ENV !== 'production',
};