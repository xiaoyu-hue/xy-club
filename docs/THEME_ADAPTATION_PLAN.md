# xy-club 主题适配方案

**核心原则**: 适配 xy-club 架构，而非照搬 xy-intro-card

**制定日期**: 2026-09-29

---

## 📊 架构差异分析

### xy-intro-card 主题系统

```css
/* 使用 :root 变量 */
:root {
  --bg: #0d0d12;
  --text: #ece9e3;
  --accent: #ff9d5c;
  --glass-1: rgba(255,255,255,0.13);
}

/* 主题配置在 JS 中 */
const THEMES_CONFIG = {
  sunset: { a: '#ff9d5c', b: '#ffd0a8', mode: 'dark' },
  neutral_morning: { 
    a: '#5a6b7c', 
    b: '#8a9dad',
    mode: 'light',
    palette: { bg: '#f7f4f0', text: '#1e2935', ... }
  }
};
```

### xy-club 主题系统

```css
/* 使用 data-theme 属性选择器 */
html[data-theme="aurora"] {
  --bg-a: #0a0a1f;
  --bg-b: #030309;
  --ink: #eef0ff;
  --accent: #8b7cf6;
  --gold-1: #fff3c4;  /* xy-club 特有 */
  --b1: rgba(124, 108, 240, 0.42);  /* 光斑 */
}
```

---

## 🎯 适配策略

### 策略 1: 保持 xy-club 变量命名（推荐）

**理由**:
- ✅ 最小改动，向后兼容
- ✅ 保持 xy-club 的设计哲学
- ✅ 只需新增 4 套主题配置

**实现**:
```css
/* 新增 4 套亮色商务主题 */
html[data-theme="neutral_morning"] {
  --bg-a: #f7f4f0;
  --bg-b: #e8e4dc;
  --ink: #1e2935;
  --muted: rgba(30, 41, 53, 0.55);
  --accent: #5a6b7c;
  --accent-2: #8a9dad;
  --gold-1: #b7791f;
  --gold-2: #a16207;
  --gold-3: #7c4a08;
  --glass-1: rgba(255,255,255,0.75);
  --glass-2: rgba(255,255,255,0.50);
  --glass-3: rgba(255,255,255,0.5);
  --b1: rgba(147, 197, 253, 0.2);
  --b2: rgba(196, 181, 253, 0.15);
  --b3: rgba(253, 186, 201, 0.12);
  --spot: rgba(255, 255, 255, 0.6);
  --shadow: rgba(30, 41, 80, 0.10);
  --sheen: rgba(255, 255, 255, 0.35);
}

html[data-theme="neutral_cloud"] {
  --bg-a: #f1f5f9;
  --bg-b: #e2e8f0;
  --ink: #0f172a;
  --muted: rgba(15, 23, 42, 0.52);
  --accent: #4a5568;
  --accent-2: #718096;
  --gold-1: #b7791f;
  --gold-2: #a16207;
  --gold-3: #7c4a08;
  --glass-1: rgba(255,255,255,0.80);
  --glass-2: rgba(255,255,255,0.55);
  --glass-3: rgba(255,255,255,0.6);
  --b1: rgba(147, 197, 253, 0.18);
  --b2: rgba(196, 181, 253, 0.14);
  --b3: rgba(253, 186, 201, 0.10);
  --spot: rgba(255, 255, 255, 0.55);
  --shadow: rgba(15, 23, 42, 0.11);
  --sheen: rgba(255, 255, 255, 0.32);
}

html[data-theme="neutral_oat"] {
  --bg-a: #faf8f5;
  --bg-b: #ede8e0;
  --ink: #2c2418;
  --muted: rgba(44, 36, 24, 0.52);
  --accent: #6b5b4e;
  --accent-2: #9c8b7a;
  --gold-1: #b7791f;
  --gold-2: #a16207;
  --gold-3: #7c4a08;
  --glass-1: rgba(255,255,255,0.78);
  --glass-2: rgba(255,255,255,0.52);
  --glass-3: rgba(255,255,255,0.55);
  --b1: rgba(200, 170, 130, 0.2);
  --b2: rgba(180, 150, 120, 0.15);
  --b3: rgba(160, 130, 100, 0.12);
  --spot: rgba(255, 255, 255, 0.5);
  --shadow: rgba(44, 36, 24, 0.09);
  --sheen: rgba(255, 255, 255, 0.28);
}

html[data-theme="neutral_navy"] {
  --bg-a: #ffffff;
  --bg-b: #f8fafc;
  --ink: #0f172a;
  --muted: rgba(15, 23, 42, 0.48);
  --accent: #2c5282;
  --accent-2: #4299e1;
  --gold-1: #b7791f;
  --gold-2: #a16207;
  --gold-3: #7c4a08;
  --glass-1: rgba(255,255,255,0.85);
  --glass-2: rgba(241,245,249,0.70);
  --glass-3: rgba(255,255,255,0.6);
  --b1: rgba(100, 150, 200, 0.15);
  --b2: rgba(80, 130, 180, 0.12);
  --b3: rgba(60, 110, 160, 0.10);
  --spot: rgba(255, 255, 255, 0.45);
  --shadow: rgba(15, 23, 42, 0.10);
  --sheen: rgba(255, 255, 255, 0.25);
}
```

---

### 策略 2: 统一变量命名（不推荐）

**问题**:
- ❌ 需要修改所有 CSS 文件
- ❌ 破坏现有主题
- ❌ 需要大量测试
- ❌ 改动风险高

---

## 📋 实施步骤

