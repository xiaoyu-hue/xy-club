module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script'
  },
  rules: {
    // 允许使用 console
    'no-console': 'off',
    // 允许使用 alert
    'no-alert': 'off',
    // 禁止使用 eval
    'no-eval': 'error',
    // 允许 IIFE 中的严格模式
    'strict': 'off',
    // 禁止使用 with
    'no-with': 'error',
    // 要求使用分号
    'semi': ['error', 'always'],
    // 缩进 2 空格（放宽到 4 空格以兼容现有代码）
    'indent': ['warn', 2],
    // 允许最大行长 120
    'max-len': ['warn', { code: 120 }],
    // 允许使用 var
    'no-var': 'warn',
    // 允许函数表达式
    'func-style': 'off',
    // 允许嵌套函数
    'no-inner-declarations': 'off'
  }
}
