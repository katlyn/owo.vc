module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/no-misused-promises': 'off',
    'no-undefined': 'error',
    'no-void': 'off'
  }
}
