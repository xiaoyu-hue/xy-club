/**
 * lint 策略（v1.11.0 起）
 *
 * 旧配置把 no-console / no-alert / indent / max-len / no-unused-vars 全设成 warn，
 * 而 CI 只跑 `eslint .`（不设 --max-warnings），于是 159 条警告长期被无视，
 * lint 实际上只剩「没写分号」一个信号。现在分成两类：
 *   - 正确性规则 = error（真的会拦住 bug）
 *   - 风格规则 = off（项目没有格式化器，风格规则只会制造噪音）
 * 并让 CI 跑 `eslint . --max-warnings 0`：从此任何一条警告都会让流水线变红。
 */
module.exports = {
  root: true,
  ignorePatterns: ['tests/', 'node_modules/', 'public/content.json'],
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
    // ---- 正确性：error ----
    'no-eval': 'error',
    'no-with': 'error',
    'no-undef': 'error',
    'no-unused-vars': 'error',
    'no-dupe-keys': 'error',
    'no-unreachable': 'error',
    'no-fallthrough': 'error',
    'no-redeclare': 'error',
    'semi': ['error', 'always'],

    // ---- 风格：off（交给人读，不交给流水线）----
    // console 就是本项目的审计日志（server.js 的 audit 直接写 stdout），不该被警告
    'no-console': 'off',
    // confirm 用于「删除/覆盖」这类不可逆操作，是刻意选择
    'no-alert': 'off',
    'no-var': 'off',
    'indent': 'off',
    'max-len': 'off',
    'quotes': 'off',
    'strict': 'off',
    'func-style': 'off',
    'no-inner-declarations': 'off'
  }
};
