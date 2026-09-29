/**
 * 主题同步测试
 * 
 * 验证 xy-club 支持 8 套主题（与 xy-intro-card 同步）
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 读取 CSS 文件
const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 读取 admin.html
const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');

// 读取 admin.css
const adminCssPath = path.join(__dirname, '..', 'public', 'css', 'admin.css');
const adminCssContent = fs.readFileSync(adminCssPath, 'utf8');

describe('测试 15: 主题同步验证', function() {
  // 预期 8 套主题
  const expectedThemes = [
    'aurora', 'ocean', 'mist', 'sunset',
    'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy'
  ];

  it('应有 8 套主题定义', function() {
    let count = 0;
    expectedThemes.forEach(theme => {
      if (cssContent.includes(`data-theme="${theme}"`)) {
        count++;
      }
    });
    assert.strictEqual(count, 8, `应有 8 套主题，实际找到 ${count} 套`);
  });

  it('暗色主题应有深色背景', function() {
    const darkThemes = ['aurora', 'ocean', 'sunset'];
    darkThemes.forEach(theme => {
      const regex = new RegExp(`html\\[data-theme="${theme}"\\]\\s*{([^}]+)}`, 's');
      const match = cssContent.match(regex);
      assert.ok(match, `${theme} 主题定义应存在`);
      
      const vars = match[1];
      // 暗色主题背景应为深色
      assert.ok(
        vars.includes('--bg-a:') && (
          vars.includes('#0a') || 
          vars.includes('#04') || 
          vars.includes('#2a')
        ),
        `${theme} 应为暗色主题`
      );
    });
  });

  it('亮色主题应有浅色背景', function() {
    const lightThemes = ['mist', 'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy'];
    lightThemes.forEach(theme => {
      const regex = new RegExp(`html\\[data-theme="${theme}"\\]\\s*{([^}]+)}`, 's');
      const match = cssContent.match(regex);
      assert.ok(match, `${theme} 主题定义应存在`);
      
      const vars = match[1];
      // 亮色主题背景应为浅色
      assert.ok(
        vars.includes('--bg-a:') && (
          vars.includes('#f') || 
          vars.includes('#e') ||
          vars.includes('#ffffff')
        ),
        `${theme} 应为亮色主题`
      );
    });
  });

  it('所有主题应有完整的 CSS 变量', function() {
    const requiredVars = [
      '--bg-a', '--bg-b', '--ink', '--muted', '--faint',
      '--line', '--glass-1', '--glass-2', '--glass-3',
      '--spot', '--shadow', '--accent', '--accent-2',
      '--gold-1', '--gold-2', '--gold-3',
      '--b1', '--b2', '--b3', '--sheen'
    ];

    expectedThemes.forEach(theme => {
      const regex = new RegExp(`html\\[data-theme="${theme}"\\]\\s*{([^}]+)}`, 's');
      const match = cssContent.match(regex);
      assert.ok(match, `${theme} 主题定义应存在`);
      
      const vars = match[1];
      requiredVars.forEach(varName => {
        assert.ok(
          vars.includes(varName),
          `${theme} 应包含变量 ${varName}`
        );
      });
    });
  });

  it('主题选择器应显示所有 8 套主题', function() {
    expectedThemes.forEach(theme => {
      assert.ok(
        adminHtmlContent.includes(`data-theme="${theme}"`),
        `admin.html 应包含主题 ${theme}`
      );
    });
  });

  it('主题预览样式应定义所有 8 套主题', function() {
    expectedThemes.forEach(theme => {
      assert.ok(
        adminCssContent.includes(`.sw.${theme}`),
        `admin.css 应包含 .sw.${theme} 样式`
      );
    });
  });

  it('亮色主题光斑透明度应低于暗色主题', function() {
    // 暗色主题 sunset
    const sunsetMatch = cssContent.match(/html\[data-theme="sunset"\]\s*{([^}]+)}/s);
    assert.ok(sunsetMatch, 'sunset 主题定义应存在');
    const sunsetVars = sunsetMatch[1];
    const sunsetB1 = sunsetVars.match(/--b1:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    assert.ok(sunsetB1, 'sunset 主题应有 --b1 变量');
    
    // 亮色主题 neutral_morning
    const neutralMatch = cssContent.match(/html\[data-theme="neutral_morning"\]\s*{([^}]+)}/s);
    assert.ok(neutralMatch, 'neutral_morning 主题定义应存在');
    const neutralVars = neutralMatch[1];
    const neutralB1 = neutralVars.match(/--b1:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    assert.ok(neutralB1, 'neutral_morning 主题应有 --b1 变量');
    
    const sunsetAlpha = parseFloat(sunsetB1[4]);
    const neutralAlpha = parseFloat(neutralB1[4]);
    
    assert.ok(
      neutralAlpha < sunsetAlpha,
      `亮色主题光斑透明度(${neutralAlpha})应低于暗色主题(${sunsetAlpha})`
    );
  });

  it('亮色主题玻璃透明度应高于暗色主题', function() {
    // 暗色主题 sunset
    const sunsetMatch = cssContent.match(/html\[data-theme="sunset"\]\s*{([^}]+)}/s);
    const sunsetVars = sunsetMatch[1];
    const sunsetGlass = sunsetVars.match(/--glass-1:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    assert.ok(sunsetGlass, 'sunset 主题应有 --glass-1 变量');
    
    // 亮色主题 neutral_morning
    const neutralMatch = cssContent.match(/html\[data-theme="neutral_morning"\]\s*{([^}]+)}/s);
    const neutralVars = neutralMatch[1];
    const neutralGlass = neutralVars.match(/--glass-1:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    assert.ok(neutralGlass, 'neutral_morning 主题应有 --glass-1 变量');
    
    const sunsetOpacity = parseFloat(sunsetGlass[4]);
    const neutralOpacity = parseFloat(neutralGlass[4]);
    
    assert.ok(
      neutralOpacity > sunsetOpacity,
      `亮色主题玻璃透明度(${neutralOpacity})应高于暗色主题(${sunsetOpacity})`
    );
  });

  it('所有主题应有唯一的 accent 颜色', function() {
    const accents = [];
    expectedThemes.forEach(theme => {
      const regex = new RegExp(`html\\[data-theme="${theme}"\\]\\s*{([^}]+)}`, 's');
      const match = cssContent.match(regex);
      if (match) {
        const vars = match[1];
        const accentMatch = vars.match(/--accent:\s*([#a-f0-9]+)/i);
        if (accentMatch) {
          accents.push({ theme, color: accentMatch[1] });
        }
      }
    });
    
    // 检查是否有重复颜色
    const colors = accents.map(a => a.color.toLowerCase());
    const uniqueColors = new Set(colors);
    
    assert.strictEqual(
      uniqueColors.size, 
      colors.length, 
      `主题颜色应唯一，发现重复: ${colors}`
    );
  });
});

describe('测试 16: 主题 JS 白名单验证', function() {
  it('main.js 主题白名单应包含 8 套主题', function() {
    const mainJsPath = path.join(__dirname, '..', 'public', 'js', 'main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    const expectedThemes = [
      'aurora', 'ocean', 'mist', 'sunset',
      'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy'
    ];
    
    expectedThemes.forEach(theme => {
      assert.ok(
        mainJsContent.includes(`'${theme}'`),
        `main.js 应包含主题 ${theme}`
      );
    });
  });

  it('admin.js 主题渲染应支持所有 8 套主题', function() {
    const adminJsPath = path.join(__dirname, '..', 'public', 'js', 'admin.js');
    const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');
    
    // 检查 renderTheme 函数是否存在
    assert.ok(
      adminJsContent.includes('function renderTheme'),
      'admin.js 应包含 renderTheme 函数'
    );
    
    // 检查主题选择事件监听
    assert.ok(
      adminJsContent.includes('themePicker') && adminJsContent.includes('theme-opt'),
      'admin.js 应包含主题选择器事件监听'
    );
  });
});

console.log('\n主题同步测试完成');
