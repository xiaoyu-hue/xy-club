'use strict';
/**
 * E2E 专用服务
 *
 * 与测试脚手架同一原则：用一次性数据目录，绝不碰开发者真实的 data/db.json。
 * 每次启动都清空，保证用例之间互不干扰。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const DATA_DIR = process.env.XY_E2E_DATA
  ? path.resolve(process.env.XY_E2E_DATA)
  : path.join(os.tmpdir(), 'xy-club-e2e');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// 必须在 require server.js 之前设置
process.env.DATA_DIR = DATA_DIR;
process.env.UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const { app } = require('../server.js');

const PORT = Number(process.env.PORT || 4173);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[e2e] server ready on http://127.0.0.1:${PORT} (data: ${DATA_DIR})`);
});
