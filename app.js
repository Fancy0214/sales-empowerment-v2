// ==================== Supabase 配置 ====================
const SUPABASE_URL = 'https://hgtxozgpvccgsvslokud.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9Sc9FFYAqKl2eJUdyP0HmA_w8RdAcKH';
const ADMIN_PASSWORD = 'fancy2024'; // 管理密码，可在首次登录后修改

let supabaseClient = null;
let isAdminMode = false;
let allSubmissions = []; // 管理后台用：所有提交数据
let currentAdminFilter = 'pending';

// 初始化 Supabase 客户端
try {
    supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
} catch(e) {
    console.warn('Supabase 客户端初始化失败:', e);
}

// ==================== 全局数据 ====================

// 竞品数据（本地兜底）
const competitors = [
    {
        name: "HTI",
        fullName: "HTI 留学",
        country: "多国",
        coverage: "英国、美国、澳洲、加拿大、新西兰、欧洲、亚洲",
        product: "多国",
        isB2B: false,
        strongRegion: "江浙沪",
        advantage: "前端BD满意度高，强建联型（每周/月当面拜访）；系统强大，offer接受、押金支付DDL有系统提醒可推送邮件至客户；市场活动7-8场/年，5-8个申请可换1个Trip名额",
        disadvantage: "后期服务一般，放假期间找不到人；价格竞争力偏弱",
        commission: "每2个月打款一次；有强大系统支持，佣金展示、结算均可通过系统操作",
        service: "前端BD专业，日常维护到位；后期服务响应慢，假期无人值守",
        score: 7.0,
        radar: { brand: 7, price: 6, service: 8, channel: 7, product: 8, tech: 7 }
    },
    {
        name: "加诚",
        fullName: "加诚博教 CACH",
        country: "北美",
        coverage: "美国、加拿大",
        product: "北美",
        isB2B: false,
        strongRegion: "北京及华北地区",
        advantage: "实时返佣，有系统支持；客户反馈对接老师很负责、配合度好；Trip奖励丰富，15个申请兑1个Trip名额，学生付押金额外获200元出游基金，KPI院校押金500元/人",
        disadvantage: "国别覆盖有限，仅北美方向；市场活动支持相对一般",
        commission: "实时返佣，有系统支持",
        service: "流程相对制式化，但配合度高、对接负责",
        score: 7.3,
        radar: { brand: 7, price: 8, service: 7, channel: 7, product: 7, tech: 7 }
    },
    {
        name: "启德",
        fullName: "启德教育 EIC",
        country: "多国",
        coverage: "英国、美国、加拿大等多国",
        product: "多国",
        isB2B: true,
        strongRegion: "华南、华中、西南",
        advantage: "英国院校代理资源全网最全，能代的都有代理；英国常申院校佣金按最高档90%起步；月度结算；除澳洲外其他国别服务都不错",
        disadvantage: "澳洲方向服务口碑一般；B2B模式可能影响合作方利益分配",
        commission: "佣金高，英国常申院校佣金按最高档90%起步；资源全，英国代理院校大陆市场最全；每月月度结算一次",
        service: "除澳洲外其他国别服务口碑较好",
        score: 8.3,
        radar: { brand: 8, price: 8, service: 8, channel: 8, product: 9, tech: 8 }
    },
    {
        name: "SIUK",
        fullName: "SI-UK 留学",
        country: "英国",
        coverage: "英国、澳洲",
        product: "英国",
        isB2B: false,
        strongRegion: "全国覆盖",
        advantage: "英国重点院校佣金有竞争力（伯明翰11%起、格拉11.5%、QMUL 12%起）；整体服务与行业水平持平",
        disadvantage: "华威、谢菲、GSA没有直代；国别覆盖有限，仅英澳方向",
        commission: "英国重点院校：伯明翰11%起步，格拉11.5%，QMUL 12%起步；华威、谢菲、GSA没有直代",
        service: "整体服务与行业平均水平差不多",
        score: 7.5,
        radar: { brand: 7, price: 8, service: 7, channel: 7, product: 8, tech: 7 }
    }
];

// 竞品动态时间线
const competitorTimeline = [
    { date: "今天", tag: "价格调整", content: "新东方前途出国下调英澳留学服务费用，最高优惠15%", source: "新东方前途出国官网", link: "https://liuxue.xdf.cn" },
    { date: "昨天", tag: "新品发布", content: "启德教育推出「名校保录计划」，承诺申请失败全额退款", source: "启德教育官网", link: "https://www.eic.org.cn" },
    { date: "3天前", tag: "战略合作", content: "IDP诺思与剑桥大学建立官方招生合作通道", source: "IDP教育集团官网", link: "https://www.idp.com" },
    { date: "上周", tag: "营销活动", content: "澳际教育启动「暑期留学嘉年华」，签约即送iPad", source: "澳际教育公众号", link: "https://www.aoji.cn" },
    { date: "上周", tag: "服务升级", content: "啄木鸟教育上线AI智能选校系统，提升选校精准度", source: "啄木鸟教育官网", link: "https://www.zhuomuniao.com" }
];

// 话术库（17条）
const scripts = [
    { id: 1, category: "opening", title: "初次电话开场", scene: "首次接到客户来电", content: "您好，我是XX留学的张老师，请问您是想了解出国留学的哪个国家呢？我们这里有英国、美国、澳洲等主流留学目的地的专业申请服务。", rating: 5, type: "电话开发" },
    { id: 2, category: "opening", title: "微信破冰话术", scene: "添加客户微信后", content: "您好呀！感谢您添加我的微信。我是专门负责XX国家留学申请规划的张老师，后期有任何留学相关的问题都可以随时问我，我会第一时间为您解答~", rating: 4, type: "微信沟通" },
    { id: 3, category: "opening", title: "展会邀约", scene: "邀请参加留学展", content: "您好，我们这个周六会举办一场大型留学展会，汇集了英美澳等20多所海外院校的招生官现场咨询。我看您之前有了解过英国留学，这次有很多英国名校参与，想邀请您来看看~", rating: 5, type: "活动邀约" },
    { id: 4, category: "discovery", title: "挖掘客户需求", scene: "了解客户基本情况", content: "想先了解一下，您目前是在读什么年级呢？有没有意向的国家和专业方向？这样我可以先给您匹配一些适合的院校方案参考。", rating: 5, type: "需求挖掘" },
    { id: 5, category: "discovery", title: "探询预算范围", scene: "了解客户支付能力", content: "想问一下您对留学预算大概在什么范围呢？因为不同预算能选择的院校层次差异还是比较大的，这样可以帮您更精准地推荐。", rating: 4, type: "需求挖掘" },
    { id: 6, category: "discovery", title: "了解家庭决策链", scene: "确认谁是决策人", content: "留学这个决定是您自己做主，还是会和家人一起商量呢？如果需要家长配合准备材料的话，我们可以把方案做得更完善一些。", rating: 4, type: "需求挖掘" },
    { id: 7, category: "objection", title: "应对「我再考虑考虑」", scene: "客户犹豫不决", content: "完全理解您的顾虑，留学确实是一个重大的决定。不过我建议我们可以先做一个免费的留学评估，看看您目前的情况适合申请哪些学校，这样您在做决定时也会有更多依据。", rating: 5, type: "异议处理" },
    { id: 8, category: "objection", title: "应对「价格太贵了」", scene: "客户嫌价格高", content: "您说得对，我们的价格确实不是市场上最低的。但正是因为我们的专业度和申请成功率，您能申请到的学校层次是完全不同的。比如去年我们XX同学，从XX排名100多名申请到了前30，这其中的差距您可以算算。", rating: 5, type: "异议处理" },
    { id: 9, category: "objection", title: "应对「别家更便宜」", scene: "竞品比价", content: "市面上确实有价格更低的服务，但我建议您关注两点：一是申请成功率，二是服务过程中是否有足够的专业支持。毕竟留学申请只有一次机会，如果因为服务不到位导致申请失败，损失的不仅是金钱，更是时间和机会。", rating: 4, type: "异议处理" },
    { id: 10, category: "objection", title: "应对「想自己申请」", scene: "客户想DIY", content: "自己申请当然是可以的，但如果您愿意了解的话，我可以给您一些专业的建议。DIY最大的风险是信息不对称导致选校失误，或者文书不够出色而被好学校拒绝。我们每年处理几百个案例，经验会帮您避很多坑。", rating: 4, type: "异议处理" },
    { id: 11, category: "closing", title: "促单话术-限时优惠", scene: "利用时间紧迫感", content: "我们这个月有一个早鸟优惠活动，现在报名可以节省3000元，而且可以优先安排资深的申请老师。不过这个优惠明天就要截止了，不知道您今天方便把合同签了吗？", rating: 5, type: "促单" },
    { id: 12, category: "closing", title: "促单话术-名额紧张", scene: "利用稀缺性", content: "您看中的这位王老师，他今年只剩下2个名额了，而且已经有多位家长在排队等他了。如果您确定要选择王老师的话，我建议今天就把名额定下来，否则可能会被其他家长抢先。", rating: 5, type: "促单" },
    { id: 13, category: "closing", title: "处理最后犹豫", scene: "签约前最后一次犹豫", content: "我能感觉到您对孩子的教育是非常用心的，其实您现在的顾虑是什么？可以告诉我，我们一起看看能不能解决。我知道做决定需要谨慎，但我相信这个服务是值得您信任的。", rating: 4, type: "促单" },
    { id: 14, category: "closing", title: "直接成交", scene: "客户意向明确", content: "好的，既然您对我们的服务比较认可，那我们现在就把合同签了吧？整个申请流程我们会给您拉一个专属服务群，每一步进展我都会及时同步给您。", rating: 5, type: "促单" },
    { id: 15, category: "followup", title: "签约后维护", scene: "签单后第一天", content: "您好，合同已经收到了，我这边已经建好了您的专属服务群。接下来我们会开始帮您准备申请材料，您先按我们发的清单准备就行，有任何问题随时联系我。", rating: 4, type: "售后维护" },
    { id: 16, category: "followup", title: "节假日祝福", scene: "节日群发", content: "中秋节快到了，祝您和家人节日快乐！感谢您一直以来的信任和支持，我们会继续努力为孩子的留学申请保驾护航~", rating: 3, type: "售后维护" },
    { id: 17, category: "followup", title: "申请成功跟进", scene: "拿到offer后", content: "恭喜您！孩子收到了XX大学的offer！这是孩子努力的成果，也是我们共同努力的回报。接下来我帮您处理offer确认和后续的签证申请事宜。", rating: 5, type: "售后维护" }
];

