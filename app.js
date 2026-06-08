// ==================== 全局数据 ====================

// 竞品数据
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
    const data = filtered || competitors;
    const tbody = document.getElementById('competitorBody');
    tbody.innerHTML = '';
    
    data.forEach(comp => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => showCompetitorDetail(comp.name);
        const b2bTag = comp.isB2B ? '<span class="tag tag-primary">是</span>' : '<span class="tag tag-secondary">否</span>';
        const scoreBar = `<div class="score-bar"><div class="score-fill" style="width:${comp.score*10}%"></div><span class="score-num">${comp.score}</span></div>`;
        
        tr.innerHTML = `
            <td><strong>${comp.name}</strong><br><span style="font-size:0.75rem;color:#6B7280">${comp.fullName}</span></td>
            <td>${comp.coverage}</td>
            <td>${b2bTag}</td>
            <td>${comp.strongRegion}</td>
            <td><span style="color:#10B981">✓</span> ${comp.advantage.substring(0, 50)}...</td>
            <td><span style="color:#EF4444">✗</span> ${comp.disadvantage.substring(0, 40)}...</td>
            <td>${scoreBar}</td>
        `;
        tbody.appendChild(tr);
    });
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
        { fill: 'rgba(139, 92, 246, 0.15)', stroke: '#8B5CF6' }
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
        const c = colors[idx];
        polyHtml += `<polygon points="${pts}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`;
    });
    
    // Legend
    let legendHtml = '<g transform="translate(100, 420)">';
    competitors.forEach((comp, idx) => {
        const xOff = idx * 90;
        legendHtml += `<circle cx="${xOff}" cy="0" r="8" fill="${colors[idx].stroke}"/>`;
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

// 提交反馈
function submitFeedback(e) {
    e.preventDefault();
    
    const name = document.getElementById('fbName').value;
    const country = document.getElementById('fbCountry').value;
    const product = document.getElementById('fbProduct').value;
    const advantage = document.getElementById('fbAdvantage').value;
    const disadvantage = document.getElementById('fbDisadvantage').value;
    const source = document.getElementById('fbSource').value;
    const submitter = document.getElementById('fbSubmitter').value;
    
    // 显示处理动画
    document.getElementById('competitorFeedbackForm').style.display = 'none';
    document.getElementById('feedbackResult').style.display = 'block';
    document.getElementById('processingAnimation').style.display = 'block';
    document.getElementById('resultContent').style.display = 'none';
    
    // 模拟AI整理
    setTimeout(() => {
        document.getElementById('processingAnimation').style.display = 'none';
        document.getElementById('resultContent').style.display = 'block';
        
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
    }, 2000);
}

// ==================== AI话术工坊功能 ====================

let currentFramework = 'RTF';

function showStudioTab(tab) {
    document.querySelectorAll('.studio-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#page-ai-studio .tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tab}-tab`).classList.add('active');
    document.querySelector(`#page-ai-studio [onclick="showStudioTab('${tab}')"]`).classList.add('active');
}

function selectFramework(framework) {
    currentFramework = framework;
    
    document.querySelectorAll('.framework-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`[data-framework="${framework}"]`).classList.add('active');
    
    // 显示/隐藏对应字段
    document.querySelectorAll('.rtf-field, .race-field, .rise-field').forEach(el => {
        el.style.display = 'none';
    });
    
    if (framework === 'RTF') {
        document.querySelector('.rtf-field').style.display = 'block';
    } else if (framework === 'RACE') {
        document.querySelector('.race-field').style.display = 'block';
    } else if (framework === 'RISE') {
        document.querySelectorAll('.rise-field').forEach(el => el.style.display = 'block');
    }
}

function generateScript() {
    const industry = document.getElementById('clientIndustry').value;
    const stage = document.getElementById('clientStage').value;
    const painPoint = document.getElementById('painPoint').value;
    
    let framework = '';
    if (currentFramework === 'RTF') {
        const format = document.getElementById('outputFormat').value;
        framework = `【使用RTF框架生成】

【角色】留学销售顾问，专为${industry}行业客户提供专业留学规划
【任务】为${stage}阶段客户定制留学话术，解决其痛点：${painPoint || '无'}
【格式】结构化输出，包含开场白、需求挖掘、痛点回应、促单话术`;
    } else if (currentFramework === 'RACE') {
        const context = document.getElementById('contextInfo').value;
        framework = `【使用RACE框架生成】

【角色】资深留学规划顾问
【行动】提供个性化留学方案，解决客户需求
【背景】客户来自${industry}行业，处于${stage}阶段，${context || '需要全面的留学规划'}
【期望】帮助客户明确目标，建立信任，推动决策`;
    } else if (currentFramework === 'RISE') {
        const steps = document.getElementById('stepsReq').value;
        const goal = document.getElementById('endGoal').value;
        framework = `【使用RISE框架生成】

【角色】专业留学销售顾问
【指令】为${industry}行业${stage}客户定制话术
【步骤】${steps || '开场建立信任→需求深度挖掘→方案呈现→异议处理→促成签约'}
【最终目标】${goal || '帮助客户做出留学决策并签约'}`;
    }
    
    const scriptContent = `
【开场白】
"您好，我是XX留学的顾问老师。看到您想了解${stage}阶段的留学规划，很高兴能帮到您。我们团队专门服务${industry}行业的客户，对这类背景的申请有很多成功经验。"

【需求挖掘】
"想先了解一下，您目前是为自己还是为孩子咨询呢？目标国家大概在什么范围？对于专业方向有没有初步的想法？"

【痛点回应】
"您提到${painPoint || '对留学申请流程不太了解'}，这也是很多家长都会遇到的顾虑。我们会用专业的经验帮您把这些不确定性降到最低，确保每一步都有清晰的规划。"

【促单话术】
"我们今天先把您的基本情况做一个免费评估，我会给您一份个性化的方案建议。这个优惠名额本周只剩2个了，您看方便现在确认下吗？"
`;
    
    document.getElementById('generatedContent').innerHTML = `
        <div class="framework-used">
            <span class="framework-label">已使用框架：<strong>${currentFramework}</strong></span>
        </div>
        <div class="script-block">
            <div class="script-block-title"><i class="fas fa-bullhorn"></i> 开场白</div>
            <div class="script-block-content">您好，我是XX留学的顾问老师。看到您想了解${stage}阶段的留学规划，很高兴能帮到您。我们团队专门服务${industry}行业的客户，对这类背景的申请有很多成功经验。</div>
        </div>
        <div class="script-block">
            <div class="script-block-title"><i class="fas fa-search"></i> 需求挖掘</div>
            <div class="script-block-content">想先了解一下，您目前是为自己还是为孩子咨询呢？目标国家大概在什么范围？对于专业方向有没有初步的想法？</div>
        </div>
        <div class="script-block">
            <div class="script-block-title"><i class="fas fa-hand-holding-medical"></i> 痛点回应</div>
            <div class="script-block-content">您提到${painPoint || '对留学申请流程不太了解'}，这也是很多家长都会遇到的顾虑。我们会用专业的经验帮您把这些不确定性降到最低，确保每一步都有清晰的规划。</div>
        </div>
        <div class="script-block">
            <div class="script-block-title"><i class="fas fa-money-bill-wave"></i> 促单话术</div>
            <div class="script-block-content">我们今天先把您的基本情况做一个免费评估，我会给您一份个性化的方案建议。这个优惠名额本周只剩2个了，您看方便现在确认下吗？</div>
        </div>
    `;
    
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
    renderCompetitors();
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
