'use strict';
/**
 * 密码哈希与校验（scrypt）
 *
 * 对应 README「安全说明」里"密码不以明文存储"这条声明 —— 声明必须被代码证明。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('./harness');

const { hashPassword, verifyPassword, HASH_PREFIX } = server;

describe('hashPassword', () => {
  test('输出格式为 scrypt$<salt>$<key>', () => {
    const h = hashPassword('xy888888');
    const parts = h.split('$');
    assert.equal(parts.length, 3);
    assert.equal(parts[0], 'scrypt');
    assert.match(parts[1], /^[0-9a-f]{32}$/, 'salt 应为 16 字节的 hex');
    assert.match(parts[2], /^[0-9a-f]{128}$/, 'key 应为 64 字节的 hex');
  });

  test('同一密码两次哈希结果不同（salt 随机）', () => {
    assert.notEqual(hashPassword('xy888888'), hashPassword('xy888888'));
  });

  test('明文不会出现在哈希里', () => {
    assert.equal(hashPassword('super-secret-pw').includes('super-secret-pw'), false);
  });
});

describe('verifyPassword', () => {
  test('正确密码通过校验', () => {
    assert.equal(verifyPassword('xy888888', hashPassword('xy888888')), true);
  });

  test('错误密码被拒绝', () => {
    const h = hashPassword('xy888888');
    assert.equal(verifyPassword('xy888889', h), false);
    assert.equal(verifyPassword('', h), false);
  });

  test('空密码 / 非字符串输入一律拒绝', () => {
    const h = hashPassword('xy888888');
    assert.equal(verifyPassword('', h), false);
    assert.equal(verifyPassword(null, h), false);
    assert.equal(verifyPassword(undefined, h), false);
  });

  test('兼容旧版本遗留的明文密码', () => {
    assert.equal(verifyPassword('xy888888', 'xy888888'), true);
    assert.equal(verifyPassword('wrong', 'xy888888'), false);
  });

  test('损坏或非法的哈希一律拒绝，不抛异常', () => {
    assert.equal(verifyPassword('x', 'scrypt$abc'), false);
    assert.equal(verifyPassword('x', 'scrypt$salt$not-hex'), false);
    assert.equal(verifyPassword('x', 'scrypt$aa$' + '00'.repeat(64)), false);
    assert.equal(verifyPassword('x', ''), false);
    assert.equal(verifyPassword('x', null), false);
    assert.equal(verifyPassword('x', 12345), false);
  });

  test('哈希前缀常量未被改动', () => {
    assert.equal(HASH_PREFIX, 'scrypt$');
  });
});