// 九型人格完整数据
const enneagramTypes = {
    1: {
        name: "完美型",
        subtitle: "改革者",
        focus: "正确、标准、原则",
        fear: "做错事、腐败、不正直",
        joy: "按正确方式做事",
        manage: "规范化、流程化、风险控制",
        motivation: "正确做事、追求卓越",
        color: "#3b5998",
        description: "追求完美，对自己和他人都有高标准。注重细节，喜欢按计划行事。适合需要严谨把关的留学申请环节。",
        strengths: "细致认真、质量把控、原则性强",
        weakness: "过于挑剔、难以授权、易焦虑",
        script: "我们的服务严格按照英国高等教育申请标准执行，每一个环节都有质量检查..."
    },
    2: {
        name: "助人型",
        subtitle: "给予者",
        focus: "他人需求、关系维护",
        fear: "不被需要、不被爱",
        joy: "帮助他人、建立亲密关系",
        manage: "关系维护、情感连接、团队和谐",
        motivation: "被喜欢、被认可",
        color: "#EC4899",
        description: "热心助人，善于建立和维护关系。重视情感连接，能够快速与客户建立信任。",
        strengths: "善于沟通、同理心强、人际关系好",
        weakness: "过度付出、难以拒绝、边界模糊",
        script: "我能理解您作为家长望子成龙的心情，让我来帮您分析最适合孩子的方案..."
    },
    3: {
        name: "成就型",
        subtitle: "实干者",
        focus: "目标、成果、效率",
        fear: "没有成就、被视为失败者",
        joy: "完成任务、获得成功",
        manage: "目标导向、绩效管理、竞争激励",
        motivation: "成功、认可、超越他人",
        color: "#F59E0B",
        description: "目标导向，追求成功和效率。善于制定和执行计划，能够高效完成销售目标。",
        strengths: "执行力强、目标感强、抗压能力好",
        weakness: "过于功利、忽视过程、情绪化",
        script: "根据您的情况，我们制定了三步走方案，确保在三个月内拿到理想offer..."
    },
    4: {
        name: "独特型",
        subtitle: "艺术家",
        focus: "独特性、真实自我、情感深度",
        fear: "没有自我认同、被视为平凡",
        joy: "表达自我、体验深刻情感",
        manage: "个性化服务、差异化竞争、品牌调性",
        motivation: "独特、有意义、与众不同",
        color: "#8B5CF6",
        description: "追求独特和意义，善于发现产品的差异化价值。能够为高端客户定制个性化方案。",
        strengths: "创新思维、艺术感强、洞察力深",
        weakness: "情绪化、理想主义、难以捉摸",
        script: "每个学生都是独一无二的，我们为您定制的方案会和别人完全不同..."
    },
    5: {
        name: "理智型",
        subtitle: "观察者",
        focus: "知识、信息、专业能力",
        fear: "无知、被侵扰、缺乏能力",
        joy: "获取知识、理解事物",
        manage: "专业深度、知识管理、流程优化",
        motivation: "能力、智慧、独立",
        color: "#0EA5E9",
        description: "理性冷静，追求专业知识和深度理解。善于分析数据，能为决策提供有力支持。",
        strengths: "分析能力强、专业知识扎实、独立思考",
        weakness: "社交能力弱、过度理性、脱离实际",
        script: "根据数据分析，英国G5院校的录取率每年约为12%，我们需要有策略地冲击..."
    },
    6: {
        name: "忠诚型",
        subtitle: "怀疑者",
        focus: "安全、信任、责任",
        fear: "失去保障、被伤害、权威背叛",
        joy: "获得安全感、得到支持",
        manage: "风险控制、应急预案、团队稳定",
        motivation: "安全、归属、证明自己",
        color: "#10B981",
        description: "谨慎忠诚，善于识别风险。注重合同和保障条款，能为客户提供安全感。",
        strengths: "风险意识强、忠诚可靠、责任感强",
        weakness: "多疑、过度担忧、优柔寡断",
        script: "我们的合同有明确的退款条款保障，如果申请失败会全额退款，这是我们的承诺..."
    },
    7: {
        name: "活跃型",
        subtitle: "享乐者",
        focus: "可能性、多样性、快乐",
        fear: "被困、错过精彩、痛苦",
        joy: "新奇体验、自由选择",
        manage: "创新项目、市场拓展、品牌传播",
        motivation: "自由、快乐、新体验",
        color: "#F97316",
        description: "乐观积极，充满创意和活力。善于发现机会，能为客户描绘美好愿景。",
        strengths: "创意无限、乐观开朗、资源整合",
        weakness: "执行力弱、承诺过多、难以专注",
        script: "想象一下，两年后您站在剑桥的校园里，这将是一段多么精彩的旅程..."
    },
    8: {
        name: "领袖型",
        subtitle: "保护者",
        focus: "控制、保护、行动",
        fear: "被控制、被伤害、失去掌控",
        joy: "掌握局面、保护他人",
        manage: "决策力、团队领导、战略规划",
        motivation: "保护、掌控、独立",
        color: "#EF4444",
        description: "果断自信，敢于承担。善于谈判和促成交易，能够主导整个销售过程。",
        strengths: "领导力强、决策果断、执行力强",
        weakness: "强势霸道、忽视细节、控制欲强",
        script: "这个价格已经是我们的最优方案，如果今天签约，我可以直接向总部申请额外服务..."
    },
    9: {
        name: "和平型",
        subtitle: "调停者",
        focus: "和谐、内在平静、人际和平",
        fear: "冲突、分离、失去联系",
        joy: "和平、放松、与人共处",
        manage: "协调能力、客户服务、团队凝聚",
        motivation: "和平、归属、避免冲突",
        color: "#6366F1",
        description: "温和有耐心，善于倾听和协调。能够化解客户疑虑，维护长期客户关系。",
        strengths: "耐心倾听、协调能力强、性格温和",
        weakness: "决策缓慢、难以说不、被动消极",
        script: "让我来帮您把所有选项整理清楚，您可以慢慢考虑，我们不着急..."
    }
};

// 九型测试题目
const testQuestions = [
    { q: "你在工作中的典型状态是？", options: ["积极主动，追求成果", "乐于助人，关注他人"], scores: [3, 2] },
    { q: "面对压力时，你通常会？", options: ["制定计划，按步执行", "寻求他人支持和建议"], scores: [1, 2] },
    { q: "你最看重他人的什么特质？", options: ["能力和成就", "真诚和善意"], scores: [3, 4] },
    { q: "做决定时，你更依赖？", options: ["逻辑分析", "直觉感受"], scores: [5, 4] },
    { q: "你对未来的态度是？", options: ["规划周全，风险可控", "充满期待，拥抱变化"], scores: [6, 7] },
    { q: "团队合作中，你扮演的角色是？", options: ["领导者，掌控全局", "协调者，促进和谐"], scores: [8, 9] },
    { q: "面对批评时，你会？", options: ["理性分析，有则改之", "情感受伤，需要安慰"], scores: [1, 4] },
    { q: "你的生活方式更接近？", options: ["规律有序，高效执行", "灵活自由，随性而为"], scores: [1, 7] },
    { q: "最终你在乎的是？", options: ["正确的事和成功", "关系的和谐与被爱"], scores: [1, 2] }
];

// 工具模板内容
const toolContents = {
    '5a': {
        title: '5A模型工具包',
        icon: 'fa-stream',
        content: `【5A客户行为模型详解】

一、Assess 评估
• 目的：全面了解客户现状和需求
• 操作：收集客户背景信息、留学意向、预算等
• 话术："您能先跟我聊聊孩子目前的学习情况吗？"

二、Advise 建议
• 目的：提供专业的留学方案建议
• 操作：根据评估结果，推荐合适的院校和专业
• 话术："根据您孩子的情况，我建议考虑以下几所院校..."

三、Anchor 锚定
• 目的：建立信任感和专业形象
• 操作：展示成功案例、数据支撑
• 话术："去年我们帮助一位情况类似的学生申请到了XX大学..."

四、Act 行动
• 目的：推动客户采取下一步行动
• 操作：明确下一步行动计划，设置时间节点
• 话术："那我们今天先把选校方案确定，您这边这两天确认下？"

五、Affirm 确认
• 目的：确认客户满意度和后续安排
• 操作：总结达成的共识，安排后续跟进
• 话术："好的，那我们今天的收获是...后续我会在...联系您"`
    },
    'persona': {
        title: '客户画像模板',
        icon: 'fa-user',
        content: `【客户画像采集表】

一、基本信息
□ 姓名：___________
□ 年龄：___________
□ 职业：___________
□ 学历背景：___________

二、家庭情况
□ 家庭年收入：□30万以下 □30-60万 □60-100万 □100万以上
□ 父母职业：___________  
□ 家庭结构：□独生子女 □有兄弟姐妹

三、留学意向
□ 目标国家：□美国 □英国 □澳洲 □加拿大 □其他
□ 目标层次：□高中 □本科 □硕士 □博士
□ 专业方向：□商科 □理工 □文科 □艺术 □未定
□ 预算范围：___________

四、决策分析
□ 主要决策人：□父亲 □母亲 □学生本人 □共同决策
□ 决策周期：□1个月内 □3个月内 □半年内 □待定
□ 关注重点：□排名 □专业 □费用 □安全 □就业

五、关键洞察
□ 客户性格类型：□保守型 □进取型 □随性型
□ 核心需求：___________
□ 潜在顾虑：___________
□ 最佳沟通时间：___________`
    },
    'compare': {
        title: '竞品对比分析表',
        icon: 'fa-balance-scale',
        content: `【竞品对比表模板】

| 对比维度   | 我们   | 竞品A  | 竞品B  |
|-----------|-------|-------|-------|
| 品牌知名度 |       |       |       |
| 价格       |       |       |       |
| 服务专业度 |       |       |       |
| 申请成功率 |       |       |       |
| 顾问经验   |       |       |       |
| 院校资源   |       |       |       |
| 文书质量   |       |       |       |
| 后续服务   |       |       |       |
| 退款政策   |       |       |       |
| 用户口碑   |       |       |       |

【使用说明】
1. 定期更新竞品信息
2. 重点突出我们的差异化优势
3. 针对竞品的弱点准备应对话术`
    },
    'quote': {
        title: '方案报价模板',
        icon: 'fa-file-invoice-dollar',
        content: `【留学服务方案报价单】

尊敬的[客户姓名]：

感谢您选择XX留学！根据您的情况，我们为您定制了以下服务方案：

一、方案名称：[冲刺/精品/基础]申请方案

二、服务内容
□ 留学规划咨询（不限次数）
□ 院校选校方案定制
□ 申请材料指导与润色
□ 文书撰写（PS/CV/推荐信）
□ 网申填写与提交
□ 面试培训（如需）
□ Offer选择建议
□ 签证指导
□ 行前准备指导

三、选校方案
冲刺院校（3所）：
1. ___________（QS #___）
2. ___________（QS #___）
3. ___________（QS #___）

适中院校（2所）：
1. ___________（QS #___）
2. ___________（QS #___）

保底院校（1所）：
1. ___________（QS #___）

四、服务费用
基础服务费：RMB ¥_______
加申费用（超出6所）：RMB ¥___/所

五、付款方式
1. 签约首付：50%
2. 拿到Offer：30%
3. 签证完成：20%

六、保障条款
• 若申请失败，全额退款
• 包含无限次文书修改

有效期至：___________`
    },
    'followup': {
        title: '跟进计划表',
        icon: 'fa-calendar-check',
        content: `【客户跟进计划表】

客户姓名：___________  签约日期：___________
目标院校：___________

跟进节奏：

【7天跟进计划】
□ Day 1: 发送服务协议，确认签约
□ Day 2-3: 收集客户基础材料清单
□ Day 4-5: 完成客户背景评估
□ Day 6-7: 初步选校方案讨论

【14天跟进计划】
□ Day 8-10: 确定选校方案
□ Day 11-12: 文书素材收集
□ Day 13-14: 开始撰写PS初稿

【30天跟进计划】
□ Week 3: 文书完成并修改
□ Week 4: 提交申请，等待结果

【关键节点提醒】
□ 雅思/托福考试日期
□ 材料提交截止日
□ Offer回复截止日
□ 押金缴纳截止日
□ 签证申请截止日`
    },
    'report': {
        title: '周报模板',
        icon: 'fa-chart-pie',
        content: `【销售周报】

姓名：___________    部门：___________    
周期：____年__月__日-__日

一、本周数据
• 新增线索：__个
• 有效咨询：__个
• 签约客户：__个
• 签约金额：¥___元
• 转化率：__%

二、重点客户跟进
1. [客户名] - [跟进事项] - [下周计划]
2. [客户名] - [跟进事项] - [下周计划]

三、本周成果
• 成功签约：____
• Offer获取：____
• 客户转介绍：____

四、问题与建议
• 遇到的问题：___________
• 需要支持：___________
• 改进建议：___________

五、下周计划
• 重点跟进客户：___________
• 目标签约：__个
• 重点学习：___________

签字：___________  主管签字：___________`
    }
};

