#!/usr/bin/env node
/**
 * 一次性脚本：生成 4 个跨行业参考案例 JSON（v1.8.0）
 * 输出到 public/cases/*.json，结构与 defaults.js 的 DEFAULT_DB 完全一致。
 * 遵守 ADR-005 P1：企业名虚构、电话占位、地址占位、Logo 用 emoji。
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'cases');
fs.mkdirSync(OUT, { recursive: true });

/* ============ 案例 2：暖木咖啡 Warmwood Coffee ============ */
const coffee = {
  settings: {
    siteName: '暖木咖啡',
    logoEmoji: '☕',
    slogan: '温度刚刚好的那一杯',
    theme: 'neutral_oat',
    heroBadge: '🌱 产地直采 · 自家烘焙 · 社区友好',
    heroTitle: '一座城市的|慢与温度',
    heroSubtitle: '从埃塞俄比亚的日晒豆，到吧台前这杯手冲——我们把产地的阳光，装进你的清晨。',
    heroStats: '3家门店,12款单品豆,9年烘焙,4.9分好评',
    announcement: '本周推荐：耶加雪菲 日晒浅烘 · 花香柑橘 · 会员价 68 元/包（半磅）',
    wechat: 'WARMWOOD-COFFEE',
    qq: '',
    phone: '400-000-0000',
    email: 'hello@example.com',
    qrImage: '',
    qrNote: '扫码添加店长微信，进「木豆会员群」享每周新品试饮',
    serviceTime: '每日 08:00–22:00 · 周三会员日营业至 23:00',
    footer: '暖木咖啡 · 温度刚刚好的那一杯\n本页为模板演示案例，企业名称与联系方式均为虚构示例',
    custom: {}
  },
  sections: [
    {
      id: 'c-menu',
      type: 'services',
      icon: '☕',
      title: '今日菜单',
      subtitle: '意式 · 手冲 · 茶与特调 · 轻食甜点',
      tip: '所有咖啡均使用当日烘焙豆 · 可备注风味偏好，吧台为你调整萃取',
      visible: true,
      items: [
        { name: '意式浓缩 Espresso', price: '22', unit: '元/杯', desc: '双份萃取 · 坚果与可可尾韵' },
        { name: '拿铁 Latte', price: '32', unit: '元/杯', desc: '丝滑奶泡 · 平衡圆润', original: '36' },
        { name: '手冲单品 · 耶加雪菲', price: '45', unit: '元/杯', desc: '埃塞俄比亚 · 日晒浅烘 · 花香柑橘' },
        { name: '手冲单品 · 曼特宁', price: '42', unit: '元/杯', desc: '印尼 · 中深烘 · 草本与黑巧' },
        { name: '冷萃冰咖啡', price: '38', unit: '元/杯', desc: '低温萃取 16 小时 · 清爽低酸' },
        { name: '桂花乌龙冷萃茶', price: '32', unit: '元/杯', desc: '茶与花 · 无咖啡因可选' },
        { name: '巴斯克芝士蛋糕', price: '36', unit: '元/份', desc: '焦香外皮 · 流心内里' },
        { name: '可颂（原味 / 杏仁）', price: '22', unit: '元/个', desc: '每日现烤 · 限时供应' }
      ]
    },
    {
      id: 'c-story',
      type: 'cards',
      icon: '🌱',
      title: '我们坚持的三件事',
      subtitle: '一杯咖啡背后的选择',
      visible: true,
      items: [
        { icon: '🌍', title: '产地直采', desc: '与云南、埃塞俄比亚、哥伦比亚的合作社直接采购，去掉中间环节，把钱留给种豆的人' },
        { icon: '🔥', title: '自家烘焙', desc: '每周两次小批量烘焙，烘焙曲线按批次微调，确保到你手上时正处于风味峰期' },
        { icon: '🏘️', title: '社区友好', desc: '自带杯立减 5 元，咖啡渣免费自取养花，门店每周六举办免费杯测分享会' }
      ]
    },
    {
      id: 'c-stores',
      type: 'notice',
      icon: '📍',
      title: '门店信息',
      subtitle: '三家门店，都有落地窗',
      visible: true,
      items: [
        { icon: '🏠', text: '暖木·江畔店｜示例市 示例区 江畔路 1 号｜08:00–22:00｜沿江落地窗，可看日落' },
        { icon: '📚', text: '暖木·书屋店｜示例市 示例区 文华路 2 号｜09:00–23:00｜书店主题，夜间安静' },
        { icon: '🌳', text: '暖木·社区店｜示例市 示例区 梧桐街 3 号｜07:30–20:00｜社区友好，宠物可入' }
      ]
    },
    {
      id: 'c-reviews',
      type: 'testimonials',
      icon: '💬',
      title: '客人怎么说',
      subtitle: '来自木豆会员的真实反馈',
      visible: true,
      items: [
        { emoji: '🌅', who: '每天一杯的小林', rating: 5, text: '手冲耶加的花香是真的能闻到，吧台小哥还会讲产区故事，喝的不只是咖啡。' },
        { emoji: '💻', who: '自由职业的M', rating: 5, text: '书屋店太适合工作了，安静、插座多、续杯还便宜，一坐一下午。' },
        { emoji: '🐕', who: '养狗的晴天', rating: 5, text: '全城少有的宠物友好咖啡馆，带狗进去完全没被嫌弃，还送了狗狗饼干。' },
        { emoji: '🧁', who: '甜点控阿哲', rating: 4, text: '巴斯克流心做得很好，就是周末去经常卖完，建议早点去或者提前预定。' }
      ]
    },
    {
      id: 'c-faq',
      type: 'faq',
      icon: '❓',
      title: '常见问题',
      subtitle: '第一次来？先看看这里',
      visible: true,
      items: [
        { q: '可以自己带杯子吗？', a: '非常欢迎。自带杯全场立减 5 元，不限材质。我们也会提供可循环使用的堂食杯。' },
        { q: '豆子可以买回去自己冲吗？', a: '可以，所有单品豆均有半磅（227g）与一磅装。购买时告知平时的冲煮方式，我们会帮你选烘焙度。' },
        { q: '有会员制度吗？', a: '有。木豆会员（消费满 200 元自动加入）享 9.5 折与每周新品试饮；银橡会员 9 折；金檀会员 8.5 折并赠生日蛋糕。' },
        { q: '门店可以包场或办活动吗？', a: '江畔店与书屋店支持非营业时段包场，最小 10 人起。请提前 7 天联系店长沟通。' },
        { q: '咖啡因敏感有选择吗？', a: '有。所有饮品均可换低因豆，冷萃茶与部分特调本身不含咖啡因，点单时告知即可。' }
      ]
    },
    {
      id: 'c-about',
      type: 'text',
      icon: '📖',
      title: '关于暖木',
      subtitle: '',
      visible: true,
      content: '暖木咖啡创立于 2017 年，从一台二手半自动咖啡机和 20 平米的小铺起步。\n\n我们相信，一杯好咖啡不该是高不可攀的仪式，而应该是「随手可得的小确幸」。\n所以我们把价格做得克制，把豆子的来路说得清楚，把吧台留给愿意聊两句的你。\n\n九年过去，我们有了三家门店、一台自己的烘焙机，以及一群每周都会来的老朋友。\n\n温度刚刚好的那一杯，随时为你留着。'
    }
  ]
};

