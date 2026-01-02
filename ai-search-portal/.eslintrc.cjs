/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["eslint-config-remix"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
};