// 话术分类映射
const categoryNames = {
    opening: "开场白",
    discovery: "需求挖掘",
    objection: "异议处理",
    closing: "促单",
    followup: "售后维护"
};

// ==================== 工具函数 ====================

// 更新时间
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const el = document.getElementById('dateTime');
    if (el) el.textContent = now.toLocaleDateString('zh-CN', options);
}

// 导航切换
function switchPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    // 移动端收起侧边栏
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').style.display = 'none';
    }
}

// ==================== 竞品情报站功能 ====================

function renderCompetitors(filtered = null) {
    const data = (filtered || competitors).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
    const tbody = document.getElementById('competitorBody');
    tbody.innerHTML = '';
    
    data.forEach((comp, idx) => {
        // 找到在原始 competitors 数组中的真实索引
        const realIndex = competitors.indexOf(comp);
        const tr = document.createElement('tr');
        const b2bTag = comp.isB2B ? '<span class="tag tag-primary">是</span>' : '<span class="tag tag-secondary">否</span>';
        const scoreBar = `<div class="score-bar"><div class="score-fill" style="width:${comp.score*10}%"></div><span class="score-num">${comp.score}</span></div>`;
        const compId = comp._id || ''; // Supabase 记录 ID
        
        tr.innerHTML = `
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')"><strong>${comp.name}</strong><br><span style="font-size:0.75rem;color:#6B7280">${comp.fullName}</span></td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')">${comp.coverage}</td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')">${b2bTag}</td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')">${comp.strongRegion}</td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')"><span style="color:#10B981">✓</span> ${comp.advantage.substring(0, 50)}...</td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')"><span style="color:#EF4444">✗</span> ${comp.disadvantage.substring(0, 40)}...</td>
            <td style="cursor:pointer" onclick="showCompetitorDetail('${comp.name}')">${scoreBar}</td>
            <td class="action-cell">
                <button class="btn-icon btn-edit" title="编辑" onclick="openEditCompetitor(${realIndex})"><i class="fas fa-pen"></i></button>
                <button class="btn-icon btn-delete" title="删除" onclick="deleteCompetitor(${realIndex})"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==================== 竞品CRUD功能 ====================

function openAddCompetitor() {
    document.getElementById('compEditTitle').innerHTML = '<i class="fas fa-plus-circle"></i> 新增竞品';
    document.getElementById('compEditIndex').value = -1;
    document.getElementById('compEditForm').reset();
    // 重置雷达评分默认值
    ['compRadarBrand','compRadarPrice','compRadarService','compRadarChannel','compRadarProduct','compRadarTech'].forEach(id => {
        document.getElementById(id).value = 7;
    });
    document.getElementById('competitorEditModal').classList.add('active');
}

function openEditCompetitor(index) {
    const comp = competitors[index];
    if (!comp) return;
    
    document.getElementById('compEditTitle').innerHTML = '<i class="fas fa-edit"></i> 编辑竞品 - ' + comp.name;
    document.getElementById('compEditIndex').value = index;
    document.getElementById('compName').value = comp.name;
    document.getElementById('compFullName').value = comp.fullName;
    document.getElementById('compCountry').value = comp.country;
    document.getElementById('compCoverage').value = comp.coverage;
    document.getElementById('compProduct').value = comp.product;
    document.getElementById('compIsB2B').value = String(comp.isB2B);
    document.getElementById('compStrongRegion').value = comp.strongRegion;
    document.getElementById('compScore').value = comp.score;
    document.getElementById('compAdvantage').value = comp.advantage;
    document.getElementById('compDisadvantage').value = comp.disadvantage;
    document.getElementById('compCommission').value = comp.commission;
    document.getElementById('compService').value = comp.service;
    document.getElementById('compRadarBrand').value = comp.radar.brand;
    document.getElementById('compRadarPrice').value = comp.radar.price;
    document.getElementById('compRadarService').value = comp.radar.service;
    document.getElementById('compRadarChannel').value = comp.radar.channel;
    document.getElementById('compRadarProduct').value = comp.radar.product;
    document.getElementById('compRadarTech').value = comp.radar.tech;
    
    document.getElementById('competitorEditModal').classList.add('active');
}

function saveCompetitor(event) {
    event.preventDefault();
    
    const index = parseInt(document.getElementById('compEditIndex').value);
    const compData = {
        name: document.getElementById('compName').value.trim(),
        fullName: document.getElementById('compFullName').value.trim(),
        country: document.getElementById('compCountry').value,
        coverage: document.getElementById('compCoverage').value.trim(),
        product: document.getElementById('compProduct').value,
        isB2B: document.getElementById('compIsB2B').value === 'true',
        strongRegion: document.getElementById('compStrongRegion').value.trim(),
        advantage: document.getElementById('compAdvantage').value.trim(),
        disadvantage: document.getElementById('compDisadvantage').value.trim(),
        commission: document.getElementById('compCommission').value.trim(),
        service: document.getElementById('compService').value.trim(),
        score: parseFloat(document.getElementById('compScore').value) || 7.0,
        radar: {
            brand: parseInt(document.getElementById('compRadarBrand').value) || 7,
            price: parseInt(document.getElementById('compRadarPrice').value) || 7,
            service: parseInt(document.getElementById('compRadarService').value) || 7,
            channel: parseInt(document.getElementById('compRadarChannel').value) || 7,
            product: parseInt(document.getElementById('compRadarProduct').value) || 7,
            tech: parseInt(document.getElementById('compRadarTech').value) || 7
        }
    };
    
    if (index === -1) {
        // 新增 — 写入 Supabase
        if (supabaseClient) {
            const row = {
                ...compData,
                is_b2b: compData.isB2B,
                full_name: compData.fullName,
                strong_region: compData.strongRegion,
                status: 'approved',
                radar: compData.radar
            };
            delete row.isB2B; delete row.fullName; delete row.strongRegion;
            supabaseClient.from('competitor_submissions').insert([row]).then(({error}) => {
                if (error) { console.error('Supabase insert error:', error); }
                loadCompetitorsFromSupabase();
            });
        } else {
            competitors.push(compData);
            renderCompetitors();
        }
    } else {
        // 编辑 — 更新 Supabase
        const comp = competitors[index];
        if (supabaseClient && comp._id) {
            const row = {
                name: compData.name,
                full_name: compData.fullName,
                country: compData.country,
                coverage: compData.coverage,
                product: compData.product,
                is_b2b: compData.isB2B,
                strong_region: compData.strongRegion,
                advantage: compData.advantage,
                disadvantage: compData.disadvantage,
                commission: compData.commission,
                service: compData.service,
                score: compData.score,
                radar: compData.radar
            };
            supabaseClient.from('competitor_submissions').update(row).eq('id', comp._id).then(({error}) => {
                if (error) { console.error('Supabase update error:', error); }
                loadCompetitorsFromSupabase();
            });
        } else {
            competitors[index] = compData;
            renderCompetitors();
            renderRadarChart();
        }
    }
    
    closeModal('competitorEditModal');
}

function deleteCompetitor(index) {
    const comp = competitors[index];
    if (!comp) return;
    
    if (confirm(`确定要删除竞品「${comp.name}」吗？此操作不可撤销。`)) {
        if (supabaseClient && comp._id) {
            supabaseClient.from('competitor_submissions').delete().eq('id', comp._id).then(({error}) => {
                if (error) { console.error('Supabase delete error:', error); }
                loadCompetitorsFromSupabase();
            });
        } else {
            competitors.splice(index, 1);
            renderCompetitors();
            renderRadarChart();
        }
    }
}

function exportCompetitors() {
    // 构建CSV内容
    const headers = ['机构简称', '机构全称', '覆盖国别分类', '具体覆盖', '产品方向', '是否B2B', '优势区域', '综合评分', '核心优势', '主要劣势', '佣金政策', '服务评价', '品牌力', '价格竞争力', '服务能力', '渠道覆盖', '产品力', '技术实力'];
    const rows = competitors.map(c => [
        c.name, c.fullName, c.country, c.coverage, c.product,
        c.isB2B ? '是' : '否', c.strongRegion, c.score,
        '"' + c.advantage.replace(/"/g, '""') + '"',
        '"' + c.disadvantage.replace(/"/g, '""') + '"',
        '"' + c.commission.replace(/"/g, '""') + '"',
        '"' + c.service.replace(/"/g, '""') + '"',
        c.radar.brand, c.radar.price, c.radar.service, c.radar.channel, c.radar.product, c.radar.tech
    ]);
    
    // 添加BOM以支持Excel正确识别中文
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `竞品总览_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// Supabase 数据加载
async function loadCompetitorsFromSupabase() {
    if (!supabaseClient) {
        // 无 Supabase，使用本地兜底数据
        renderCompetitors();
        renderRadarChart();
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('competitor_submissions')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            competitors.length = 0;
            data.forEach(row => {
                competitors.push(supabaseRowToCompetitor(row));
            });
        }
    } catch(e) {
        console.warn('从 Supabase 加载失败，使用本地数据:', e);
    }
    
    renderCompetitors();
    renderRadarChart();
}

// Supabase 行数据转前端竞品对象
function supabaseRowToCompetitor(row) {
    return {
        _id: row.id,
        name: row.name,
        fullName: row.full_name || '',
        country: row.country || '多国',
        coverage: row.coverage || '',
        product: row.product || '多国',
        isB2B: row.is_b2b || false,
        strongRegion: row.strong_region || '',
        advantage: row.advantage || '',
        disadvantage: row.disadvantage || '',
        commission: row.commission || '',
        service: row.service || '',
        score: row.score || 7.0,
        radar: row.radar || { brand:7, price:7, service:7, channel:7, product:7, tech:7 },
        _status: row.status,
        _submitter: row.submitter,
        _source: row.source,
        _createdAt: row.created_at
    };
}

// 前端竞品对象转 Supabase 行数据
function competitorToSupabaseRow(comp) {
    return {
        name: comp.name,
        full_name: comp.fullName,
        country: comp.country,
        coverage: comp.coverage,
        product: comp.product,
        is_b2b: comp.isB2B,
        strong_region: comp.strongRegion,
        advantage: comp.advantage,
        disadvantage: comp.disadvantage,
        commission: comp.commission,
        service: comp.service,
        score: comp.score,
        radar: comp.radar
    };
}

// 保留 localStorage 作为离线备用（已不再主动使用）
function saveCompetitorsLocal() {
    try {
        localStorage.setItem('salesEmpowerment_competitors', JSON.stringify(competitors));
    } catch(e) {
        console.warn('保存到localStorage失败:', e);
    }
}

function loadCompetitorsLocal() {
    try {
        const saved = localStorage.getItem('salesEmpowerment_competitors');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                competitors.length = 0;
                parsed.forEach(c => competitors.push(c));
                return true;
            }
        }
    } catch(e) {
        console.warn('从localStorage加载失败:', e);
    }
    return false;
}