/* ============ 案例 3：明理律师事务所 ============ */
const law = {
  settings: {
    siteName: '明理律师事务所',
    logoEmoji: '⚖️',
    slogan: '专业立身 · 明理致远',
    theme: 'neutral_navy',
    heroBadge: '📜 执业许可公示 · 专业团队 · 保密承诺',
    heroTitle: '以专业为尺|以责任为度',
    heroSubtitle: '为企业与个人提供公司治理、知识产权、争议解决与合规咨询的全流程法律服务。',
    heroStats: '32人执业律师,200+服务企业,600+年均办结案件,15年成立',
    announcement: '本所已通过年度执业检查 · 企业合规专项咨询现开放预约',
    wechat: 'MINGLI-LAW-DEMO',
    qq: '',
    phone: '400-000-0000',
    email: 'contact@example.com',
    qrImage: '',
    qrNote: '扫码预约首次咨询（本页面为模板演示，联系方式为虚构示例）',
    serviceTime: '工作日 09:00–18:00 · 紧急案件可 24 小时电话联络',
    footer: '明理律师事务所 · 专业立身 · 明理致远\n本页为模板演示案例，企业名称与联系方式均为虚构示例',
    custom: {}
  },
  sections: [
    {
      id: 'l-practice',
      type: 'cards',
      icon: '📂',
      title: '业务领域',
      subtitle: '五大核心执业方向',
      visible: true,
      items: [
        { icon: '🏢', title: '公司治理与并购', desc: '股权架构设计、投融资尽调、并购重组、股东争议解决，陪伴企业从初创到上市' },
        { icon: '🔐', title: '知识产权', desc: '商标与专利申请、著作权维权、商业秘密保护、知识产权许可与转让' },
        { icon: '⚔️', title: '争议解决', desc: '商事诉讼与仲裁、合同纠纷、建设工程纠纷、执行异议与复议' },
        { icon: '📋', title: '合规与风控', desc: '数据合规、劳动人事合规、反商业贿赂、企业内控体系搭建' },
        { icon: '👨‍👩‍👧', title: '婚姻家事与财富传承', desc: '离婚财产分割、抚养权争议、遗嘱与信托、家族企业股权传承' }
      ]
    },
    {
      id: 'l-process',
      type: 'notice',
      icon: '🔍',
      title: '服务流程',
      subtitle: '每一步都清晰可追溯',
      visible: true,
      items: [
        { icon: '1️⃣', text: '初步咨询：了解案情与诉求，判断法律关系与可行性，出具初步意见' },
        { icon: '2️⃣', text: '方案评估：组建承办团队，梳理证据脉络，出具书面解决方案与费用测算' },
        { icon: '3️⃣', text: '委托签约：签订委托代理协议，明确服务范围、收费方式与保密条款' },
        { icon: '4️⃣', text: '案件推进：分阶段同步进展，重大节点当面沟通，全程留痕可查' },
        { icon: '5️⃣', text: '结案回访：交付结案报告，提供后续风险提示与长期顾问服务建议' }
      ]
    },
    {
      id: 'l-cases',
      type: 'cards',
      icon: '📁',
      title: '代表性案例',
      subtitle: '已作脱敏处理，不代表办案承诺',
      visible: true,
      items: [
        { icon: '⚖️', title: '某科技公司股权纠纷', desc: '代理创始股东，通过股权回购与对赌条款设计，在诉讼阶段促成和解，避免公司控制权旁落' },
        { icon: '🔒', title: '跨境电商商标维权', desc: '为某出海品牌在三个法域完成商标布局，并成功阻止境内仿冒品流入海外平台' },
        { icon: '🏗️', title: '建设工程价款争议', desc: '代理施工方主张工程价款与优先受偿权，经鉴定与两审，最终全额支持本金及利息' },
        { icon: '📊', title: '拟上市企业合规整改', desc: '协助某制造企业完成数据合规与劳动用工整改，顺利通过上市前专项尽调' }
      ]
    },
    {
      id: 'l-team',
      type: 'cards',
      icon: '👥',
      title: '专业团队',
      subtitle: '合伙人 · 主办律师 · 顾问',
      visible: true,
      items: [
        { icon: '⚖️', title: '首席合伙人 · 陈律', desc: '执业 18 年，专注公司治理与并购，主办过数十宗亿元级投融资项目' },
        { icon: '🔐', title: '高级合伙人 · 林律', desc: '知识产权法学硕士，深耕商标与商业秘密，多次入选行业专业榜单' },
        { icon: '⚔️', title: '争议解决部 · 周律', desc: '前法官背景，主办商事诉讼与仲裁，擅长复杂证据体系构建' },
        { icon: '📋', title: '合规顾问 · 吴老师', desc: '前监管机构合规官，负责数据合规与企业内控体系设计' }
      ]
    },
    {
      id: 'l-cred',
      type: 'notice',
      icon: '🏅',
      title: '资质与承诺',
      subtitle: '专业与责任的底线',
      visible: true,
      items: [
        { icon: '📜', text: '持有司法行政机关核发的律师事务所执业许可证，年度执业检查均合格' },
        { icon: '🔒', text: '严格遵守律师执业保密义务，当事人信息与案件材料加密留存' },
        { icon: '💰', text: '收费公开透明，委托前出具书面费用方案，无隐性收费' },
        { icon: '🚫', text: '不承诺办案结果，不进行违规风险代理，不承接利益冲突案件' }
      ]
    },
    {
      id: 'l-faq',
      type: 'faq',
      icon: '❓',
      title: '常见问题',
      subtitle: '委托前后你可能关心的',
      visible: true,
      items: [
        { q: '首次咨询收费吗？', a: '30 分钟以内的初步法律意见免费。若需要出具书面方案或深度评估，会提前告知收费标准并征得同意。' },
        { q: '如何收费？', a: '根据案件类型采用计时、计件或风险代理等不同方式，委托前会出具书面费用方案。' },
        { q: '可以只做法律顾问不代理诉讼吗？', a: '可以。我们提供年度法律顾问服务，覆盖合同审查、劳动咨询、合规培训等日常需求。' },
        { q: '外地案件接吗？', a: '接。我们与多地同行有协作网络，跨区域案件可由本地团队与协作律师共同承办。' },
        { q: '我的信息会保密吗？', a: '会。保密是律师的法定义务，所有当事人信息与卷宗材料均加密存储，仅承办团队可知。' }
      ]
    },
    {
      id: 'l-about',
      type: 'text',
      icon: '🏛️',
      title: '关于明理',
      subtitle: '',
      visible: true,
      content: '明理律师事务所成立于 2010 年，是一家以商事法律服务为核心的综合性律师事务所。\n\n我们相信，法律服务的价值不在于制造对抗，而在于「在规则之内，为当事人找到最优解」。\n因此我们不渲染诉讼焦虑，不承诺办案结果，只把案件的法律关系、可行路径与真实风险如实说清。\n\n十五年来，我们服务过初创公司、上市公司、外资企业与个人当事人。\n不论案件标的大小，我们坚持同一套严谨的办案流程与同一份保密承诺。\n\n专业立身，明理致远。'
    }
  ]
};

