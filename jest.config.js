/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["./tests/setup.js"],
  globalTeardown: "./tests/globalTeardown.js",
};