function resetCompetitorsData() {
    if (confirm('确定要重置竞品数据为初始状态吗？所有自定义修改将丢失。')) {
        localStorage.removeItem('salesEmpowerment_competitors');
        loadCompetitorsFromSupabase();
    }
}

function showCompetitorDetail(name) {
    const comp = competitors.find(c => c.name === name);
    if (!comp) return;
    
    const modal = document.getElementById('competitorModal');
    const body = document.getElementById('competitorModalBody');
    
    body.innerHTML = `
        <div class="comp-detail-header">
            <h2>${comp.fullName}</h2>
            <div class="comp-detail-tags">
                <span class="tag tag-info">${comp.coverage}</span>
                ${comp.isB2B ? '<span class="tag tag-primary">B2B模式</span>' : '<span class="tag tag-secondary">纯B2C</span>'}
                <span class="tag tag-secondary">优势区域：${comp.strongRegion}</span>
            </div>
        </div>
        <div class="comp-detail-grid">
            <div class="comp-detail-section">
                <h4><i class="fas fa-trophy" style="color:#10B981"></i> 核心优势</h4>
                <p>${comp.advantage}</p>
            </div>
            <div class="comp-detail-section">
                <h4><i class="fas fa-exclamation-triangle" style="color:#EF4444"></i> 主要劣势</h4>
                <p>${comp.disadvantage}</p>
            </div>
            <div class="comp-detail-section">
                <h4><i class="fas fa-hand-holding-usd" style="color:#F59E0B"></i> 佣金政策</h4>
                <p>${comp.commission}</p>
            </div>
            <div class="comp-detail-section">
                <h4><i class="fas fa-headset" style="color:#4a90d9"></i> 服务评价</h4>
                <p>${comp.service}</p>
            </div>
        </div>
        <div class="comp-detail-radar">
            <h4>能力雷达图</h4>
            <div id="detailRadar"></div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Draw mini radar for this competitor
    setTimeout(() => drawDetailRadar(comp), 100);
}

function drawDetailRadar(comp) {
    const container = document.getElementById('detailRadar');
    if (!container) return;
    
    const r = comp.radar;
    const labels = ['品牌力', '价格竞争力', '服务能力', '渠道覆盖', '产品力', '技术实力'];
    const values = [r.brand, r.price, r.service, r.channel, r.product, r.tech];
    const max = 10;
    
    // Calculate SVG polygon points
    const cx = 150, cy = 150, maxR = 120;
    let points = '';
    values.forEach((v, i) => {
        const angle = (Math.PI * 2 * i / 6) - Math.PI / 2;
        const dist = (v / max) * maxR;
        const x = cx + dist * Math.cos(angle);
        const y = cy + dist * Math.sin(angle);
        points += `${x},${y} `;
    });
    
    // Grid points
    let gridHtml = '';
    for (let level = 2; level <= 10; level += 2) {
        let gridPts = '';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i / 6) - Math.PI / 2;
            const dist = (level / max) * maxR;
            const x = cx + dist * Math.cos(angle);
            const y = cy + dist * Math.sin(angle);
            gridPts += `${x},${y} `;
        }
        gridHtml += `<polygon points="${gridPts}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
    }
    
    // Axis lines and labels
    let axisHtml = '';
    labels.forEach((label, i) => {
        const angle = (Math.PI * 2 * i / 6) - Math.PI / 2;
        const x1 = cx, y1 = cy;
        const x2 = cx + maxR * Math.cos(angle);
        const y2 = cy + maxR * Math.sin(angle);
        const lx = cx + (maxR + 20) * Math.cos(angle);
        const ly = cy + (maxR + 20) * Math.sin(angle);
        axisHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d1d5db" stroke-width="1"/>`;
        axisHtml += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#374151" font-size="11" font-weight="500">${label} ${values[i]}</text>`;
    });
    
    container.innerHTML = `
        <svg viewBox="0 0 300 300" width="300" height="300">
            ${gridHtml}
            ${axisHtml}
            <polygon points="${points}" fill="rgba(74,144,217,0.25)" stroke="#4a90d9" stroke-width="2"/>
        </svg>
    `;
}

function filterCompetitors() {
    const country = document.getElementById('filterCountry').value;
    const product = document.getElementById('filterProduct').value;
    
    let filtered = competitors;
    
    if (country !== 'all') {
        filtered = filtered.filter(c => c.country === country);
    }
    if (product !== 'all') {
        filtered = filtered.filter(c => c.product === product);
    }
    
    renderCompetitors(filtered);
}

function renderRadarChart() {
    const container = document.getElementById('radarContainer');
    if (!container) return;
    
    const labels = ['品牌力', '价格竞争力', '服务能力', '渠道覆盖', '产品力', '技术实力'];
    const sides = labels.length;
    const colors = [
        { fill: 'rgba(74, 144, 217, 0.25)', stroke: '#4a90d9' },
        { fill: 'rgba(16, 185, 129, 0.15)', stroke: '#10B981' },
        { fill: 'rgba(245, 158, 11, 0.15)', stroke: '#F59E0B' },
        { fill: 'rgba(139, 92, 246, 0.15)', stroke: '#8B5CF6' },
        { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444' },
        { fill: 'rgba(236, 72, 153, 0.15)', stroke: '#EC4899' },
        { fill: 'rgba(20, 184, 166, 0.15)', stroke: '#14B8A6' },
        { fill: 'rgba(249, 115, 22, 0.15)', stroke: '#F97316' }
    ];
    const cx = 250, cy = 220, maxR = 160, max = 10;
    
    // Grid
    let gridHtml = '';
    for (let level = 2; level <= 10; level += 2) {
        let pts = '';
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = cx + (level / max) * maxR * Math.cos(angle);
            const y = cy + (level / max) * maxR * Math.sin(angle);
            pts += `${x},${y} `;
        }
        gridHtml += `<polygon points="${pts}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
    }
    
    // Axes and labels
    let axisHtml = '';
    labels.forEach((label, i) => {
        const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
        const x2 = cx + maxR * Math.cos(angle);
        const y2 = cy + maxR * Math.sin(angle);
        const lx = cx + (maxR + 25) * Math.cos(angle);
        const ly = cy + (maxR + 25) * Math.sin(angle);
        axisHtml += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#d1d5db" stroke-width="1"/>`;
        axisHtml += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#374151" font-size="13" font-weight="500">${label}</text>`;
    });
    
    // Competitor polygons
    let polyHtml = '';
    competitors.forEach((comp, idx) => {
        const r = comp.radar;
        const values = [r.brand, r.price, r.service, r.channel, r.product, r.tech];
        let pts = '';
        values.forEach((v, i) => {
            const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = cx + (v / max) * maxR * Math.cos(angle);
            const y = cy + (v / max) * maxR * Math.sin(angle);
            pts += `${x},${y} `;
        });
        const c = colors[idx % colors.length];
        polyHtml += `<polygon points="${pts}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`;
    });
    
    // Legend
    let legendHtml = '<g transform="translate(100, 420)">';
    competitors.forEach((comp, idx) => {
        const xOff = idx * 90;
        legendHtml += `<circle cx="${xOff}" cy="0" r="8" fill="${colors[idx % colors.length].stroke}"/>`;
        legendHtml += `<text x="${xOff + 15}" y="4" fill="#374151" font-size="12">${comp.name}</text>`;
    });
    legendHtml += '</g>';
    
    container.innerHTML = `
        <svg viewBox="0 0 500 460" class="radar-svg">
            ${gridHtml}
            ${axisHtml}
            ${polyHtml}
            ${legendHtml}
        </svg>
    `;
}

