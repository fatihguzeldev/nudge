// Mock dotenv to prevent loading .env file in tests
jest.mock('dotenv', () => ({
  config: jest.fn()
}));