/* ============ 案例 4：云枢 SaaS · CloudPivot ============ */
const saas = {
  settings: {
    siteName: '云枢 CloudPivot',
    logoEmoji: '☁️',
    slogan: '让每一次协作都有据可循',
    theme: 'neutral_cloud',
    heroBadge: '🚀 免费试用 14 天 · 无需信用卡 · 5 分钟接入',
    heroTitle: '把散落的项目|收进一个中枢',
    heroSubtitle: 'CloudPivot 是面向中小研发团队的协作中枢：任务、文档、进度、复盘统一在一个工作台，告别在十个工具之间来回切换。',
    heroStats: '12000+团队在用,99.9%可用性,40%平均提速,4.8分评分',
    announcement: '新版本 4.0 已发布：支持自动化工作流与多维视图，老用户免费升级',
    wechat: '',
    qq: '',
    phone: '400-000-0000',
    email: 'sales@example.com',
    qrImage: '',
    qrNote: '预约 1 对 1 演示，顾问将在 1 个工作日内与你联系',
    serviceTime: '售前咨询 工作日 09:00–19:00 · 技术支持 7×24 小时在线',
    footer: '云枢 CloudPivot · 让每一次协作都有据可循\n本页为模板演示案例，企业名称与联系方式均为虚构示例',
    custom: {}
  },
  sections: [
    {
      id: 's-value',
      type: 'cards',
      icon: '💡',
      title: '为什么选择云枢',
      subtitle: '解决研发团队的真实痛点',
      visible: true,
      items: [
        { icon: '🎯', title: '一个中枢，不再来回切换', desc: '任务、需求、文档、排期、复盘全部收敛到同一处，减少上下文切换带来的效率损耗' },
        { icon: '⚡', title: '自动化工作流', desc: '状态流转、通知、字段更新全部可视化配置，重复动作交给机器人执行' },
        { icon: '📊', title: '多维视图', desc: '同一批数据可切换看板、列表、甘特图、日历视图，研发看进度、老板看全局' },
        { icon: '🔌', title: '开放集成', desc: '提供完整 REST API 与 Webhook，与代码仓库、CI、IM 工具打通' },
        { icon: '🔐', title: '企业级安全', desc: '数据加密存储、细粒度权限、完整操作审计，支持私有化部署' },
        { icon: '🧭', title: '零学习成本', desc: '内置 20+ 行业模板，开箱即用；从其他工具一键导入历史数据' }
      ]
    },
    {
      id: 's-pricing',
      type: 'services',
      icon: '💰',
      title: '套餐与定价',
      subtitle: '按人数计费 · 支持年付优惠',
      tip: '所有套餐均含 14 天免费试用，无需绑定信用卡；年付享 8 折',
      visible: true,
      items: [
        { name: '团队版 Team', price: '39', unit: '元/人/月', desc: '最多 30 人 · 全部核心功能 · 5GB 存储 · 邮件支持' },
        { name: '专业版 Pro', price: '89', unit: '元/人/月', desc: '人数不限 · 自动化工作流 · 多维视图 · 50GB 存储 · 优先支持', original: '109' },
        { name: '企业版 Enterprise', price: '按需', unit: '联系销售', desc: '私有化部署 · SSO 单点登录 · 无限存储 · 专属客户成功经理' },
        { name: '教育与非营利', price: '5折', unit: '优惠', desc: '在校师生与非营利组织凭证件享专业版 5 折' }
      ]
    },
    {
      id: 's-steps',
      type: 'notice',
      icon: '🚀',
      title: '五分钟接入流程',
      subtitle: '从注册到团队上手',
      visible: true,
      items: [
        { icon: '1️⃣', text: '注册账号：邮箱或企业 SSO 登录，30 秒完成，无需信用卡' },
        { icon: '2️⃣', text: '创建工作区：选择行业模板，或从 Jira / Trello 一键导入历史数据' },
        { icon: '3️⃣', text: '邀请成员：批量导入成员并按角色分配权限，支持部门分组' },
        { icon: '4️⃣', text: '配置工作流：拖拽设置状态流转与自动化规则，或直接用推荐配置' },
        { icon: '5️⃣', text: '开始协作：任务、文档、进度实时同步，移动端 App 随时查看' }
      ]
    },
    {
      id: 's-reviews',
      type: 'testimonials',
      icon: '💬',
      title: '客户评价',
      subtitle: '来自不同规模团队的声音',
      visible: true,
      items: [
        { emoji: '👨‍💻', who: '某出海 SaaS 研发负责人', rating: 5, text: '从三个工具合并成一个，周会时间直接砍半。自动化规则省掉了大量手动改状态的活。' },
        { emoji: '📈', who: '某制造企业数字化负责人', rating: 5, text: '私有化部署解决了我们的数据合规顾虑，审计日志功能也让 IT 部门很满意。' },
        { emoji: '🎨', who: '某设计工作室主理人', rating: 4, text: '多维视图很好用，客户看甘特图，我们看板，同一套数据不用维护两份。' },
        { emoji: '🚀', who: '某初创团队 CTO', rating: 5, text: '免费试用没要信用卡这点很加分，团队试了两周就决定全量迁移了。' }
      ]
    },
    {
      id: 's-faq',
      type: 'faq',
      icon: '❓',
      title: '常见问题',
      subtitle: '购买前你可能想知道的',
      visible: true,
      items: [
        { q: '免费试用到期后数据会保留吗？', a: '会。试用结束后数据保留 90 天，期间随时升级即可无缝继续使用，不会丢失任何历史记录。' },
        { q: '支持哪些登录方式？', a: '支持邮箱密码、企业微信、钉钉、飞书，以及企业版的 SAML / OIDC 单点登录。' },
        { q: '可以从其他工具迁移数据吗？', a: '可以。我们提供 Jira、Trello、Asana、Excel 等常见格式的一键导入工具，并保留原始字段映射关系。' },
        { q: '有 API 吗？', a: '有。提供完整的 REST API 与 Webhook，专业版及以上可直接调用，文档公开可查。' },
        { q: '数据安全如何保障？', a: '数据加密存储、传输全程 TLS、细粒度权限控制与完整操作审计。企业版支持私有化部署，数据不出内网。' }
      ]
    },
    {
      id: 's-about',
      type: 'text',
      icon: '☁️',
      title: '关于云枢',
      subtitle: '',
      visible: true,
      content: '云枢 CloudPivot 由一群在研发管理一线摸爬滚打多年的工程师创立。\n\n我们做过很多项目，也用过很多工具。最大的困扰是：\n信息散落在即时通讯、文档、看板、表格里，没有人能说清"这个需求现在到底到哪一步了"。\n\n所以我们做了云枢——不是又一个待办清单，而是一个真正把项目信息收束起来的中枢。\n\n我们的目标很简单：让每一次协作都有据可循，让团队的每一分努力都被看见。'
    }
  ]
};

