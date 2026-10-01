/**
 * 主题案例展示测试
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 读取主题展示页面
const demoPath = path.join(__dirname, '..', 'public', 'themes-demo.html');
const demoContent = fs.readFileSync(demoPath, 'utf8');

// 8 套主题
const themes = [
  'aurora', 'ocean', 'mist', 'sunset',
  'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy'
];

describe('测试 17: 主题案例展示页面', function() {
  it('主题展示页面应存在', function() {
    assert.ok(fs.existsSync(demoPath), 'themes-demo.html 应存在');
  });

  it('应包含所有 8 套主题', function() {
    themes.forEach(theme => {
      assert.ok(
        demoContent.includes(theme),
        `主题 ${theme} 应在展示页面中`
      );
    });
  });

  it('每个主题应有唯一标识', function() {
    themes.forEach(theme => {
      assert.ok(
        demoContent.includes(`data-theme="${theme}"`),
        `主题 ${theme} 应有 data-theme 属性`
      );
    });
  });

  it('主题名称应使用中文显示', function() {
    const chineseNames = ['极光紫', '深海蓝', '晨雾白', '落日金', 
                          '米白·晨雾', '浅灰·云影', '燕麦·暖调', '藏蓝·经典'];
    chineseNames.forEach(name => {
      assert.ok(
        demoContent.includes(name),
        `中文名称 ${name} 应在页面中`
      );
    });
  });

  it('应包含主题分类标签', function() {
    assert.ok(demoContent.includes('暗色'), '应有暗色主题标签');
    assert.ok(demoContent.includes('亮色'), '应有亮色主题标签');
  });

  it('应包含版本信息（与 package.json 保持一致）', function() {
    // 原为硬编码 'v1.6.0'，每次升版本都会假失败。
    // 改为跟随 package.json：既保证页面确实标了版本，也强制两者不漂移。
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    assert.ok(
      demoContent.includes('v' + pkg.version),
      `页面应包含当前版本号 v${pkg.version}`
    );
  });
});

console.log('\n主题案例展示测试完成');
