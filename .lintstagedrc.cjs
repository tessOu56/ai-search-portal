/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript and JavaScript files
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write",
  ],
  // JSON files
  "*.json": [
    "prettier --write",
  ],
  // CSS and other style files
  "*.{css,scss,md}": [
    "prettier --write",
  ],
};