/* ============ 案例 5：拾光摄影工作室 ============ */
const photo = {
  settings: {
    siteName: '拾光摄影',
    logoEmoji: '📷',
    slogan: '把时间拾起来，装进照片里',
    theme: 'mist',
    heroBadge: '✨ 自然光纪实 · 拒绝模板化摆拍 · 档期预约制',
    heroTitle: '留住那些|来不及告别的瞬间',
    heroSubtitle: '婚礼纪实 · 家庭写真 · 商业人像 · 旅拍跟拍，用自然光记录真实情绪，而不是凹造型。',
    heroStats: '1200+组拍摄,30+合作场地,8年经验,65%复购率',
    announcement: '秋季档期开放预约中 · 工作日拍摄享 9 折 · 老客户推荐双方各减 200 元',
    wechat: 'SHIGUANG-PHOTO',
    qq: '',
    phone: '400-000-0000',
    email: 'hi@example.com',
    qrImage: '',
    qrNote: '扫码预约，先聊聊你想要的画面感觉（本页为模板演示，联系方式为虚构示例）',
    serviceTime: '预约咨询 每日 10:00–20:00 · 拍摄档期以实际排期为准',
    footer: '拾光摄影 · 把时间拾起来，装进照片里 本页为模板演示案例，企业名称与联系方式均为虚构示例',
    custom: {}
  },
  sections: [
    {
      id: 'p-works',
      type: 'gallery',
      icon: '🖼️',
      title: '作品集',
      subtitle: '部分拍摄作品，均为真实客户授权展示',
      visible: true,
      items: [
        { url: './cases/images/photo-work-1.webp', caption: '山野婚礼 · 晨雾中的仪式' },
        { url: './cases/images/photo-work-2.webp', caption: '雪山旅拍 · 光落下的那一刻' },
        { url: './cases/images/photo-work-3.webp', caption: '林间家庭日 · 孩子在跑' },
        { url: './cases/images/photo-hero.webp', caption: '自然光人像 · 不摆拍的真实' }
      ]
    },
    {
      id: 'p-services',
      type: 'services',
      icon: '💼',
      title: '拍摄服务',
      subtitle: '明码标价 · 底片全送',
      tip: '所有套餐均含：拍摄前沟通 · 精选修图 · 原始底片全交付 · 无二次收费',
      visible: true,
      items: [
        { name: '家庭写真 · 半日', price: '1280', unit: '元/组', desc: '2 小时拍摄 · 1 个场景 · 30 张精修 · 底片全送' },
        { name: '婚礼纪实 · 全天', price: '4800', unit: '元/场', desc: '10 小时跟拍 · 双机位 · 200 张精修 · 含快剪花絮', original: '5800' },
        { name: '商业人像 · 工作照', price: '880', unit: '元/人', desc: '1 小时 · 2 套造型 · 20 张精修 · 含棚拍' },
        { name: '旅拍跟拍 · 按天', price: '2980', unit: '元/天', desc: '8 小时跟拍 · 1 位摄影师 · 60 张精修 · 差旅另计' },
        { name: '产品静物 · 电商图', price: '60', unit: '元/张', desc: '白底/场景图 · 10 张起拍 · 含基础修图' },
        { name: '证件照 · 精修版', price: '168', unit: '元/人', desc: '拍摄 15 分钟 · 1 张精修 · 含多种尺寸导出' }
      ]
    },
    {
      id: 'p-process',
      type: 'notice',
      icon: '📋',
      title: '拍摄流程',
      subtitle: '从预约到交付，一共四步',
      visible: true,
      items: [
        { icon: '1️⃣', text: '沟通需求：聊聊拍摄目的、想要的感觉、时间与场地，推荐合适方案' },
        { icon: '2️⃣', text: '确认档期：支付 30% 定金锁定档期，收到拍摄准备清单（穿搭/道具建议）' },
        { icon: '3️⃣', text: '正式拍摄：摄影师全程引导，不擅长面对镜头也完全没关系' },
        { icon: '4️⃣', text: '选片交付：拍摄后 3 个工作日内出样片，选片后 10 个工作日内交付精修与底片' }
      ]
    },
    {
      id: 'p-reviews',
      type: 'testimonials',
      icon: '💬',
      title: '客户反馈',
      subtitle: '那些被记录下来的瞬间',
      visible: true,
      items: [
        { emoji: '💍', who: '新婚的小雨', rating: 5, text: '完全不摆拍，摄影师就像朋友一样跟着我们走，出来的照片全是我笑到眼睛眯起来的样子。' },
        { emoji: '👶', who: '两娃妈妈', rating: 5, text: '拍孩子最怕他们不配合，摄影师特别有耐心，全程在玩，抓拍到的全是自然的瞬间。' },
        { emoji: '🏔️', who: '旅拍客户 Alan', rating: 5, text: '雪山那组真的绝了，光刚好打下来的时候他一直在等，专业度没得说。' },
        { emoji: '💼', who: '某创业公司 HR', rating: 4, text: '给团队拍了一组工作照，效率很高，风格统一，用在官网上很专业。' }
      ]
    },
    {
      id: 'p-faq',
      type: 'faq',
      icon: '❓',
      title: '常见问题',
      subtitle: '拍摄前先看看这里',
      visible: true,
      items: [
        { q: '底片真的全送吗？', a: '真的。所有套餐的原始底片都会完整交付，不做任何删减，也不需要额外购买。' },
        { q: '不擅长面对镜头怎么办？', a: '这是最常见的担心，也是我们最擅长处理的事。我们不会让你摆僵硬的姿势，而是通过聊天和引导，让你自然地动起来。' },
        { q: '可以指定拍摄场地吗？', a: '可以。你可以自带场地，也可以从我们合作的 30+ 场地中选择（部分场地需另付场地费）。' },
        { q: '天气不好怎么办？', a: '户外拍摄如遇恶劣天气，可免费改期到任意可用档期；也可现场协商转为室内方案。' },
        { q: '多久能拿到照片？', a: '样片 3 个工作日，精修成片自选片确认起 10 个工作日。旺季（春秋）可能顺延，会提前告知。' }
      ]
    },
    {
      id: 'p-about',
      type: 'text',
      icon: '📷',
      title: '关于拾光',
      subtitle: '',
      visible: true,
      content: '拾光摄影成立于 2018 年，是一支只有四个人的小团队。\n\n我们不做批量化的流水线拍摄，一年只接有限的单量——因为好的照片需要时间，\n需要摄影师在拍摄前真正了解你，也需要在按下快门前的那几秒耐心等待。\n\n我们偏爱自然光，偏爱真实的表情，偏爱那些"没准备好"的瞬间。\n因为多年以后你会翻看的，不是那些标准微笑，而是当时那个真实的自己。\n\n把时间拾起来，装进照片里。'
    }
  ]
};