function renderTimeline() {
    const container = document.getElementById('competitorTimeline');
    container.innerHTML = '';
    
    competitorTimeline.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        const sourceHtml = item.source ? `<a class="timeline-source" href="${item.link}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> ${item.source}</a>` : '';
        div.innerHTML = `
            <div class="timeline-date">${item.date}</div>
            <div class="timeline-content">
                <span class="timeline-tag">${item.tag}</span>
                <p>${item.content}</p>
                ${sourceHtml}
            </div>
        `;
        container.appendChild(div);
    });
}

// 分享链接生成
function generateShareLink(type) {
    const shareUrl = window.location.href.split('#')[0] + '#share-' + type;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('分享链接已复制到剪贴板！\n\n链接：' + shareUrl);
        });
    } else {
        prompt('请复制以下分享链接：', shareUrl);
    }
}

// 提交反馈（写入 Supabase）
async function submitFeedback(e) {
    e.preventDefault();
    
    const name = document.getElementById('fbName').value.trim();
    const country = document.getElementById('fbCountry').value;
    const product = document.getElementById('fbProduct').value.trim();
    const advantage = document.getElementById('fbAdvantage').value.trim();
    const disadvantage = document.getElementById('fbDisadvantage').value.trim();
    const source = document.getElementById('fbSource').value.trim();
    const submitter = document.getElementById('fbSubmitter').value.trim();
    
    // 显示处理动画
    document.getElementById('competitorFeedbackForm').style.display = 'none';
    document.getElementById('feedbackResult').style.display = 'block';
    document.getElementById('processingAnimation').style.display = 'block';
    document.getElementById('resultContent').style.display = 'none';
    
    // 写入 Supabase
    let success = false;
    let errorMsg = '';
    
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('competitor_submissions')
                .insert([{
                    name: name,
                    country: country === '国内' ? '多国' : country,
                    product: product,
                    advantage: advantage,
                    disadvantage: disadvantage,
                    source: source,
                    submitter: submitter,
                    status: 'pending',
                    score: 7.0,
                    radar: { brand: 7, price: 7, service: 7, channel: 7, product: 7, tech: 7 }
                }])
                .select();
            
            if (error) throw error;
            success = true;
        } catch(err) {
            console.error('提交到 Supabase 失败:', err);
            errorMsg = err.message || '提交失败';
        }
    } else {
        // 无 Supabase，模拟成功
        success = true;
    }
    
    // 显示结果
    document.getElementById('processingAnimation').style.display = 'none';
    document.getElementById('resultContent').style.display = 'block';
    
    if (success) {
        const 整理结果 = `【竞品信息整理结果】

📋 基本信息
• 竞品名称：${name}
• 国家/地区：${country}
• 核心产品：${product}

✅ 优势分析
${advantage}

⚠️ 劣势/机会点
${disadvantage}

📝 信息来源：${source || '未填写'}
👤 提交人：${submitter}

---
系统已将此信息标记为"待审核"状态，管理员审核通过后将更新至竞品数据库。`;
        
        document.getElementById('整理结果Box').textContent = 整理结果;
    } else {
        document.getElementById('整理结果Box').textContent = `提交失败：${errorMsg}\n\n请稍后重试或联系管理员。`;
    }
}

// ==================== AI话术工坊功能 ====================

let currentFramework = 'auto'; // 自动选择沟通模型

