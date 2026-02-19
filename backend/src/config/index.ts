import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

interface Config {
  env: string;
  port: number;
  host: string;
  databaseUrl: string;
  jwt: {
    secret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  platform: {
    name: string;
    domain: string;
    invitationOnlyMode: boolean;
  };
  oauth?: {
    github?: {
      clientId: string;
      clientSecret: string;
    };
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };
  docker?: {
    host: string;
    port: number;
  };
  traefik?: {
    apiUrl: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  platform: {
    name: process.env.PLATFORM_NAME || 'DevSanctum',
    domain: process.env.PLATFORM_DOMAIN || 'localhost:3000',
    invitationOnlyMode: process.env.INVITATION_ONLY_MODE === 'true',
  },
};

// Optional configurations
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  config.oauth = {
    ...config.oauth,
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  config.oauth = {
    ...config.oauth,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  };
}

if (process.env.SMTP_HOST) {
  config.smtp = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@devsanctum.local',
  };
}

if (process.env.DOCKER_HOST) {
  config.docker = {
    host: process.env.DOCKER_HOST,
    port: parseInt(process.env.DOCKER_PORT || '2376', 10),
  };
}

if (process.env.TRAEFIK_API_URL) {
  config.traefik = {
    apiUrl: process.env.TRAEFIK_API_URL,
  };
}
