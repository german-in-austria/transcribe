module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-trailing-spaces': 'warn',
    'key-spacing': 'warn',
    'padded-blocks': 'warn',
    'space-before-function-paren': 'off',
    'no-multi-spaces': 'warn',
    'object-curly-spacing': 'warn',
    'computed-property-spacing': 'warn',
    'lines-between-class-members': 'warn',
    '@typescript-eslint/member-delimiter-style': 'warn',
    'no-useless-escape': 'warn',
    'array-bracket-spacing': 'warn',
    'indent': 'warn',
    'semi': 'warn',
    'space-in-parens': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    'template-curly-spacing': 'warn',
    'no-floating-decimal': 'off',
    'comma-dangle': 'warn',
    'no-async-promise-executor': 'warn',
    'no-mixed-operators': 'off',
    'no-irregular-whitespace': 'warn',
    'no-multiple-empty-lines': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'space-unary-ops': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/no-this-alias': 'off',
    'quotes': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    'no-new': 'off',
    'quote-props': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/camelcase': 'off',
    'computed-property-spacing': 'off',
    'array-bracket-spacing': 'off',
    'operator-linebreak': 'off'
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        mocha: true
      }
    }
  ]
}