function showStudioTab(tab) {
    document.querySelectorAll('.studio-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#page-ai-studio .tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tab}-tab`).classList.add('active');
    document.querySelector(`#page-ai-studio [onclick="showStudioTab('${tab}')"]`).classList.add('active');
}

// 展开/收起我司情况
function toggleCompanyInfo() {
    const wrapper = document.getElementById('companyInfoWrapper');
    const icon = document.getElementById('companyInfoIcon');
    if (wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
        icon.className = 'fas fa-minus-circle collapsible-icon';
    } else {
        wrapper.style.display = 'none';
        icon.className = 'fas fa-plus-circle collapsible-icon';
    }
}

// 九型人格沟通策略映射
const enneagramStrategies = {
    '1号完美型': '用数据、标准和合规性打动；强调我司27年行业规范、佣金透明安全',
    '2号助人型': '强调合作共赢、助力对方学生成长；突出服务口碑和陪伴感',
    '3号成就型': '用结果说话——成功案例、签约数据、效率提升；突出"签约更多学生"',
    '4号独特型': '强调我司差异化优势——专注英国27年的独特定位、人工+AI双线',
    '5号理智型': '提供详实信息、院校名单、佣金结构；给足思考空间，不急于逼单',
    '6号忠诚型': '强调安全感和稳定性——27年历史、佣金安全保障、长期合作案例',
    '7号活跃型': '用新鲜感吸引——AI赋能、创新服务模式；保持节奏轻快有趣',
    '8号领袖型': '尊重对方主导权，提供选择而非指令；突出实力和可靠伙伴形象',
    '9号和平型': '营造轻松氛围，减少压力；强调合作省心、一站式服务'
};

// 根据触达阶段选择沟通模型
function selectModels(reachStage, clientIdentity) {
    const models = [];
    
    // 根据触达阶段选择核心模型
    switch(reachStage) {
        case '首次触达':
            models.push({ name: '30秒电梯法则', desc: '用最短时间传递核心价值主张' });
            models.push({ name: '黄金圈模型', desc: '从Why出发，建立情感共鸣' });
            break;
        case '二次触达':
            models.push({ name: 'FFC赞美法则', desc: '肯定对方优势，建立好感' });
            models.push({ name: '乔哈里视窗', desc: '扩大开放区，建立信任' });
            break;
        case '三次触达':
        case '四次触达':
            models.push({ name: '异议模型', desc: '预判并化解潜在顾虑' });
            models.push({ name: '说服圆环', desc: '多角度论证，逐步推进' });
            break;
        case '需求挖掘':
            models.push({ name: '乔哈里视窗', desc: '通过提问揭示隐藏需求' });
            models.push({ name: 'OELS反馈模型', desc: '观察-解释-评估-建议，精准回应' });
            break;
        case '意向确认阶段':
            models.push({ name: 'RIDE说服模型', desc: '风险-利益-差异-影响，推动决策' });
            models.push({ name: '说服圆环', desc: '循环论证，强化意向' });
            break;
        case '签约阶段':
            models.push({ name: 'RIDE说服模型', desc: '强调不签约风险和签约收益' });
            models.push({ name: '30秒电梯法则', desc: '浓缩核心价值，临门一脚' });
            break;
        case '产出阶段':
            models.push({ name: 'OELS反馈模型', desc: '及时反馈，保障交付质量' });
            models.push({ name: 'FFC赞美法则', desc: '肯定合作成果，强化关系' });
            break;
        case '维护阶段':
            models.push({ name: 'FOSSA情绪模型', desc: '感知情绪，维护长期关系' });
            models.push({ name: '乔哈里视窗', desc: '持续扩大互信区域' });
            break;
        default:
            models.push({ name: '黄金圈模型', desc: '从Why出发，建立共鸣' });
            models.push({ name: '说服圆环', desc: '多角度推进' });
    }
    
    // 决策者额外加RIDE
    if (clientIdentity === '决策者' && !models.find(m => m.name === 'RIDE说服模型')) {
        models.push({ name: 'RIDE说服模型', desc: '决策者关注风险收益比' });
    }
    // 影响者额外加FFC
    if (clientIdentity === '影响者' && !models.find(m => m.name === 'FFC赞美法则')) {
        models.push({ name: 'FFC赞美法则', desc: '影响者需要被认可' });
    }
    
    return models;
}

// 从背景信息中提取九型
function extractEnneagram(background) {
    if (!background) return null;
    const patterns = ['1号','2号','3号','4号','5号','6号','7号','8号','9号',
                      '完美型','助人型','成就型','独特型','理智型','忠诚型','活跃型','领袖型','和平型',
                      '完美主义','助人','成就','独特','理智','忠诚','活跃','领袖','和平'];
    for (const p of patterns) {
        if (background.includes(p)) {
            // 匹配完整九型名称
            for (const key of Object.keys(enneagramStrategies)) {
                if (key.includes(p) || p.includes(key.substring(0,2))) return key;
            }
        }
    }
    return null;
}

function generateScript() {
    const myRole = document.getElementById('myRole').value.trim();
    const companyInfo = document.getElementById('myCompanyInfo')?.value.trim() || '';
    const clientLevel = document.getElementById('clientLevel').value;
    const clientIdentity = document.getElementById('clientIdentity').value;
    const reachStage = document.getElementById('clientReachStage').value;
    const clientBackground = document.getElementById('clientBackground').value.trim();
    const clientNeeds = document.getElementById('clientNeeds').value.trim();
    
    if (!reachStage) {
        alert('请选择触达阶段');
        return;
    }
    
    // 自动选择沟通模型
    const models = selectModels(reachStage, clientIdentity);
    const enneagramType = extractEnneagram(clientBackground);
    const enneagramTip = enneagramType ? enneagramStrategies[enneagramType] : '';
    
    // 构建我司优势摘要
    const companyHighlight = companyInfo 
        ? companyInfo.substring(0, 80) + (companyInfo.length > 80 ? '...' : '')
        : '专注英国留学领域，27年行业经验，佣金安全有保障';
    
    // 根据不同触达阶段生成话术
    let scriptBlocks = [];
    let modelNames = models.map(m => m.name).join(' + ');
    if (enneagramType) modelNames += ' + 九型人格（' + enneagramType + '）';
    
    // === 开场白 ===
    let opening = '';
    if (reachStage === '首次触达') {
        opening = `您好，我是${myRole}，我们专注英国留学领域已经27年了。了解到贵司在${clientBackground ? clientBackground.substring(0,30) : '留学行业'}方面有深厚积累，想跟您聊聊，看看我们能不能帮贵司在英国方向再增加一个可靠的合作伙伴？`;
    } else if (reachStage === '二次触达') {
        opening = `您好，上次跟您沟通后，我整理了一些贵司可能感兴趣的英国院校资源和合作方案。特别是${clientBackground ? '结合贵司主做的方向' : '针对您目前的需求'}，我们有几个亮点想跟您分享一下。`;
    } else if (reachStage === '三次触达' || reachStage === '四次触达') {
        opening = `您好，考虑到之前咱们聊的情况，我这边专门准备了一份针对贵司的合作方案。${clientNeeds ? '关于您提到的' + clientNeeds.substring(0,20) + '这个问题' : '关于合作的一些核心关注点'}，我有了更具体的建议。`;
    } else if (reachStage === '需求挖掘') {
        opening = `您好，想跟您深入了解一下贵司目前在英国方向的业务情况和合作需求，这样我可以更有针对性地匹配我们的资源。`;
    } else if (reachStage === '意向确认阶段') {
        opening = `您好，根据咱们前几次的沟通，我对贵司的需求已经有了比较清晰的了解。现在想跟您确认一下合作方向，看看下一步怎么推进最合适。`;
    } else if (reachStage === '签约阶段') {
        opening = `您好，咱们前期的沟通已经比较充分了，关于合作的具体条款和流程，我想跟您做最后的确认，争取尽快启动。`;
    } else if (reachStage === '产出阶段') {
        opening = `您好，合作启动以来进展如何？我这边想跟进一下目前的产出情况，确保一切顺利。`;
    } else if (reachStage === '维护阶段') {
        opening = `您好，最近业务怎么样？想跟您聊聊后续的服务优化，也了解一下有没有新的需求我们可以支持。`;
    } else {
        opening = `您好，我是${myRole}，我们专注英国留学领域27年，想跟您探讨一下合作机会。`;
    }
    scriptBlocks.push({ title: '开场白', icon: 'fa-bullhorn', content: opening });
    
    // === 需求挖掘/痛点切入 ===
    let discovery = '';
    const levelTips = {
        'A级（头部企业）': '贵司在行业里是标杆，我们非常重视跟头部伙伴的合作',
        'B级（大型企业）': '贵司规模和实力都很有优势，我们希望能成为贵司的长期合作伙伴',
        'C级（中型企业）': '中型机构其实最需要性价比高的合作伙伴，这正是我们的强项',
        'D级（小型企业）': '小而精的团队往往对服务响应速度要求更高，我们正好能满足',
        'E级（个人工作室）': '工作室的优势是灵活，我们的合作模式也很灵活，能配合您的节奏',
        'F级（个人代理）': '个人代理最关心的就是佣金安全和操作便捷，这两点我们都是强项'
    };
    if (clientNeeds) {
        discovery = `关于您提到的"${clientNeeds.substring(0, 40)}"，这在${clientLevel || '留学行业'}里其实是很常见的痛点。${levelTips[clientLevel] || ''}。我们的方案是这样的——`;
    } else {
        discovery = `想了解一下，贵司目前在英国方向最关注的是什么？${clientLevel ? levelTips[clientLevel] + '。' : ''}是院校资源、佣金政策，还是服务响应速度？`;
    }
    scriptBlocks.push({ title: '需求切入', icon: 'fa-search', content: discovery });
    
    // === 核心价值呈现 ===
    let valueProp = '';
    if (clientIdentity === '决策者') {
        valueProp = `从决策角度来看，跟我们合作有三个核心价值：\n1️⃣ 【安全感】27年专注英国，佣金安全有保障，合作方零风险\n2️⃣ 【增量】英国前100代理院校覆盖广（KCL、曼大、华威、格拉斯哥等），爱尔兰TCD也有佣金，帮您扩大可签约院校池\n3️⃣ 【效率】人工+AI双线护航，提升签约入学效率，让您用更少精力签更多学生`;
    } else if (clientIdentity === '影响者') {
        valueProp = `您的专业判断对合作决策很关键，我想从实操层面跟您分享：我们的院校资源覆盖英国前100有开放代理的都可做，操作流程简洁高效，佣金结算透明安全。很多合作方的老师反馈，跟我们对接后英国方向的签约效率明显提升。`;
    } else {
        valueProp = `从实际使用体验来说，我们的系统和服务都是围绕"省心"设计的：院校资源全、佣金安全有保障、人工+AI双线服务响应快。您日常对接学生的时候，英国方向的case基本可以放心交给我们来配合。`;
    }
    scriptBlocks.push({ title: '核心价值呈现', icon: 'fa-gem', content: valueProp });
    
    // === 异议处理 ===
    let objection = '';
    if (reachStage === '签约阶段' || reachStage === '意向确认阶段') {
        objection = `您可能还在考虑几个问题，我逐个回应：\n• "已经有合作机构了" → 完全理解，我们不要求排他，多一个合作伙伴就是多一份保障和资源补充\n• "佣金政策不够灵活" → 我们可以针对贵司体量定制佣金方案，大客户有专项优惠\n• "担心服务质量" → 27年专注英国不是虚的，我们可以先小规模试合作，用结果说话`;
    } else {
        objection = `如果您有任何顾虑，比如担心佣金安全、服务响应速度或院校覆盖范围，我们可以先从一个小case试起。我们很多合作方都是从1-2个学生开始，后来发现确实靠谱，才逐步扩大合作规模的。`;
    }
    scriptBlocks.push({ title: '异议预判与化解', icon: 'fa-shield-alt', content: objection });
    
    // === 促单/下一步 ===
    let closing = '';
    if (reachStage === '签约阶段') {
        closing = `这样，我建议我们本周先把合作框架敲定，下周一正式启动第一个case。我们会安排专人对接，确保整个流程顺畅。您看这个节奏可以吗？`;
    } else if (reachStage === '意向确认阶段') {
        closing = `要不我们约个时间，我把详细的合作方案和院校清单带过去，面对面聊会更高效？您看这周四或周五方便吗？`;
    } else if (reachStage === '维护阶段' || reachStage === '产出阶段') {
        closing = `后续我会定期跟您同步最新院校政策和佣金变化，有任何问题随时联系我。另外我们最近有几个新签约的优质院校，我整理好发给您看看。`;
    } else {
        closing = `不如这样，我把我们最新的英国院校资源清单和佣金政策发给您参考，您先了解一下。有任何问题随时联系我，我们可以约个时间详细聊。`;
    }
    scriptBlocks.push({ title: '促单/下一步', icon: 'fa-handshake', content: closing });
    
    // 九型人格特别提示
    if (enneagramTip) {
        scriptBlocks.push({ title: '九型沟通策略', icon: 'fa-user-circle', content: `检测到客户可能为${enneagramType}：${enneagramTip}\n\n请在实际沟通中注意调整语气和侧重点，让话术更贴合对方性格偏好。` });
    }
    
    // 渲染结果
    let html = `<div class="framework-used">
        <span class="framework-label">智能匹配模型：<strong>${modelNames}</strong></span>
        <span class="framework-sub">触达阶段：${reachStage}${clientIdentity ? ' | 客户身份：' + clientIdentity : ''}${clientLevel ? ' | 客户层级：' + clientLevel : ''}</span>
    </div>`;
    
    scriptBlocks.forEach(block => {
        html += `<div class="script-block">
            <div class="script-block-title"><i class="fas ${block.icon}"></i> ${block.title}</div>
            <div class="script-block-content">${block.content.replace(/\n/g, '<br>')}</div>
        </div>`;
    });
    
    document.getElementById('generatedContent').innerHTML = html;
    document.getElementById('scriptActions').style.display = 'flex';
}

function copyGeneratedScript() {
    const content = document.getElementById('generatedContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        alert('话术已复制！');
    });
}

function favoriteScript() {
    alert('已收藏到个人话术库！');
}

// ==================== 话术库功能 ====================