/* ============ 写入 ============ */
const cases = {
  'warmwood-coffee': coffee,
  'mingli-law': law,
  'cloudpivot': saas,
  'shiguang-photo': photo
};

for (const [id, data] of Object.entries(cases)) {
  if (data.settings.adminPassword) delete data.settings.adminPassword;
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ ${id}.json  (${data.sections.length} 个板块)`);
}

/* ============ manifest ============ */
const manifest = {
  cases: [
    { id: 'xy-club', name: 'XY俱乐部', industry: '陪玩服务', emoji: '💎', theme: 'aurora', desc: '游戏陪玩 · 陪聊树洞 · 受气包服务', demo: false },
    { id: 'warmwood-coffee', name: '暖木咖啡', industry: '精品咖啡', emoji: '☕', theme: 'neutral_oat', desc: '产地直采 · 自家烘焙 · 社区友好', demo: true },
    { id: 'mingli-law', name: '明理律师事务所', industry: '法律服务', emoji: '⚖️', theme: 'neutral_navy', desc: '公司治理 · 知识产权 · 争议解决', demo: true },
    { id: 'cloudpivot', name: '云枢 CloudPivot', industry: 'SaaS 产品', emoji: '☁️', theme: 'neutral_cloud', desc: '研发协作中枢 · 自动化工作流', demo: true },
    { id: 'shiguang-photo', name: '拾光摄影', industry: '摄影工作室', emoji: '📷', theme: 'mist', desc: '自然光纪实 · 婚礼 · 家庭写真', demo: true }
  ]
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('✓ manifest.json (5 个案例)');
