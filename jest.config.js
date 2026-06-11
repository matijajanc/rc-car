module.exports = {
  preset: '@react-native/jest-preset',
  // The backend (node_server) has its own ts-jest runner and CI job.
  testPathIgnorePatterns: ['/node_modules/', '/node_server/'],
};