function renderScripts(category = 'all') {
    const container = document.getElementById('scriptCards');
    container.innerHTML = '';
    
    let filtered = scripts;
    if (category !== 'all') {
        filtered = scripts.filter(s => s.category === category);
    }
    
    const searchTerm = document.getElementById('scriptSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(searchTerm) ||
            s.content.toLowerCase().includes(searchTerm) ||
            s.scene.toLowerCase().includes(searchTerm)
        );
    }
    
    filtered.forEach(script => {
        const card = document.createElement('div');
        card.className = 'script-card';
        card.id = `script-${script.id}`;
        
        let stars = '';
        for (let i = 0; i < script.rating; i++) stars += '★';
        
        card.innerHTML = `
            <div class="script-card-header">
                <div>
                    <div class="script-card-title">${script.title}</div>
                    <div class="script-card-scene">${script.scene}</div>
                </div>
                <div class="script-rating">${stars}</div>
            </div>
            <div class="script-card-content">${script.content}</div>
            <div class="script-card-footer">
                <span class="script-type-tag">${categoryNames[script.category]}</span>
                <button class="expand-btn" onclick="toggleScript(${script.id})">
                    <span class="expand-text">展开</span> <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function toggleScript(id) {
    const card = document.getElementById(`script-${id}`);
    const btn = card.querySelector('.expand-btn');
    const text = btn.querySelector('.expand-text');
    const icon = btn.querySelector('i');
    
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        text.textContent = '展开';
        icon.className = 'fas fa-chevron-down';
    } else {
        card.classList.add('expanded');
        text.textContent = '收起';
        icon.className = 'fas fa-chevron-up';
    }
}

function filterScripts() {
    const activeTag = document.querySelector('.script-tags .tag.active');
    const category = activeTag ? activeTag.dataset.category : 'all';
    renderScripts(category);
}

// ==================== 销售工具箱功能 ====================

function openTool(toolId) {
    const modal = document.getElementById('toolModal');
    const body = document.getElementById('toolModalBody');
    
    const tool = toolContents[toolId];
    
    body.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b5998, #4a90d9); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <i class="fas ${tool.icon}" style="font-size: 1.5rem; color: white;"></i>
            </div>
            <h2>${tool.title}</h2>
        </div>
        <div class="template-box">${tool.content}</div>
        <div style="text-align: center; margin-top: 24px;">
            <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.querySelector('.template-box').textContent).then(() => alert('已复制到剪贴板！'))">
                <i class="fas fa-download"></i> 复制模板
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// ==================== 九型人格功能 ====================

function renderEnneagramCards() {
    const container = document.getElementById('enneagramCards');
    container.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const type = enneagramTypes[i];
        const card = document.createElement('div');
        card.className = 'enneagram-card';
        card.onclick = () => showEnneagramDetail(i);
        
        card.innerHTML = `
            <div class="enneagram-num">${i}</div>
            <div class="enneagram-name">${type.name}</div>
            <div class="enneagram-subtitle">${type.subtitle}</div>
        `;
        
        container.appendChild(card);
    }
}

function showEnneagramDetail(typeNum) {
    const type = enneagramTypes[typeNum];
    const modal = document.getElementById('enneaModal');
    const body = document.getElementById('enneaModalBody');
    
    body.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div class="enneagram-num" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 16px;">${typeNum}</div>
            <h2>${type.name}</h2>
            <p style="color: var(--text-secondary);">${type.subtitle}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-crosshairs"></i> 注意力焦点</h4>
            <p>${type.focus}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-exclamation-triangle"></i> 核心恐惧</h4>
            <p>${type.fear}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-smile"></i> 快乐源泉</h4>
            <p>${type.joy}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-cog"></i> 管理关键词</h4>
            <p>${type.manage}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-bolt"></i> 激发动机</h4>
            <p>${type.motivation}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-user"></i> 性格特点</h4>
            <p>${type.description}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-thumbs-up"></i> 销售优势</h4>
            <p>${type.strengths}</p>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-thumbs-down"></i> 需注意弱点</h4>
            <p>${type.weakness}</p>
        </div>
        
        <div class="quote-block">
            <strong>推荐话术：</strong><br>
            ${type.script}
        </div>
    `;
    
    modal.classList.add('active');
}

function showEnneaTab(tab) {
    document.querySelectorAll('.enneagram-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#page-enneagram .tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`ennea-${tab}`).classList.add('active');
    document.querySelector(`#page-enneagram [onclick="showEnneaTab('${tab}')"]`).classList.add('active');
    
    if (tab === 'test') {
        initTest();
    } else if (tab === 'team') {
        renderTeamButtons();
    }
}

// ==================== 九型测试功能 ====================

let testCurrentQuestion = 0;
let testScores = {};

function initTest() {
    testCurrentQuestion = 0;
    testScores = {};
    document.getElementById('testResult').style.display = 'none';
    document.getElementById('testContainer').style.display = 'block';
    renderTestQuestion();
}

function renderTestQuestion() {
    const q = testQuestions[testCurrentQuestion];
    document.getElementById('currentQ').textContent = testCurrentQuestion + 1;
    document.getElementById('testProgress').style.width = ((testCurrentQuestion + 1) / testQuestions.length * 100) + '%';
    document.getElementById('testQuestion').textContent = q.q;
    
    document.getElementById('testOptions').innerHTML = q.options.map((opt, idx) => `
        <button class="option-btn" onclick="answerTest(${idx})">${opt}</button>
    `).join('');
}

function answerTest(option) {
    const q = testQuestions[testCurrentQuestion];
    const type = q.scores[option];
    testScores[type] = (testScores[type] || 0) + 1;
    
    testCurrentQuestion++;
    
    if (testCurrentQuestion < testQuestions.length) {
        renderTestQuestion();
    } else {
        showTestResult();
    }
}

function showTestResult() {
    document.getElementById('testContainer').style.display = 'none';
    const resultDiv = document.getElementById('testResult');
    resultDiv.style.display = 'block';
    
    // 找出最高分类型
    let maxScore = 0;
    let resultType = 1;
    for (let type in testScores) {
        if (testScores[type] > maxScore) {
            maxScore = testScores[type];
            resultType = parseInt(type);
        }
    }
    
    // 确定翼型（相邻类型中得分较高的）
    const wings = [resultType - 1 || 9, resultType + 1 > 9 ? 1 : resultType + 1];
    let wingType = wings[0];
    if (testScores[wings[1]] > (testScores[wingType] || 0)) {
        wingType = wings[1];
    }
    
    const type = enneagramTypes[resultType];
    
    resultDiv.innerHTML = `
        <div class="result-type">${resultType}号 - ${type.name}</div>
        <p style="font-size: 1.2rem; margin-bottom: 16px; color: var(--text-secondary);">${type.subtitle}</p>
        ${wingType !== resultType ? `<p style="margin-bottom: 20px;"><span class="tag tag-info">翼型：${wingType}号</span></p>` : ''}
        
        <div class="result-detail">
            <p><strong>🎯 核心特征：</strong>${type.focus}</p>
            <p><strong>⚡ 动力来源：</strong>${type.motivation}</p>
            <p><strong>💪 销售优势：</strong>${type.strengths}</p>
            <p><strong>⚠️ 注意事项：</strong>${type.weakness}</p>
        </div>
        
        <div style="margin-top: 24px;">
            <button class="btn btn-secondary" onclick="generateTestShareLink(${resultType}, ${wingType})" style="margin-right: 12px;">
                <i class="fas fa-share-alt"></i> 生成测试分享链接
            </button>
            <button class="btn btn-outline" onclick="initTest()">
                <i class="fas fa-redo"></i> 重新测试
            </button>
        </div>
        
        <p style="margin-top: 20px; font-size: 0.85rem; color: var(--text-secondary);">
            <i class="fas fa-info-circle"></i> 提示：测试结果仅供性格参考，实际销售中需灵活运用
        </p>
    `;
}

function generateTestShareLink(mainType, wingType) {
    const shareUrl = window.location.href.split('#')[0] + '#share-enneagram-test';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`测试分享链接已复制！\n\n链接：${shareUrl}\n\n他人打开此链接可直接进入九型测试页面。`);
        });
    } else {
        prompt('请复制以下分享链接：', shareUrl);
    }
}

// ==================== 团队搭配功能 ====================

let selectedTeam = [];

function renderTeamButtons() {
    const container = document.getElementById('teamSelectGrid');
    container.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'team-btn';
        btn.dataset.type = i;
        btn.textContent = i + '号';
        btn.onclick = () => toggleTeamMember(i);
        container.appendChild(btn);
    }
}

function toggleTeamMember(type) {
    const btn = document.querySelector(`[data-type="${type}"]`);
    btn.classList.toggle('selected');
    
    if (btn.classList.contains('selected')) {
        if (!selectedTeam.includes(type)) {
            selectedTeam.push(type);
        }
    } else {
        selectedTeam = selectedTeam.filter(t => t !== type);
    }
    
    updateSelectedMembers();
}

function updateSelectedMembers() {
    const container = document.getElementById('selectedMembers');
    
    if (selectedTeam.length === 0) {
        container.innerHTML = '<span class="empty-tip">请在下方选择成员</span>';
    } else {
        container.innerHTML = selectedTeam.map(t => 
            `<span class="member-chip">${t}号 - ${enneagramTypes[t].name}</span>`
        ).join('');
    }
}

function generateTeamAdvice() {
    if (selectedTeam.length < 2) {
        alert('请至少选择2位团队成员！');
        return;
    }
    
    const advice = document.getElementById('teamAdvice');
    const names = selectedTeam.map(t => enneagramTypes[t].name).join('、');
    
    const combinations = {
        '1,2': '完美型+助人型组合，注重流程规范的同时强调服务关怀，适合需要严谨审核的留学申请环节。',
        '1,3': '完美型+成就型组合，目标导向且注重质量把控，是签单转化率最高的组合之一。',
        '2,3': '助人型+成就型，善于建立客户关系且执行力强，能快速推进销售进程。',
        '3,6': '成就型+忠诚型，既有冲劲又注重风险控制，是销售团队的黄金搭档。',
        '3,8': '成就型+领袖型组合，最具战斗力的销售搭档，适合挑战高目标。',
        '5,9': '理智型+和平型组合，擅长处理复杂问题和化解客户疑虑，适合售后维护。',
        '6,7': '忠诚型+活跃型，谨慎乐观的组合，既能识别风险又能保持积极心态。',
        '1,9': '完美型+和平型组合，善于发现问题且能协调各方，适合客户关系维护。'
    };
    
    const key = selectedTeam.sort().join(',');
    let adviceText = combinations[key] || '这个组合能够互补互助：' + names + '的组合可以在销售过程中发挥各自优势，形成完整的销售闭环。';
    
    advice.innerHTML = `
        <h4><i class="fas fa-lightbulb"></i> 搭配建议</h4>
        <p><strong>组合成员：</strong>${names}</p>
        <p style="margin-top: 12px;"><strong>分析：</strong>${adviceText}</p>
        <div style="margin-top: 16px; padding: 16px; background: var(--bg-white); border-radius: 8px;">
            <strong>团队分工建议：</strong>
            <ul style="margin-top: 8px; padding-left: 20px;">
                <li>由${enneagramTypes[selectedTeam[0]].name}负责客户开发和初步跟进</li>
                <li>由${enneagramTypes[selectedTeam[1]].name}负责方案呈现和促成签约</li>
                ${selectedTeam.length > 2 ? `<li>由${enneagramTypes[selectedTeam[2]].name}负责售后维护和客户关系</li>` : ''}
            </ul>
        </div>
    `;
}

// ==================== 弹窗功能 ====================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ==================== 分享模式 ====================

function checkShareMode() {
    const hash = window.location.hash;
    
    if (hash === '#share-competitors') {
        // 竞品分享模式
        document.getElementById('shareHeader').style.display = 'flex';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('mainContent').classList.add('share-mode');
        document.getElementById('competitorFilters').style.display = 'none';
        document.getElementById('competitorFeedbackForm').style.display = 'block';
        switchPage('competitors');
    } else if (hash === '#share-enneagram-test') {
        // 九型测试分享模式
        document.getElementById('shareHeader').style.display = 'flex';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('mainContent').classList.add('share-mode');
        switchPage('enneagram');
        showEnneaTab('test');
    } else if (hash === '#admin') {
        // 管理后台模式
        enableAdminMode();
    }
}