### Step 1: CSS 改造（0.5天）

**修改文件**: `public/css/style.css`

**操作**:
1. 在现有 4 套主题后添加 4 套新主题
2. 保持变量命名一致（`--bg-a`, `--ink`, `--accent` 等）
3. 调整光斑颜色适配亮色背景

### Step 2: JavaScript 适配（0.5天）

**修改文件**: `public/js/main.js`

**修改点**:
```javascript
// 第 375 行，更新主题白名单
document.documentElement.dataset.theme = 
  ['aurora', 'ocean', 'mist', 'sunset', 
   'neutral_morning', 'neutral_cloud', 
   'neutral_oat', 'neutral_navy']
  .includes(t) ? t : 'aurora';
```

**修改文件**: `public/js/admin.js`

**修改点**:
```javascript
// 第 523 行，更新主题选项渲染
function renderThemeOptions() {
  const themes = [
    { key: 'aurora', name: '极光紫' },
    { key: 'ocean', name: '深海蓝' },
    { key: 'mist', name: '晨雾白' },
    { key: 'sunset', name: '落日金' },
    { key: 'neutral_morning', name: '米白·晨雾' },
    { key: 'neutral_cloud', name: '浅灰·云影' },
    { key: 'neutral_oat', name: '燕麦·暖调' },
    { key: 'neutral_navy', name: '藏蓝·经典' }
  ];
  // ... 渲染逻辑
}
```

### Step 3: 默认配置更新（0.5天）

**修改文件**: `defaults.js`

```javascript
const DEFAULT_DB = {
  settings: {
    // ...
    theme: 'aurora',  // 保持默认不变
    // 或改为 'neutral_morning' 作为默认商务主题
  },
  // ...
};
```

### Step 4: 测试验证（0.5天）

**新增测试**: `tests/theme-sync.test.js`

```javascript
// 测试 8 套主题完整性
const themes = ['aurora', 'ocean', 'mist', 'sunset',
                'neutral_morning', 'neutral_cloud',
                'neutral_oat', 'neutral_navy'];

assert.strictEqual(themes.length, 8, '应有 8 套主题');

// 测试亮色主题变量
['neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy']
  .forEach(theme => {
    // 验证亮色主题有正确的背景色
    assert.ok(themeVars[theme]['--bg-a'].startsWith('#f') || 
              themeVars[theme]['--bg-a'].startsWith('#e'),
              `${theme} 应为亮色背景`);
  });
```

### Step 5: 文档同步（0.5天）

**更新文件**:
- `docs/ARCHITECTURE.md` - 添加 4 套新主题说明
- `docs/PRD.md` - 更新主题数量
- `CHANGELOG.md` - 记录变更

---

## 🎨 主题对比

| 主题 | 类型 | 适用场景 | 背景色 | 强调色 |
|------|------|----------|--------|--------|
| aurora | 暗色 | 俱乐部经典 | #0a0a1f | #8b7cf6 |
| ocean | 暗色 | 科技风 | #041520 | #38bdf8 |
| mist | 亮色 | 俱乐部留白 | #eef1fb | #6d5df0 |
| sunset | 暗色 | 暖调风 | #2a1024 | #fb7185 |
| **neutral_morning** | **亮色** | **通用商务** | **#f7f4f0** | **#5a6b7c** |
| **neutral_cloud** | **亮色** | **科技咨询** | **#f1f5f9** | **#4a5568** |
| **neutral_oat** | **亮色** | **文化餐饮** | **#faf8f5** | **#6b5b4e** |
| **neutral_navy** | **亮色** | **金融法律** | **#ffffff** | **#2c5282** |

---

## ✅ 验收标准

### 功能验收
- [ ] 8 套主题均可正常切换
- [ ] 亮色主题在官网正确渲染
- [ ] 亮色主题在后台正确显示
- [ ] 光斑动画在亮色背景下正常
- [ ] 主题偏好自动保存

### 测试验收
- [ ] `npm test` 151 项全绿
- [ ] E2E 主题测试通过
- [ ] 无 console 错误

### 视觉验收
- [ ] 亮色主题文字可读
- [ ] 玻璃效果在亮色背景合理
- [ ] 光斑颜色柔和不刺眼
- [ ] 与 xy-intro-card 视觉风格统一

---

## 🔧 技术要点

### 光斑适配
亮色主题需要降低光斑透明度：
```css
/* 暗色主题 */
--b1: rgba(124, 108, 240, 0.42);
--b2: rgba(56, 189, 248, 0.32);
--b3: rgba(233, 108, 228, 0.28);

/* 亮色主题（降低透明度） */
--b1: rgba(147, 197, 253, 0.2);
--b2: rgba(196, 181, 253, 0.15);
--b3: rgba(253, 186, 201, 0.12);
```

### 玻璃效果适配
亮色主题需要调整玻璃透明度：
```css
/* 暗色主题 */
--glass-1: rgba(255,255,255,0.11);
--glass-2: rgba(255,255,255,0.03);

/* 亮色主题 */
--glass-1: rgba(255,255,255,0.75);
--glass-2: rgba(255,255,255,0.50);
```

---

## 📝 总结

**核心原则**:
1. **保持 xy-club 架构不变** - 使用 `html[data-theme]` 选择器
2. **复用 xy-intro-card 配色** - 但适配 xy-club 的变量命名
3. **最小化改动** - 只新增 4 套主题，不破坏现有功能
4. **向后兼容** - 旧数据自动适配，无需迁移

**预计工作量**: 2天  
**风险等级**: 低（纯新增，不修改现有代码）
