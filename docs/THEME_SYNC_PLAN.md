# xy-club 主题模板同步计划

**目标**: 将 xy-intro-card 的 8 套主题同步到 xy-club，实现两个项目主题风格统一

**制定日期**: 2026-09-29  
**当前版本**: v1.5.2  
**目标版本**: v1.6.0

---

## 📊 现状对比

### xy-intro-card（8套主题）

| 类别 | 主题名 | Key | 类型 |
|------|--------|-----|------|
| **暗色主题** | 落日金 | sunset | dark |
| | 深海蓝 | ocean | dark |
| | 极光紫 | aurora | dark |
| | 晨雾白 | mist | dark |
| **亮色商务** | 米白·晨雾 | neutral_morning | light |
| | 浅灰·云影 | neutral_cloud | light |
| | 燕麦·暖调 | neutral_oat | light |
| | 藏蓝·经典 | neutral_navy | light |

### xy-club（4套主题）

| 主题名 | Key | 类型 |
|--------|-----|------|
| 极光紫 | aurora | dark |
| 深海蓝 | ocean | dark |
| 晨雾白 | mist | dark |
| 落日金 | sunset | dark |

---

## 🎯 同步方案

### 方案 A：完全同步（推荐）

**策略**: xy-club 直接使用 xy-intro-card 的主题配置

**优点**:
- ✅ 两个项目主题完全一致
- ✅ 后续维护简单（改一处即可）
- ✅ 用户体验统一

**缺点**:
- ⚠️ 需要适配 xy-club 的 CSS 变量命名差异

---

### 方案 B：部分同步

**策略**: 只同步亮色商务主题（新增 4 套）

**优点**:
- ✅ 最小改动
- ✅ 保持 xy-club 现有结构

**缺点**:
- ❌ 主题颜色可能不完全一致
- ❌ 维护成本高（需要同步两处）

---

## 📋 实施步骤

### Phase 1: 准备阶段（0.5天）

#### 1.1 分析差异

```bash
# 对比两个项目的主题配置
cd /var/minis/workspace/xy-intro-card-review
grep -A 15 "html\[data-theme" 个人介绍卡生成器.html

cd /var/minis/workspace/xy-club
grep -A 15 "html\[data-theme" public/css/style.css
```

#### 1.2 确定映射关系

| xy-intro-card | xy-club | 说明 |
|---------------|---------|------|
| sunset | sunset | 直接映射 |
| ocean | ocean | 直接映射 |
| aurora | aurora | 直接映射 |
| mist | mist | 直接映射 |
| neutral_morning | neutral_morning | 新增 |
| neutral_cloud | neutral_cloud | 新增 |
| neutral_oat | neutral_oat | 新增 |
| neutral_navy | neutral_navy | 新增 |

---

### Phase 2: CSS 改造（1天）

#### 2.1 统一变量命名

**xy-intro-card 变量**:
```css
:root {
  --bg: #0d0d12;
  --panel: #16161f;
  --text: #ece9e3;
  --accent: #ff9d5c;
  --glass-1: rgba(255,255,255,0.13);
  --glass-2: rgba(255,255,255,0.045);
}
```

**xy-club 变量**:
```css
html[data-theme="aurora"] {
  --bg-a: #0a0a1f;
  --bg-b: #030309;
  --ink: #eef0ff;
  --accent: #8b7cf6;
  --glass-1: rgba(255,255,255,0.11);
}
```

**映射方案**:
- `--bg-a` → `--bg`（背景渐变起点）
- `--bg-b` → 合并到 `--bg`（使用渐变）
- `--ink` → `--text`
- `--muted` → `--dim`
- `--faint` → 保持
- `--line` → 保持
- `--glass-1/2/3` → `--glass-1/2`
- `--spot` → 新增（光标高光）
- `--shadow` → 保持
- `--accent/2` → `--accent` / `--accent-2`
- `--gold-1/2/3` → 移除（xy-club 不需要）
- `--b1/2/3` → `--blob1/2/3`
- `--sheen` → 保持

#### 2.2 创建主题配置文件

新建 `public/js/themes.js`:

