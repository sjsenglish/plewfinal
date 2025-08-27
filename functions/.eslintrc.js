module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    // Temporarily disable problematic rules
    "max-len": "off",
    "require-jsdoc": "off",
  },
};