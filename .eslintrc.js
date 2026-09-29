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
    // 允许使用 console（开发调试需要）
    'no-console': 'warn',
    // 允许使用 alert/confirm（移动端友好）
    'no-alert': 'warn',
    // 禁止使用 eval（安全考虑）
    'no-eval': 'error',
    // 禁止使用 with
    'no-with': 'error',
    // 要求使用分号
    'semi': ['error', 'always'],
    // 允许使用 var（向后兼容）
    'no-var': 'warn',
    // 允许函数表达式（IIFE 风格）
    'func-style': 'off',
    // 允许嵌套函数
    'no-inner-declarations': 'off',
    // 允许未使用的变量（开发中常见）
    'no-unused-vars': 'warn',
    // 缩进 2 空格
    'indent': ['warn', 2],
    // 允许最大行长 120
    'max-len': ['warn', { code: 120 }],
    // 允许单引号或双引号
    'quotes': ['warn', 'single'],
    // 允许不使用严格模式（IIFE 内部已有）
    'strict': 'off'
  }
}