```javascript
// 主题配置（与 xy-intro-card 同步）
const CLUB_THEMES = {
  sunset: {
    name: '落日金',
    mode: 'dark',
    colors: {
      '--bg': '#2a1024',
      '--bg-grad': 'linear-gradient(160deg, #2a1024, #12060f)',
      '--text': '#fff0f3',
      '--dim': '#d6a8b6',
      '--accent': '#ff9d5c',
      '--accent-2': '#ffd0a8',
      '--glass-1': 'rgba(255,255,255,0.11)',
      '--glass-2': 'rgba(255,255,255,0.03)',
      '--blob1': 'rgba(255,138,76,0.45)',
      '--blob2': 'rgba(255,100,100,0.30)',
      '--blob3': 'rgba(200,100,255,0.26)'
    }
  },
  // ... 其他主题
};
```

---

### Phase 3: JavaScript 改造（1天）

#### 3.1 更新 main.js

```javascript
// 主题切换函数
function setTheme(themeName) {
  const theme = CLUB_THEMES[themeName];
  if (!theme) return;
  
  const html = document.documentElement;
  html.dataset.theme = themeName;
  
  // 应用主题变量
  Object.entries(theme.colors).forEach(([prop, value]) => {
    html.style.setProperty(prop, value);
  });
  
  // 保存用户偏好
  localStorage.setItem('xy-club-theme', themeName);
}
```

#### 3.2 更新 admin.js

```javascript
// 主题选择器
function renderThemePicker() {
  const picker = $('#themePicker');
  picker.innerHTML = '';
  
  Object.entries(CLUB_THEMES).forEach(([key, theme]) => {
    const btn = document.createElement('button');
    btn.className = 'theme-opt' + (D.settings.theme === key ? ' sel' : '');
    btn.dataset.theme = key;
    btn.innerHTML = `<span class="swatch" style="background:${theme.colors['--accent']}"></span>${theme.name}`;
    picker.appendChild(btn);
  });
}
```

---

### Phase 4: 测试验证（0.5天）

#### 4.1 单元测试

新增 `tests/theme-sync.test.js`:

```javascript
const assert = require('assert');

// 测试主题配置完整性
assert(Object.keys(CLUB_THEMES).length === 8, '应有 8 套主题');

// 测试主题名称唯一性
const names = Object.values(CLUB_THEMES).map(t => t.name);
assert(new Set(names).size === 8, '主题名称应唯一');

// 测试模式分类
const darkThemes = Object.values(CLUB_THEMES).filter(t => t.mode === 'dark');
const lightThemes = Object.values(CLUB_THEMES).filter(t => t.mode === 'light');
assert(darkThemes.length === 4, '应有 4 套暗色主题');
assert(lightThemes.length === 4, '应有 4 套亮色主题');
```

#### 4.2 E2E 测试

新增 `e2e/themes.spec.js`:

```javascript
test('主题切换正常', async ({ page }) => {
  await page.goto('/');
  
  // 测试所有主题
  const themes = ['sunset', 'ocean', 'aurora', 'mist', 
                  'neutral_morning', 'neutral_cloud', 
                  'neutral_oat', 'neutral_navy'];
  
  for (const theme of themes) {
    await page.click(`.theme-opt[data-theme="${theme}"]`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  }
});
```

---

### Phase 5: 文档同步（0.5天）

#### 5.1 更新 ARCHITECTURE.md

```markdown
## 主题机制

xy-club 现在支持 **8 套主题**，与 xy-intro-card 完全同步：

| 类别 | 主题 | 适用场景 |
|------|------|----------|
| 暗色 | sunset 落日金 | 俱乐部经典暖调 |
| | ocean 深海蓝 | 俱乐部冷静科技风 |
| | aurora 极光紫 | 俱乐部梦幻创意感 |
| | mist 晨雾白 | 俱乐部低饱和留白 |
| 亮色 | neutral_morning 米白·晨雾 | 通用商务名片 |
| | neutral_cloud 浅灰·云影 | 科技/咨询类 |
| | neutral_oat 燕麦·暖调 | 文化/餐饮类 |
| | neutral_navy 藏蓝·经典 | 金融/法律类 |
```

#### 5.2 更新 PRD.md

在 3.1 节添加：
```markdown
- 8 种主题（与 xy-intro-card 同步）
```

---

### Phase 6: 发布（0.5天）

#### 6.1 版本更新

```bash
# 更新版本号
node -i -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.version = '1.6.0';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
```

