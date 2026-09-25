'use strict';
/**
 * 数据文件容错
 *
 * 第一原则是"不破坏用户已有 data/db.json"，所以读失败绝不能静默清空。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { server, readDBFile } = require('./harness');

const { readDB, writeDB, DB_FILE, DATA_DIR } = server;

function corruptFiles() {
  return fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('db.json.corrupt-'));
}

describe('readDB', () => {
  test('正常文件按原样读出', () => {
    const db = readDB();
    assert.ok(db.settings && Array.isArray(db.sections));
  });

  test('返回的是副本，改动不会污染下一次读取', () => {
    const a = readDB();
    a.settings.siteName = '临时改动';
    const b = readDB();
    assert.notEqual(b.settings.siteName, '临时改动');
  });

  test('文件损坏时备份现场并回退到默认内容', () => {
    fs.writeFileSync(DB_FILE, '{ 这不是合法 JSON', 'utf8');

    const db = readDB();
    assert.ok(db.settings && Array.isArray(db.sections), '应回退到默认内容');
    assert.equal(db.settings.siteName, 'XY俱乐部');

    const backups = corruptFiles();
    assert.ok(backups.length >= 1, '损坏文件必须先留一份 .corrupt-* 备份');
    assert.equal(fs.readFileSync(path.join(DATA_DIR, backups[0]), 'utf8'), '{ 这不是合法 JSON');
  });

  test('备份文件已被 gitignore', () => {
    const gi = fs.readFileSync(path.join(server.ROOT, '.gitignore'), 'utf8');
    assert.match(gi, /corrupt/);
  });
});

describe('writeDB', () => {
  test('原子写入：先写 .tmp 再 rename，不留下半截文件', () => {
    writeDB({ settings: { siteName: '原子写入' }, sections: [] });
    assert.equal(readDBFile().settings.siteName, '原子写入');
    assert.equal(
      fs.existsSync(DB_FILE + '.tmp'),
      false,
      '.tmp 应在 rename 后消失'
    );
  });
});
