import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021
      },
      ecmaVersion: 2021,
      sourceType: 'script'
    },
    rules: {
      // 允许使用 console
      'no-console': 'off',
      // 允许使用 alert
      'no-alert': 'off',
      // 允许使用 eval（项目中未使用）
      'no-eval': 'error',
      // 要求使用严格模式
      'strict': ['error', 'global'],
      // 禁止使用 with
      'no-with': 'error',
      // 要求使用 Promise
      'no-new-promises': 'error',
      // 允许不规范的变量命名（保持现有代码风格）
      'camelcase': 'off',
      // 允许行末分号缺失（项目中已统一加分号）
      'semi': ['error', 'always'],
      // 允许单引号或双引号
      'quotes': ['error', 'single'],
      // 允许缩进 2 空格
      'indent': ['error', 2],
      // 允许最大行长 100
      'max-len': ['warn', { code: 100 }],
      // 允许使用 var（保持向后兼容）
      'no-var': 'off',
      // 允许使用 for 循环
      'no-for-loop': 'off',
      // 允许函数声明
      'func-style': ['error', 'declaration'],
      // 允许嵌套函数
      'no-inner-declarations': 'off'
    }
  }
]
