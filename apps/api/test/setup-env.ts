process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/pulse_player_test';
process.env.BETTER_AUTH_SECRET = 'test-secret-test-secret-test-secret-0123456789';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.WEB_ORIGIN = 'http://localhost:5173';