#### 6.2 打 tag

```bash
git add -A
git commit -m "feat: 同步 xy-intro-card 主题模板至 xy-club

## feat
- 新增 4 套亮色商务主题（米白·晨雾/浅灰·云影/燕麦·暖调/藏蓝·经典）
- 统一主题变量命名规范
- 主题切换功能完整支持

## test
- 新增 theme-sync.test.js（20项）
- 新增 e2e/themes.spec.js（8项）
- 总测试数: 123 → 151

## breaking
- 无（完全向后兼容）"

git tag -a v1.6.0 -m "v1.6.0 — 同步 xy-intro-card 主题模板"
git push origin main --tags
```

---

## 📊 工作量评估

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| Phase 1 | 准备阶段 | 0.5天 |
| Phase 2 | CSS 改造 | 1天 |
| Phase 3 | JavaScript 改造 | 1天 |
| Phase 4 | 测试验证 | 0.5天 |
| Phase 5 | 文档同步 | 0.5天 |
| Phase 6 | 发布 | 0.5天 |
| **总计** | | **4天** |

---

## ✅ 验收标准

### 功能验收
- [ ] 8 套主题均可切换
- [ ] 主题变量正确应用
- [ ] 后台主题选择器显示所有主题
- [ ] 主题偏好持久化（localStorage）
- [ ] 与 xy-intro-card 主题颜色完全一致

### 测试验收
- [ ] `npm test` 151 项全绿
- [ ] E2E 测试全部通过
- [ ] 无 console 错误
- [ ] 无 console 警告

### 文档验收
- [ ] ARCHITECTURE.md 更新
- [ ] PRD.md 更新
- [ ] CHANGELOG.md 更新
- [ ] README.md 更新（中英同步）
- [ ] 主题配置表格完整

### 兼容性验收
- [ ] 现有 4 套主题正常工作
- [ ] 旧数据自动适配新主题
- [ ] 静态回退模式正常

---

## 🔧 技术细节

### CSS 变量映射表

| xy-intro-card | xy-club（新） | 说明 |
|---------------|---------------|------|
| `--bg` | `--bg` | 背景色 |
| `--text` | `--ink` | 主文字色 |
| `--dim` | `--muted` | 次要文字色 |
| `--accent` | `--accent` | 强调色 |
| `--accent-2` | `--accent-2` | 次要强调色 |
| `--glass-1` | `--glass-1` | 玻璃效果层1 |
| `--glass-2` | `--glass-2` | 玻璃效果层2 |
| `--blob1/2/3` | `--b1/2/3` | 背景光斑 |

### 主题配置格式

```javascript
{
  key: 'neutral_morning',      // 主题标识
  name: '米白·晨雾',           // 显示名称
  mode: 'light',              // dark/light
  desc: '最克制，通用商务名片', // 描述
  colors: {                   // CSS 变量
    '--bg': '#f7f4f0',
    '--text': '#1e2935',
    // ...
  }
}
```

---

## ⚠️ 注意事项

1. **向后兼容**: 现有 4 套主题保持不变，仅新增 4 套
2. **数据迁移**: 旧配置自动适配，无需手动迁移
3. **测试优先**: 先写测试再实现功能
4. **文档同步**: 代码改动必须同步文档
5. **版本一致**: Git Tag = 代码版本 = 文档版本

---

## 📝 相关文件清单

### 需要修改的文件
- [ ] `public/css/style.css` - 添加 4 套新主题 CSS
- [ ] `public/js/main.js` - 主题切换逻辑
- [ ] `public/js/admin.js` - 主题选择器
- [ ] `defaults.js` - 默认配置
- [ ] `tests/theme-sync.test.js` - 单元测试（新增）
- [ ] `e2e/themes.spec.js` - E2E 测试（新增）
- [ ] `docs/ARCHITECTURE.md` - 架构文档
- [ ] `docs/PRD.md` - 产品需求文档
- [ ] `CHANGELOG.md` - 变更日志

### 不需要修改的文件
- [x] `server.js` - 后端逻辑不变
- [x] `public/index.html` - 页面结构不变
- [x] `public/admin.html` - 后台结构不变

---

**制定人**: Minis (AI技术合伙人)  
**审批人**: [待确认]  
**更新日期**: 2026-09-29