function exitShareMode() {
    window.location.href = window.location.href.split('#')[0];
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    // 更新时间
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // 导航点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
    
    // 话术标签点击
    document.querySelectorAll('.script-tags .tag').forEach(tag => {
        tag.addEventListener('click', function() {
            document.querySelectorAll('.script-tags .tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterScripts();
        });
    });
    
    // 初始化数据
    loadCompetitorsFromSupabase();
    renderTimeline();
    renderRadarChart();
    renderScripts();
    renderEnneagramCards();
    
    // 检查分享模式
    checkShareMode();
    
    // 监听hash变化
    window.addEventListener('hashchange', checkShareMode);
    
    // 移动端菜单
    if (window.innerWidth <= 768) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.style.cssText = 'position: fixed; top: 70px; left: 10px; z-index: 1001; background: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; box-shadow: var(--shadow);';
        menuToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
        });
        document.body.appendChild(menuToggle);
    }
});

// 页面可见性变化时刷新时间
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateDateTime();
    }
});


// ==================== 后台管理功能 ====================

// 启用管理后台模式
function enableAdminMode() {
    isAdminMode = true;
    const navItem = document.getElementById('adminNavItem');
    if (navItem) navItem.style.display = 'flex';
    // 检查是否已登录
    if (localStorage.getItem('salesEmpowerment_admin') === 'true') {
        showAdminPanel();
    }
    switchPage('admin');
}

// 管理员登录
function adminLogin() {
    const pwd = document.getElementById('adminPassword').value;
    if (pwd === ADMIN_PASSWORD) {
        localStorage.setItem('salesEmpowerment_admin', 'true');
        showAdminPanel();
    } else {
        alert('密码错误，请重试');
    }
}

// 显示管理面板
function showAdminPanel() {
    document.getElementById('adminLoginCard').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    isAdminMode = true;
    loadAllSubmissions();
}

// 加载所有提交数据
async function loadAllSubmissions() {
    if (!supabaseClient) {
        document.getElementById('adminSubmissionList').innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 数据库未连接，请先完成 Supabase 配置</p>';
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('competitor_submissions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allSubmissions = data || [];
        updateAdminStats();
        renderAdminSubmissions();
    } catch(err) {
        console.error('加载提交数据失败:', err);
        document.getElementById('adminSubmissionList').innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 加载失败: ' + err.message + '</p>';
    }
}

// 更新统计数据
function updateAdminStats() {
    const pending = allSubmissions.filter(s => s.status === 'pending').length;
    const approved = allSubmissions.filter(s => s.status === 'approved').length;
    const rejected = allSubmissions.filter(s => s.status === 'rejected').length;
    
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;
    document.getElementById('badgePending').textContent = pending;
    document.getElementById('badgeApproved').textContent = approved;
    document.getElementById('badgeRejected').textContent = rejected;
}

// 筛选管理标签
function filterAdminSubmissions(status) {
    currentAdminFilter = status;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.admin-tab[data-status="${status}"]`).classList.add('active');
    renderAdminSubmissions();
}

// 渲染管理列表
function renderAdminSubmissions() {
    const container = document.getElementById('adminSubmissionList');
    
    let filtered = allSubmissions;
    if (currentAdminFilter !== 'all') {
        filtered = allSubmissions.filter(s => s.status === currentAdminFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;">暂无数据</p>';
        return;
    }
    
    container.innerHTML = filtered.map(item => {
        const statusBadge = item.status === 'pending' 
            ? '<span class="admin-status pending"><i class="fas fa-clock"></i> 待审核</span>'
            : item.status === 'approved' 
            ? '<span class="admin-status approved"><i class="fas fa-check-circle"></i> 已发布</span>'
            : '<span class="admin-status rejected"><i class="fas fa-times-circle"></i> 已拒绝</span>';
        
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '';
        
        return `
            <div class="admin-submission-card" data-id="${item.id}">
                <div class="admin-card-header">
                    <div>
                        <strong style="font-size:1.1rem;">${item.name}</strong>
                        ${item.full_name ? `<span style="color:#6B7280;margin-left:8px;">${item.full_name}</span>` : ''}
                        ${statusBadge}
                    </div>
                    <div class="admin-card-meta">
                        ${item.submitter ? `<span><i class="fas fa-user"></i> ${item.submitter}</span>` : ''}
                        ${dateStr ? `<span><i class="fas fa-clock"></i> ${dateStr}</span>` : ''}
                    </div>
                </div>
                <div class="admin-card-body">
                    ${item.coverage ? `<p><strong>覆盖：</strong>${item.coverage}</p>` : ''}
                    ${item.advantage ? `<p><span style="color:#10B981">✓ 优势：</span>${item.advantage.substring(0, 80)}${item.advantage.length > 80 ? '...' : ''}</p>` : ''}
                    ${item.disadvantage ? `<p><span style="color:#EF4444">✗ 劣势：</span>${item.disadvantage.substring(0, 80)}${item.disadvantage.length > 80 ? '...' : ''}</p>` : ''}
                    ${item.source ? `<p><strong>来源：</strong>${item.source}</p>` : ''}
                </div>
                <div class="admin-card-actions">
                    ${item.status === 'pending' ? `<button class="btn btn-sm" style="background:#10B981;color:white;" onclick="updateSubmissionStatus('${item.id}','approved')"><i class="fas fa-check"></i> 发布</button>` : ''}
                    ${item.status === 'pending' ? `<button class="btn btn-sm" style="background:#EF4444;color:white;" onclick="updateSubmissionStatus('${item.id}','rejected')"><i class="fas fa-times"></i> 拒绝</button>` : ''}
                    ${item.status === 'rejected' ? `<button class="btn btn-sm" style="background:#10B981;color:white;" onclick="updateSubmissionStatus('${item.id}','approved')"><i class="fas fa-check"></i> 发布</button>` : ''}
                    ${item.status === 'approved' ? `<button class="btn btn-sm" style="background:#F59E0B;color:white;" onclick="updateSubmissionStatus('${item.id}','pending')"><i class="fas fa-undo"></i> 撤回</button>` : ''}
                    <button class="btn btn-outline btn-sm" onclick="openAdminEdit('${item.id}')"><i class="fas fa-pen"></i> 编辑</button>
                    <button class="btn btn-sm" style="background:#EF4444;color:white;" onclick="deleteSubmission('${item.id}')"><i class="fas fa-trash-alt"></i> 删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 更新提交状态
async function updateSubmissionStatus(id, newStatus) {
    if (!supabaseClient) return;
    
    const action = newStatus === 'approved' ? '发布' : newStatus === 'rejected' ? '拒绝' : '撤回';
    if (!confirm(`确定要${action}这条竞品信息吗？`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('competitor_submissions')
            .update({ status: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        // 刷新管理列表和主页面
        await loadAllSubmissions();
        await loadCompetitorsFromSupabase();
    } catch(err) {
        alert('操作失败: ' + err.message);
    }
}

// 删除提交
async function deleteSubmission(id) {
    if (!supabaseClient) return;
    if (!confirm('确定要删除这条竞品信息吗？此操作不可撤销。')) return;
    
    try {
        const { error } = await supabaseClient
            .from('competitor_submissions')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadAllSubmissions();
        await loadCompetitorsFromSupabase();
    } catch(err) {
        alert('删除失败: ' + err.message);
    }
}

// 打开管理编辑弹窗
function openAdminEdit(id) {
    const item = allSubmissions.find(s => s.id === id);
    if (!item) return;
    
    document.getElementById('adminEditTitle').innerHTML = '<i class="fas fa-edit"></i> 编辑竞品 - ' + item.name;
    document.getElementById('adminEditId').value = id;
    document.getElementById('adminCompName').value = item.name || '';
    document.getElementById('adminCompFullName').value = item.full_name || '';
    document.getElementById('adminCompCountry').value = item.country || '多国';
    document.getElementById('adminCompCoverage').value = item.coverage || '';
    document.getElementById('adminCompIsB2B').value = String(item.is_b2b || false);
    document.getElementById('adminCompStrongRegion').value = item.strong_region || '';
    document.getElementById('adminCompScore').value = item.score || 7.0;
    document.getElementById('adminCompAdvantage').value = item.advantage || '';
    document.getElementById('adminCompDisadvantage').value = item.disadvantage || '';
    document.getElementById('adminCompCommission').value = item.commission || '';
    document.getElementById('adminCompService').value = item.service || '';
    
    const radar = item.radar || {};
    document.getElementById('adminRadarBrand').value = radar.brand || 7;
    document.getElementById('adminRadarPrice').value = radar.price || 7;
    document.getElementById('adminRadarService').value = radar.service || 7;
    document.getElementById('adminRadarChannel').value = radar.channel || 7;
    document.getElementById('adminRadarProduct').value = radar.product || 7;
    document.getElementById('adminRadarTech').value = radar.tech || 7;
    
    document.getElementById('adminCompStatus').value = item.status || 'pending';
    
    document.getElementById('adminEditModal').classList.add('active');
}

// 保存管理编辑
async function saveAdminEdit(event) {
    event.preventDefault();
    
    const id = document.getElementById('adminEditId').value;
    if (!id || !supabaseClient) return;
    
    const row = {
        name: document.getElementById('adminCompName').value.trim(),
        full_name: document.getElementById('adminCompFullName').value.trim(),
        country: document.getElementById('adminCompCountry').value,
        coverage: document.getElementById('adminCompCoverage').value.trim(),
        is_b2b: document.getElementById('adminCompIsB2B').value === 'true',
        strong_region: document.getElementById('adminCompStrongRegion').value.trim(),
        score: parseFloat(document.getElementById('adminCompScore').value) || 7.0,
        advantage: document.getElementById('adminCompAdvantage').value.trim(),
        disadvantage: document.getElementById('adminCompDisadvantage').value.trim(),
        commission: document.getElementById('adminCompCommission').value.trim(),
        service: document.getElementById('adminCompService').value.trim(),
        radar: {
            brand: parseInt(document.getElementById('adminRadarBrand').value) || 7,
            price: parseInt(document.getElementById('adminRadarPrice').value) || 7,
            service: parseInt(document.getElementById('adminRadarService').value) || 7,
            channel: parseInt(document.getElementById('adminRadarChannel').value) || 7,
            product: parseInt(document.getElementById('adminRadarProduct').value) || 7,
            tech: parseInt(document.getElementById('adminRadarTech').value) || 7
        },
        status: document.getElementById('adminCompStatus').value
    };
    
    try {
        const { error } = await supabaseClient
            .from('competitor_submissions')
            .update(row)
            .eq('id', id);
        
        if (error) throw error;
        
        closeModal('adminEditModal');
        await loadAllSubmissions();
        await loadCompetitorsFromSupabase();
    } catch(err) {
        alert('保存失败: ' + err.message);
    }
}
