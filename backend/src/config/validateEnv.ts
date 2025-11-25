import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  ALLOWED_ORIGINS?: string;
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

export const validateEnv = (): EnvConfig => {
  const missingVars: string[] = [];

  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please create a .env file based on .env.example`
    );
  }

  
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET should be at least 32 characters for better security!'
    );
  }

  if (
    jwtSecret === 'your_jwt_secret_key' ||
    jwtSecret === 'default_secret' ||
    jwtSecret.includes('example') ||
    jwtSecret.includes('change_this')
  ) {
    throw new Error(
      '🔒 SECURITY ERROR: Please change JWT_SECRET in .env file!\n' +
      '   The current JWT_SECRET is a default/example value and is not secure.\n' +
      '   Generate a secure random string: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn(
      `⚠️  WARNING: NODE_ENV is set to "${nodeEnv}". Valid values are: development, production, test`
    );
  }

  
  if (nodeEnv === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      console.warn(
        '⚠️  WARNING: ALLOWED_ORIGINS is not set in production. CORS will block all origins except localhost.'
      );
    }

    
    const mongoUri = process.env.MONGODB_URI!;
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      console.warn(
        '⚠️  WARNING: Using localhost MongoDB in production is not recommended.'
      );
    }
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: nodeEnv,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
};

export const getEnvConfig = (): EnvConfig => {
  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
};

