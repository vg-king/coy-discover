import "dotenv/config";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is required for service tests; refusing to use DATABASE_URL.",
  );
}
