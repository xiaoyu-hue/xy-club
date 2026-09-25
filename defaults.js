// XY俱乐部官网 · 默认内容数据（后台保存后写入 data/db.json）
// 说明：这是可复用的俱乐部官网模板 —— 所有内容均由这份数据驱动，
// 修改本文件（或在后台「导入配置」）即可把整套官网复用到另一个俱乐部。
const DEFAULT_DB = {
  settings: {
    siteName: 'XY俱乐部',
    logoEmoji: '💎',
    slogan: '有趣的人，都在这里',
    theme: 'aurora',                       // 主题：aurora 极光紫 / ocean 深海蓝 / mist 晨雾白 / sunset 落日金
    heroBadge: '✨ 24小时在线 · 温柔陪伴 · 官方正品 ✨',
    heroTitle: '遇见有趣的人|从这里开始',
    heroSubtitle: '游戏陪玩 · 陪聊树洞 · 受气包服务 —— 你掌心的一方小世界，接住每一个不开心的瞬间。',
    heroStats: '5000+开心客户,50+星级陪玩官,24h在线陪伴,98%好评率',
    announcement: '新客专享：9.9 元体验单 · 15 分钟任意项目；老客户 / 连单享受 8.8 折',
    wechat: 'XYCLUB-666',
    qq: '',
    phone: '',
    email: '',
    qrImage: '',
    qrNote: '添加客服微信，备注【官网】享新客礼',
    serviceTime: '全天 24 小时接单 · 深夜时段（23:00–8:00）正常服务',
    footer: 'XY俱乐部 · 有趣的人，都在这里\n线上纯语音 / 文字服务 · 不线下 · 不露脸 · 未成年人请勿消费',
    adminPassword: 'xy888888'
  },
  sections: [
    {
      id: 's-features',
      type: 'cards',
      icon: '✨',
      title: '我们的优势',
      subtitle: '为什么选择我们',
      visible: true,
      items: [
        { icon: '🌟', title: '星级陪玩官', desc: '每位陪玩官均通过试单考核，声音好听、技术在线、情商超高' },
        { icon: '⚡', title: '极速响应', desc: '全天 24 小时接单，最快 1 分钟为你匹配专属陪伴' },
        { icon: '🔒', title: '隐私安全', desc: '全程线上服务，严格保护双方隐私，聊天记录绝不外泄' },
        { icon: '💝', title: '售后保障', desc: '服务不满意可联系客服协调，让每一次消费都安心' }
      ]
    },
    {
      id: 's-game',
      type: 'services',
      icon: '🎮',
      title: '游戏陪玩',
      subtitle: '上分开黑 · 快乐加倍',
      tip: '',
      visible: true,
      items: [
        { name: '普通娱乐陪玩', price: '19.9-29.9', unit: '元/小时', desc: '闲聊娱乐局，气氛拉满' },
        { name: '技术陪玩 / 上分车', price: '29.9-49.9', unit: '元/小时', desc: '实力带飞，稳稳上分' },
        { name: '按局计费（普通局）', price: '9.9-15', unit: '元/局', desc: '轻松来一局，随时开' },
        { name: '按局计费（包赢局）', price: '15-25', unit: '元/局', desc: '包赢局，赢了再走' },
        { name: '通宵陪玩（8小时）', price: '99-168', unit: '元/晚', desc: '整夜陪伴，性价比之选' },
        { name: '连麦开黑（纯语音）', price: '15-25', unit: '元/小时', desc: '纯语音连麦，配合默契' }
      ]
    },
    {
      id: 's-chat',
      type: 'services',
      icon: '💬',
      title: '陪聊服务',
      subtitle: '你的心事，我们好好听着',
      tip: '',
      visible: true,
      items: [
        { name: '文字陪聊', price: '9.9-15', unit: '元/小时', desc: '打字聊天，随心畅聊' },
        { name: '语音陪聊（连麦）', price: '15-29.9', unit: '元/小时', desc: '声音治愈，越聊越上头' },
        { name: '哄睡 / 晚安电话', price: '19.9-39.9', unit: '元/小时', desc: '温柔哄睡，一觉到天亮' },
        { name: '情感树洞 / 倾诉倾听', price: '15-25', unit: '元/小时', desc: '认真倾听，绝不评判' },
        { name: '早叫晚安提醒（包周）', price: '19.9-39.9', unit: '元/周', desc: '每天准时叫醒 / 道晚安' },
        { name: '假装情侣（语音·按天）', price: '66-99', unit: '元/天', desc: '一天心动体验，甜度自选' }
      ]
    },
    {
      id: 's-vent',
      type: 'services',
      icon: '😤',
      title: '受气包服务',
      subtitle: '情绪垃圾桶 · 只接骂不还嘴',
      tip: '只挨骂不还嘴，骂完负责哄好，绝不放心上',
      visible: true,
      items: [
        { name: '文字挨骂（听完安慰你）', price: '9.9-19.9', unit: '元/半小时', desc: '随便骂，骂完温柔安慰' },
        { name: '语音受气包（听你发泄）', price: '19.9-39.9', unit: '元/小时', desc: '在线接骂，全程认错' },
        { name: '发泄 + 事后哄好安抚', price: '29.9-59.9', unit: '元/小时', desc: '先发泄再哄好，一条龙' },
        { name: '定制吐槽（按剧本配合）', price: '19.9-49.9', unit: '元/次', desc: '按你的剧本来，整活专用' },
        { name: '假装吵架再和好（整活）', price: '52-99', unit: '元/次', desc: '朋友整蛊 / 短视频素材' }
      ]
    },
    {
      id: 's-package',
      type: 'services',
      icon: '📦',
      title: '超值套餐',
      subtitle: '买得越多 · 省得越多',
      tip: '',
      visible: true,
      items: [
        { name: '体验单 · 15分钟任意项目', price: '9.9', unit: '元', desc: '新人专享，先体验后决定' },
        { name: '畅聊包夜 23:00–7:00', price: '128-198', unit: '元/晚', desc: '一整晚的贴心陪伴' },
        { name: '周陪伴卡 · 每天1小时任选', price: '99-199', unit: '元/周', desc: '天天有约，项目任换' },
        { name: '全能随心卡 · 混选10小时', price: '199', unit: '元起', desc: '多项目随心混搭，超值' }
      ]
    },
    {
      id: 's-reviews',
      type: 'testimonials',
      icon: '💖',
      title: '客户好评',
      subtitle: '来自大家的真实反馈',
      visible: true,
      items: [
        { emoji: '🌙', who: '小星星', rating: 5, text: '哄睡电话真的太治愈了，声音温柔到骨子里，失眠星人的救星！' },
        { emoji: '🏆', who: '荣耀王者·哥', rating: 5, text: '技术大哥带我一晚上从白银上到铂金，稳！' },
        { emoji: '😄', who: '今天也要开心鸭', rating: 5, text: '受气包服务绝了，骂完还温柔哄我，情绪价值直接拉满哈哈哈' },
        { emoji: '🫧', who: '匿名的小可爱', rating: 5, text: '文字陪聊的小哥哥超会接话，聊了一小时根本停不下来' }
      ]
    },
    {
      id: 's-notice',
      type: 'notice',
      icon: '📌',
      title: '下单须知',
      subtitle: '',
      visible: true,
      items: [
        { icon: '🕐', text: '深夜时段（23:00–8:00）加收 30%' },
        { icon: '💰', text: '先付款后服务，开始后不退款' },
        { icon: '🚫', text: '不接违法违规内容 · 不露脸 · 不线下' },
        { icon: '🎁', text: '老客户 / 连单享受 8.8 折' }
      ]
    },
    {
      id: 's-faq',
      type: 'faq',
      icon: '❓',
      title: '常见问题',
      subtitle: '下单前先看看这里',
      visible: true,
      items: [
        { q: '如何下单？', a: '添加客服微信（页面底部可一键复制），告诉客服你想选择的项目和时长，付款后即可安排专属陪玩官。' },
        { q: '可以指定陪玩官吗？', a: '可以。下单时告知客服你喜欢的类型（声音 / 技术 / 性格），我们会为你优先安排。' },
        { q: '深夜加收是什么意思？', a: '每日 23:00 至次日 8:00 为深夜时段，所有项目加收 30%，感谢深夜依然在线陪伴的陪玩官们~' },
        { q: '服务不满意怎么办？', a: '请第一时间联系客服说明情况，我们会根据实际情况为你协调补时或其他补偿方案。' },
        { q: '会泄露我的隐私吗？', a: '俱乐部严格遵守保密原则，全程线上服务，聊天与通话内容绝不外泄，请放心消费。' }
      ]
    },
    {
      id: 's-about',
      type: 'text',
      icon: '💎',
      title: '关于我们',
      subtitle: '',
      visible: true,
      content: 'XY俱乐部是一家专注于「线上陪伴服务」的年轻团队。\n我们相信，每一个有点孤单的瞬间，都值得被认真接住。\n\n在这里，你可以：\n· 找一位技术大佬带你轻松上分\n· 和声音好听的小哥哥小姐姐连麦畅聊\n· 累了倦了，来一通哄睡电话安然入梦\n· 受委屈了，我们的「专业受气包」随时在线接住你的情绪\n\n有趣的人，都在这里。'
    }
  ]
};

module.exports = { DEFAULT_DB };
