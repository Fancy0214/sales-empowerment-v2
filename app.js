// ==================== 全局数据 ====================

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
        color: "#4F46E5",
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

// 院校数据
const universities = [
    { id: 1, name: "哈佛大学", country: "美国", rank: 1, major: "商科", acceptance: "3.2%", fee: 75000, logo: "H", color: "#A50034", programs: ["MBA", "法学博士", "医学博士"], requirements: "GPA 3.8+, TOEFL 110+, GMAT 730+, 需要2年以上工作经验" },
    { id: 2, name: "斯坦福大学", country: "美国", rank: 3, major: "理工", acceptance: "4%", fee: 74000, logo: "S", color: "#8C1515", programs: ["计算机科学", "电子工程", "MBA"], requirements: "GPA 3.7+, TOEFL 110+, GRE 325+, 强烈建议有研究经历" },
    { id: 3, name: "牛津大学", country: "英国", rank: 4, major: "文科", acceptance: "17%", fee: 45000, logo: "O", color: "#002147", programs: ["PPE", "法学", "医学", "人文学科"], requirements: "985/211均分85+, 双非均分90+, IELTS 7.5+" },
    { id: 4, name: "剑桥大学", country: "英国", rank: 5, major: "理工", acceptance: "21%", fee: 48000, logo: "C", color: "#A3C1AD", programs: ["自然科学", "工程", "数学", "MBA"], requirements: "985/211均分85+, IELTS 7.0+, 部分专业需STEP成绩" },
    { id: 5, name: "墨尔本大学", country: "澳洲", rank: 33, major: "商科", acceptance: "70%", fee: 45000, logo: "M", color: "#00A651", programs: ["商科", "工程", "医学", "法学"], requirements: "985/211均分75+, 双非均分80+, IELTS 6.5+" },
    { id: 6, name: "悉尼大学", country: "澳洲", rank: 41, major: "商科", acceptance: "60%", fee: 48000, logo: "US", color: "#003DA5", programs: ["商科", "建筑", "医学", "艺术"], requirements: "均分75+, IELTS 6.5+, 会计硕士需要相关背景" },
    { id: 7, name: "多伦多大学", country: "加拿大", rank: 21, major: "理工", acceptance: "43%", fee: 58000, logo: "UT", color: "#002A5C", programs: ["工程", "计算机", "商科", "生命科学"], requirements: "GPA 3.5+, IELTS 7.0+, 部分专业需要GRE/GMAT" },
    { id: 8, name: "新加坡国立大学", country: "新加坡", rank: 11, major: "理工", acceptance: "25%", fee: 42000, logo: "NUS", color: "#003D7C", programs: ["计算机", "工程", "商科", "公共政策"], requirements: "985/211均分80+, IELTS 6.5+, 商科需要GMAT" },
    { id: 9, name: "香港大学", country: "香港", rank: 22, major: "商科", acceptance: "20%", fee: 35000, logo: "HKU", color: "#1D4E89", programs: ["商科", "法学", "医学", "建筑"], requirements: "985/211均分82+, IELTS 6.5+, 商科需要GMAT" },
    { id: 10, name: "帝国理工学院", country: "英国", rank: 6, major: "理工", acceptance: "14%", fee: 50000, logo: "IC", color: "#003C71", programs: ["计算机", "电子工程", "机械工程", "医学"], requirements: "985/211均分85+, IELTS 7.0+, 需要Strong学术背景" },
    { id: 11, name: "耶鲁大学", country: "美国", rank: 16, major: "文科", acceptance: "4.5%", fee: 72000, logo: "Y", color: "#00356B", programs: ["法学博士", "MBA", "艺术", "人文学科"], requirements: "GPA 3.8+, TOEFL 110+, 需要LSAT/GRE" },
    { id: 12, name: "MIT", country: "美国", rank: 2, major: "理工", acceptance: "3%", fee: 73000, logo: "MIT", color: "#A31F34", programs: ["计算机科学", "电子工程", "机械工程", "MBA"], requirements: "GPA 3.9+, TOEFL 110+, GRE 330+, 科研经历必备" }
];

// 话术数据
const scripts = [
    { id: 1, category: "opening", title: "初次电话开场", scene: "首次接到客户来电", content: "您好，我是XX留学的张老师，请问您是想了解出国留学的哪个国家呢？我们这里有英国、美国、澳洲等主流留学目的地的专业申请服务。", rating: 5, type: "电话开发" },
    { id: 2, category: "opening", title: "微信破冰话术", scene: "添加客户微信后", content: "您好呀！感谢您添加我的微信。我是专门负责XX国家留学申请规划的张老师，后期有任何留学相关的问题都可以随时问我，我会第一时间为您解答~", rating: 4, type: "微信沟通" },
    { id: 3, category: "discovery", title: "挖掘客户需求", scene: "了解客户基本情况", content: "想先了解一下，您目前是在读什么年级呢？有没有意向的国家和专业方向？这样我可以先给您匹配一些适合的院校方案参考。", rating: 5, type: "需求挖掘" },
    { id: 4, category: "discovery", title: "探询预算范围", scene: "了解客户支付能力", content: "想问一下您对留学预算大概在什么范围呢？因为不同预算能选择的院校层次差异还是比较大的，这样可以帮您更精准地推荐。", rating: 4, type: "需求挖掘" },
    { id: 5, category: "discovery", title: "了解家庭决策链", scene: "确认谁是决策人", content: "留学这个决定是您自己做主，还是会和家人一起商量呢？如果需要家长配合准备材料的话，我们可以把方案做得更完善一些。", rating: 3, type: "需求挖掘" },
    { id: 6, category: "objection", title: "应对"我再考虑考虑"", scene: "客户犹豫不决", content: "完全理解您的顾虑，留学确实是一个重大的决定。不过我建议我们可以先做一个免费的留学评估，看看您目前的情况适合申请哪些学校，这样您在做决定时也会有更多依据。", rating: 5, type: "异议处理" },
    { id: 7, category: "objection", title: "应对"价格太贵了"", scene: "客户嫌价格高", content: "您说得对，我们的价格确实不是市场上最低的。但正是因为我们的专业度和申请成功率，您能申请到的学校层次是完全不同的。比如去年我们XX同学，从XX排名100多名申请到了前30，这其中的差距您可以算算。", rating: 5, type: "异议处理" },
    { id: 8, category: "objection", title: "应对"别家更便宜"", scene: "竞品比价", content: "市面上确实有价格更低的服务，但我建议您关注两点：一是申请成功率，二是服务过程中是否有足够的专业支持。毕竟留学申请只有一次机会，如果因为服务不到位导致申请失败，损失的不仅是金钱，更是时间和机会。", rating: 4, type: "异议处理" },
    { id: 9, category: "objection", title: "应对"想自己申请"", scene: "客户想DIY", content: "自己申请当然是可以的，但如果您愿意了解的话，我可以给您一些专业的建议。DIY最大的风险是信息不对称导致选校失误，或者文书不够出色而被好学校拒绝。我们每年处理几百个案例，经验会帮您避很多坑。", rating: 4, type: "异议处理" },
    { id: 10, category: "closing", title: "促单话术-限时优惠", scene: "利用时间紧迫感", content: "我们这个月有一个早鸟优惠活动，现在报名可以节省3000元，而且可以优先安排资深的申请老师。不过这个优惠明天就要截止了，不知道您今天方便把合同签了吗？", rating: 5, type: "促单" },
    { id: 11, category: "closing", title: "促单话术-名额紧张", scene: "利用稀缺性", content: "您看中的这位王老师，他今年只剩下2个名额了，而且已经有多位家长在排队等他了。如果您确定要选择王老师的话，我建议今天就把名额定下来，否则可能会被其他家长抢先。", rating: 5, type: "促单" },
    { id: 12, category: "closing", title: "处理最后犹豫", scene: "签约前最后一次犹豫", content: "我能感觉到您对孩子的教育是非常用心的，其实您现在的顾虑是什么？可以告诉我，我们一起看看能不能解决。我知道做决定需要谨慎，但我相信这个服务是值得您信任的。", rating: 4, type: "促单" },
    { id: 13, category: "closing", title: "直接成交", scene: "客户意向明确", content: "好的，既然您对我们的服务比较认可，那我们现在就把合同签了吧？整个申请流程我们会给您拉一个专属服务群，每一步进展我都会及时同步给您。", rating: 5, type: "促单" },
    { id: 14, category: "followup", title: "签约后维护", scene: "签单后第一天", content: "您好，合同已经收到了，我这边已经建好了您的专属服务群。接下来我们会开始帮您准备申请材料，您先按我们发的清单准备就行，有任何问题随时联系我。", rating: 4, type: "售后维护" },
    { id: 15, category: "followup", title: "节假日祝福", scene: "节日群发", content: "中秋节快到了，祝您和家人节日快乐！感谢您一直以来的信任和支持，我们会继续努力为孩子的留学申请保驾护航~", rating: 3, type: "售后维护" },
    { id: 16, category: "followup", title: "申请成功跟进", scene: "拿到offer后", content: "恭喜您！孩子收到了XX大学的offer！这是孩子努力的成果，也是我们共同努力的回报。接下来我帮您处理offer确认和后续的签证申请事宜。", rating: 5, type: "售后维护" },
    { id: 17, category: "opening", title: "展会邀约", scene: "邀请参加留学展", content: "您好，我们这个周六会举办一场大型留学展会，汇集了英美澳等20多所海外院校的招生官现场咨询。我看您之前有了解过英国留学，这次有很多英国名校参与，想邀请您来看看~", rating: 5, type: "活动邀约" }
];

// 实战案例
const cases = [
    { 
        id: 1, 
        type: "success", 
        level: "hard",
        levelText: "困难",
        title: "三本学生逆袭G5名校", 
        amount: 88000,
        tags: ["低GPA", "逆袭", "英国G5"],
        background: "张同学，三本院校计算机专业，GPA2.8，无雅思成绩，家长预算有限但期望值很高。",
        challenge: "学生GPA严重不足，没有任何有竞争力的标化成绩，而且家长一开始对三本申请G5完全没有信心。",
        strategy: "1. 扬长避短：突出学生在2个省级编程比赛中的获奖经历；2. 文书包装：弱化GPA问题，强调实践能力和学习潜力；3. 精准选校：避开热门CS，选择对GPA要求相对宽松的交叉学科项目；4. 套磁策略：针对目标导师进行定向套磁。",
        result: "成功获得UCL和Edinburgh的offer，最终选择UCL。",
        keyScript: "在文书中我们写道：'虽然我的GPA不具优势，但我在实际项目中投入了500+小时的编程时间...'这种坦诚且有数据支撑的表达方式打动了招生官。"
    },
    { 
        id: 2, 
        type: "success", 
        level: "medium",
        levelText: "中等",
        title: "艺术生跨专业申请商科", 
        amount: 65000,
        tags: ["艺术转商", "跨专业", "美国Top30"],
        background: "李同学，211艺术设计专业，想转商科但无任何商科背景，家长希望申请排名靠前的学校。",
        challenge: "学生缺乏商科基础课程，且对商科方向定位模糊，需要在短时间内补足背景。",
        strategy: "1. 背景提升：安排学生参加2个商赛并获得奖项；2. 实习安排：帮助联系四大会计师事务所寒假实习；3. 精准定位：选择接受跨专业申请的商科项目；4. 文书策略：巧妙地将艺术设计思维与商业创新结合。",
        result: "获得JHU、Northeastern等4所学校的offer，其中JHU是美国Top20名校。",
        keyScript: "我们的PS开头写道：'作为一个设计师，我学会用美学视角理解消费者需求，这正是现代商业世界稀缺的跨界思维...'成功吸引了招生官的注意。"
    },
    { 
        id: 3, 
        type: "fail", 
        level: "hard",
        levelText: "困难",
        title: "高期望值客户流失复盘", 
        amount: 0,
        tags: ["客户流失", "期望值管理", "复盘"],
        background: "王总，企业家，想让孩子读哈佛，明确表示愿意花100万，只要能进去。",
        challenge: "客户期望值极高，孩子成绩中等，但家长坚信钱能解决一切问题，对专业建议听不进去。",
        strategy: "我们尝试了：1. 用历年数据说明录取难度；2. 提出先做背景提升再申请的方案；3. 邀请哈佛校友做分享。但客户最终选择了另一家承诺'保录'的机构。",
        result: "客户流失，签约金额0。最终客户花了60万但只拿到了排名100+学校的offer。",
        keyScript: "复盘总结：在面对极端高期望值客户时，我们应该在第一次沟通时就做好期望值管理，不能为了签单而过度承诺。同时要学会筛选客户。"
    },
    { 
        id: 4, 
        type: "success", 
        level: "medium",
        levelText: "中等",
        title: "大龄学生MBA申请", 
        amount: 72000,
        tags: ["大龄MBA", "美国名校", "职业转型"],
        background: "张先生，32岁，8年工作经验，私企高管，想通过MBA实现职业转型。",
        challenge: "年龄偏大，离开学术环境已久，GMAT备考时间有限。",
        strategy: "1. 精准定位：选择偏好有工作经验的Executive MBA项目；2. 扬长避短：强调8年管理经验和对行业的深刻理解；3. 面试辅导：进行多轮模拟面试，针对职业转型故事线反复打磨。",
        result: "获得Emory和UCLA的offer，最终选择Emory，全奖覆盖60%学费。",
        keyScript: "在面试中我们教他这样说：'我的年龄不是劣势，而是我能为课堂带来真实商业经验的优势...'这种逆向思维获得了招生委员会的认可。"
    },
    { 
        id: 5, 
        type: "success", 
        level: "hard",
        levelText: "困难",
        title: "DIY失败后紧急补救", 
        amount: 48000,
        tags: ["DIY失败", "紧急申请", "澳洲八大"],
        background: "陈同学，自己DIY申请英国和澳洲，4月份了还没拿到任何offer，家长非常着急。",
        challenge: "申请季末期才来找我们，文书质量差，选校定位失误，没有面试准备。",
        strategy: "1. 紧急评估：2天内完成所有材料的紧急润色；2. 加申策略：增加澳洲八大保底项目；3. 面试提速：集中3天高强度面试培训；4. argue信：针对被拒项目发送argue信。",
        result: "两周内收到悉尼大学、墨尔本大学等3所学校的offer。",
        keyScript: "我们发送的argue信写道：'我们相信之前的信息不足以展示学生的全部潜力，以下是补充的材料...'最终说服学校重新考虑。"
    }
];

// 5A模型工具
const tools5A = {
    name: "5A销售模型",
    content: `
【5A客户行为模型详解】

一、Awareness - 认知阶段
• 客户行为：通过广告、朋友推荐、搜索等方式初次接触留学信息
• 销售任务：建立品牌认知，提供有价值的内容
• 关键指标：曝光量、点击率

二、Appeal - 吸引阶段  
• 客户行为：对留学产生兴趣，开始搜集信息
• 销售任务：提供专业的留学资讯，建立专业形象
• 关键指标：内容参与度、留资率

三/Ask - 询问阶段
• 客户行为：主动咨询，表达初步需求
• 销售任务：深入了解需求，建立信任关系
• 关键指标：咨询转化率、首次响应时间

四、Act - 行动阶段
• 客户行为：参与活动、签约、付款
• 销售任务：促成交易，提供超预期服务
• 关键指标：签约率、客单价

五、Advocate - 推荐阶段
• 客户行为：满意后主动推荐给他人
• 销售任务：创造惊喜，培养忠实客户
• 关键指标：转介绍率、NPS评分

【各阶段话术示例】

Awareness阶段：
"您好，我是XX留学的顾问，看到您最近浏览了我们网站关于英国留学的文章..."

Appeal阶段：
"根据您的情况，我为您整理了一份个性化的留学方案，包含3所冲刺、2所适中和1所保底院校..."

Ask阶段：
"想更详细了解一下，您目前是本科在读还是已经毕业？语言成绩准备到哪个阶段了？"

Act阶段：
"这个优惠名额我们本周只有5个，现在签约可以享受早鸟价格..."

Advocate阶段：
"感谢您的信任！如果身边有朋友也在考虑留学，可以推荐他们找我，会有专属优惠~"
    `
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
    document.getElementById('dateTime').textContent = now.toLocaleDateString('zh-CN', options);
}

// 导航切换
function switchPage(pageName) {
    // 移除所有active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 添加active
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    // 移动端收起侧边栏
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').style.display = 'none';
    }
}

// ==================== AI话术工坊功能 ====================

document.getElementById('generateScript').addEventListener('click', function() {
    const industry = document.getElementById('clientIndustry').value;
    const stage = document.getElementById('clientStage').value;
    const painPoint = document.getElementById('painPoint').value;
    
    // 模拟AI生成
    const resultDiv = document.querySelector('#scriptResult');
    const sections = resultDiv.querySelectorAll('.script-content');
    
    const scripts = {
        opening: `您好，我是XX留学的${industry}行业专属顾问。我们专门为${industry}从业者的子女提供留学规划服务。我注意到您提到${painPoint}，这个情况我们有很多成功案例可以分享。`,
        discovery: `我想先了解一下几个关键信息：
1. 孩子目前是在哪个阶段？（初中/高中/本科）
2. 之前有没有参加过什么竞赛或项目活动？
3. 您对留学国家有没有初步的想法？
4. 预算范围大概是多少？

这些信息能帮助我更精准地为您匹配适合的院校方案。`,
        objection: `我能理解您的顾虑。${painPoint}确实是很多家长都会担心的问题。我们做过很多类似情况的案例，比如张先生的孩子也是${industry}背景，最后成功申请到了${stage === '意向' ? '伦敦大学学院' : stage === '选校' ? '爱丁堡大学' : '曼彻斯特大学'}。

关键是要找准定位+扬长避短，我们可以先做一个免费的留学评估，看看具体的情况。`,
        closing: `好的，我觉得我们的方案非常适合您。根据您提供的情况，我建议选择"名校冲刺计划"，包含：
• 3所冲刺院校（世界Top50）
• 2所适中院校（Top100）
• 1所保底院校

这个月报名可以享受早鸟优惠，还能优先安排资深顾问服务。如果您确定的话，我们可以先把合同签了，启动申请流程。`
    };
    
    sections[0].textContent = scripts.opening;
    sections[1].textContent = scripts.discovery;
    sections[2].textContent = scripts.objection;
    sections[3].textContent = scripts.closing;
    
    // 添加动画效果
    resultDiv.style.animation = 'none';
    resultDiv.offsetHeight;
    resultDiv.style.animation = 'fadeIn 0.5s ease';
});

function copyScript() {
    const sections = document.querySelectorAll('.script-content');
    let text = '';
    const titles = ['开场白', '需求挖掘', '痛点回应', '促单话术'];
    
    sections.forEach((section, index) => {
        text += `${titles[index]}：\n${section.textContent}\n\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('话术已复制到剪贴板！');
    });
}

function favoriteScript() {
    alert('已收藏到个人话术库！');
}

// ==================== 竞品情报站功能 ====================

function filterCompetitors() {
    const country = document.getElementById('filterCountry').value;
    const product = document.getElementById('filterProduct').value;
    const rows = document.querySelectorAll('#competitorTable tbody tr');
    
    rows.forEach(row => {
        const rowCountry = row.dataset.country;
        const rowProduct = row.dataset.product;
        
        const countryMatch = country === 'all' || rowCountry === country;
        const productMatch = product === 'all' || rowProduct === product;
        
        if (countryMatch && productMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function exportData() {
    alert('数据导出功能：正在生成Excel报告...\n\n包含：\n• 竞品列表\n• 评分对比\n• 优劣势分析\n\n文件将下载至您的设备。');
}

function viewDetail(id) {
    const details = {
        xdf: { name: '新东方前途出国', info: '新东方旗下留学品牌，国内规模最大、资源最丰富的留学服务机构之一。' },
        qide: { name: '启德教育', info: '专注留学25年，澳洲留学领域领先优势明显。' },
        zmn: { name: '啄木鸟教育', info: '专注美国留学申请，以高录取率著称。' },
        idp: { name: 'IDP诺思留学', info: '英国院校官方合作机构，澳洲IDP旗下品牌。' },
        aoji: { name: '澳际教育', info: '专注澳洲留学，性价比高，服务稳定。' }
    };
    
    const detail = details[id];
    if (detail) {
        alert(`${detail.name}\n\n${detail.info}`);
    }
}

// ==================== 院校数据库功能 ====================

function renderUniversities() {
    const grid = document.getElementById('universityGrid');
    grid.innerHTML = '';
    
    universities.forEach(uni => {
        const card = document.createElement('div');
        card.className = 'uni-card';
        card.onclick = () => showUniDetail(uni);
        
        card.innerHTML = `
            <div class="uni-header" style="background: linear-gradient(135deg, ${uni.color} 0%, ${uni.color}88 100%);">
                <div class="uni-logo" style="color: ${uni.color};">${uni.logo}</div>
                <span class="uni-rank">QS #${uni.rank}</span>
            </div>
            <div class="uni-body">
                <h4 class="uni-name">${uni.name}</h4>
                <p class="uni-country"><i class="fas fa-globe"></i> ${uni.country}</p>
                <div class="uni-stats">
                    <div class="uni-stat">
                        <div class="uni-stat-value">${uni.acceptance}</div>
                        <div class="uni-stat-label">录取率</div>
                    </div>
                    <div class="uni-stat">
                        <div class="uni-stat-value">$${uni.fee/1000}K</div>
                        <div class="uni-stat-label">年费用</div>
                    </div>
                </div>
                <div class="uni-tags">
                    <span class="uni-tag">${uni.major}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function showUniDetail(uni) {
    const modal = document.getElementById('uniModal');
    const body = document.getElementById('uniModalBody');
    
    body.innerHTML = `
        <div class="uni-header" style="background: linear-gradient(135deg, ${uni.color} 0%, ${uni.color}88 100%); padding: 40px; text-align: center;">
            <div class="uni-logo" style="color: ${uni.color}; width: 80px; height: 80px; font-size: 2rem; margin: 0 auto;">${uni.logo}</div>
            <h2 style="color: white; margin-top: 16px;">${uni.name}</h2>
            <p style="color: rgba(255,255,255,0.9);">QS世界大学排名 #${uni.rank} · ${uni.country}</p>
        </div>
        <div style="padding: 24px;">
            <div class="detail-section">
                <h4><i class="fas fa-graduation-cap"></i> 热门专业</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                    ${uni.programs.map(p => `<span class="tag tag-primary">${p}</span>`).join('')}
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> 录取要求</h4>
                <p>${uni.requirements}</p>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-chart-bar"></i> 申请数据</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="stat-card">
                        <div class="stat-value">${uni.acceptance}</div>
                        <div class="stat-label">录取率</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${(uni.fee/1000).toFixed(0)}K</div>
                        <div class="stat-label">年费用(美元)</div>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 24px;">
                <button class="btn btn-primary" onclick="alert('请添加顾问微信获取详细申请方案')">
                    <i class="fas fa-star"></i> 获取专属申请方案
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function filterUniversities() {
    const country = document.getElementById('filterUniCountry').value;
    const rank = document.getElementById('filterRank').value;
    const major = document.getElementById('filterMajor').value;
    
    let filtered = universities;
    
    if (country !== 'all') {
        filtered = filtered.filter(u => u.country === country);
    }
    
    if (rank !== 'all') {
        if (rank === 'top10') filtered = filtered.filter(u => u.rank <= 10);
        else if (rank === 'top50') filtered = filtered.filter(u => u.rank > 10 && u.rank <= 50);
        else if (rank === 'top100') filtered = filtered.filter(u => u.rank > 50 && u.rank <= 100);
        else filtered = filtered.filter(u => u.rank > 100);
    }
    
    if (major !== 'all') {
        filtered = filtered.filter(u => u.major === major);
    }
    
    const grid = document.getElementById('universityGrid');
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-secondary);">暂无符合条件的院校</p>';
        return;
    }
    
    filtered.forEach(uni => {
        const card = document.createElement('div');
        card.className = 'uni-card';
        card.onclick = () => showUniDetail(uni);
        
        card.innerHTML = `
            <div class="uni-header" style="background: linear-gradient(135deg, ${uni.color} 0%, ${uni.color}88 100%);">
                <div class="uni-logo" style="color: ${uni.color};">${uni.logo}</div>
                <span class="uni-rank">QS #${uni.rank}</span>
            </div>
            <div class="uni-body">
                <h4 class="uni-name">${uni.name}</h4>
                <p class="uni-country"><i class="fas fa-globe"></i> ${uni.country}</p>
                <div class="uni-stats">
                    <div class="uni-stat">
                        <div class="uni-stat-value">${uni.acceptance}</div>
                        <div class="uni-stat-label">录取率</div>
                    </div>
                    <div class="uni-stat">
                        <div class="uni-stat-value">$${uni.fee/1000}K</div>
                        <div class="uni-stat-label">年费用</div>
                    </div>
                </div>
                <div class="uni-tags">
                    <span class="uni-tag">${uni.major}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ==================== 客户漏斗功能 ====================

const stageCustomers = {
    1: [
        { name: '陈小明', source: '官网表单', status: 'hot' },
        { name: '王小红', source: '百度推广', status: 'warm' },
        { name: '李伟', source: '朋友推荐', status: 'cold' }
    ],
    2: [
        { name: '张华', source: '微信咨询', status: 'hot' },
        { name: '刘芳', source: '电话咨询', status: 'warm' }
    ],
    3: [
        { name: '赵磊', source: '老客户介绍', status: 'hot' },
        { name: '周婷', source: '展会留资', status: 'warm' }
    ],
    4: [
        { name: '孙强', source: '方案评估', status: 'hot' }
    ],
    5: [
        { name: '吴静', source: '价格谈判', status: 'warm' }
    ],
    6: [
        { name: '郑明', source: '已签约', status: 'hot' }
    ]
};

function showStageDetail(stage) {
    const detail = document.getElementById('stageDetail');
    const list = document.getElementById('customerList');
    const hint = detail.querySelector('.hint');
    
    if (hint) hint.style.display = 'none';
    
    const customers = stageCustomers[stage] || [];
    const stageNames = ['', '线索获取', '初次沟通', '需求确认', '方案呈现', '谈判签约', '成交'];
    
    let html = `<p style="margin-bottom: 16px; color: var(--text-secondary);"><strong>${stageNames[stage]}</strong> 阶段客户列表：</p>`;
    
    customers.forEach(c => {
        const statusClass = c.status === 'hot' ? 'status-hot' : c.status === 'warm' ? 'status-warm' : 'status-cold';
        const statusText = c.status === 'hot' ? '高意向' : c.status === 'warm' ? '中意向' : '低意向';
        const initial = c.name.charAt(0);
        
        html += `
            <div class="customer-item">
                <div class="customer-info">
                    <div class="customer-avatar">${initial}</div>
                    <div>
                        <div class="customer-name">${c.name}</div>
                        <div class="customer-source">来源：${c.source}</div>
                    </div>
                </div>
                <span class="customer-status ${statusClass}">${statusText}</span>
            </div>
        `;
    });
    
    list.innerHTML = html;
    
    // 高亮当前阶段
    document.querySelectorAll('.funnel-stage').forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-stage="${stage}"]`).classList.add('active');
}

// ==================== 话术库功能 ====================

function renderScripts(category = 'all') {
    const container = document.getElementById('scriptCards');
    container.innerHTML = '';
    
    let filtered = scripts;
    if (category !== 'all') {
        filtered = scripts.filter(s => s.category === category);
    }
    
    // 搜索过滤
    const searchText = document.getElementById('scriptSearch')?.value.toLowerCase() || '';
    if (searchText) {
        filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(searchText) || 
            s.content.toLowerCase().includes(searchText)
        );
    }
    
    const categoryNames = {
        opening: '开场白',
        discovery: '需求挖掘',
        objection: '异议处理',
        closing: '促单',
        followup: '售后维护'
    };
    
    filtered.forEach(script => {
        const card = document.createElement('div');
        card.className = 'script-card';
        
        let stars = '';
        for (let i = 0; i < script.rating; i++) {
            stars += '★';
        }
        
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
                <button class="btn btn-outline" onclick="copyScriptContent(${script.id})" style="padding: 6px 12px; font-size: 0.8rem;">
                    <i class="fas fa-copy"></i> 复制
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function filterByTag(category) {
    document.querySelectorAll('.script-tags .tag').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
    renderScripts(category);
}

function filterScripts() {
    const category = document.getElementById('scriptCategory').value;
    renderScripts(category);
}

function copyScriptContent(id) {
    const script = scripts.find(s => s.id === id);
    if (script) {
        navigator.clipboard.writeText(script.content).then(() => {
            alert('话术已复制！');
        });
    }
}

// ==================== 销售工具箱功能 ====================

function openTool(toolId) {
    const modal = document.getElementById('toolModal');
    const body = document.getElementById('toolModalBody');
    
    const toolContents = {
        '5a': {
            title: '5A模型工具包',
            icon: 'fa-stream',
            content: tools5A.content
        },
        'persona': {
            title: '客户画像模板',
            icon: 'fa-user',
            content: `
【客户画像采集表】

一、基本信息
□ 姓名：___________
□ 年龄：___________
□ 职业：___________
□ 学历背景：___________

二、家庭情况
□ 家庭年收入：□ 30万以下 □ 30-60万 □ 60-100万 □ 100万以上
□ 父母职业：___________  
□ 家庭结构：□ 独生子女 □ 有兄弟姐妹

三、留学意向
□ 目标国家：□ 美国 □ 英国 □ 澳洲 □ 加拿大 □ 其他
□ 目标层次：□ 高中 □ 本科 □ 硕士 □ 博士
□ 专业方向：□ 商科 □ 理工 □ 文科 □ 艺术 □ 未定
□ 预算范围：___________

四、决策分析
□ 主要决策人：□ 父亲 □ 母亲 □ 学生本人 □ 共同决策
□ 决策周期：□ 1个月内 □ 3个月内 □ 半年内 □ 待定
□ 关注重点：□ 排名 □ 专业 □ 费用 □ 安全 □ 就业

五、关键洞察
□ 客户性格类型：□ 保守型 □ 进取型 □ 随性型
□ 核心需求：___________
□ 潜在顾虑：___________
□ 最佳沟通时间：___________
            `
        },
        'compare': {
            title: '竞品对比分析表',
            icon: 'fa-balance-scale',
            content: `
【竞品对比表模板】

| 对比维度 | 我们 | 竞品A | 竞品B |
|---------|------|-------|-------|
| 品牌知名度 | | | |
| 价格 | | | |
| 服务专业度 | | | |
| 申请成功率 | | | |
| 顾问经验 | | | |
| 院校资源 | | | |
| 文书质量 | | | |
| 后续服务 | | | |
| 退款政策 | | | |
| 用户口碑 | | | |

【使用说明】
1. 定期更新竞品信息
2. 重点突出我们的差异化优势
3. 针对竞品的弱点准备应对话术
            `
        },
        'quote': {
            title: '方案报价模板',
            icon: 'fa-file-invoice-dollar',
            content: `
【留学服务方案报价单】

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

有效期至：___________
            `
        },
        'followup': {
            title: '客户跟进计划表',
            icon: 'fa-calendar-check',
            content: `
【客户跟进计划表】

客户姓名：___________
签约日期：___________
目标院校：___________

| 日期 | 跟进内容 | 状态 | 下一步行动 |
|------|---------|------|----------|
| | | | |
| | | | |
| | | | |
| | | | |

【跟进频次建议】
• 签约后第1周：建立信任，了解客户详细背景
• 申请准备期：每周跟进1-2次材料准备进度
• 提交申请后：每2周跟进申请状态
• 等待Offer期：每月跟进1次，保持联系
• Offer收到后：及时跟进确认和后续安排
• 签证完成后：转入售后维护阶段

【关键节点提醒】
□ 雅思/托福考试日期
□ 材料提交截止日
□ Offer回复截止日
□ 押金缴纳截止日
□ 签证申请截止日
            `
        },
        'report': {
            title: '周报模板',
            icon: 'fa-chart-pie',
            content: `
【销售周报】

姓名：___________    部门：___________    周期：____年__月__日-__日

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

签字：___________  主管签字：___________
            `
        }
    };
    
    const tool = toolContents[toolId];
    
    body.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
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
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`ennea-${tab}`).classList.add('active');
    document.querySelector(`[onclick="showEnneaTab('${tab}')"]`).classList.add('active');
}

// 九型测试
const testQuestions = [
    { q: "你在工作中的典型状态是？", a: ["积极主动，追求成果", "乐于助人，关注他人"], b: [3, 2] },
    { q: "面对压力时，你通常会？", a: ["制定计划，按步执行", "寻求他人支持和建议"], b: [1, 2] },
    { q: "你最看重他人的什么特质？", a: ["能力和成就", "真诚和善意"], b: [3, 4] },
    { q: "做决定时，你更依赖？", a: ["逻辑分析", "直觉感受"], b: [5, 4] },
    { q: "你对未来的态度是？", a: ["规划周全，风险可控", "充满期待，拥抱变化"], b: [6, 7] },
    { q: "团队合作中，你扮演的角色是？", a: ["领导者，掌控全局", "协调者，促进和谐"], b: [8, 9] },
    { q: "面对批评时，你会？", a: ["理性分析，有则改之", "情感受伤，需要安慰"], b: [1, 4] },
    { q: "你的生活方式更接近？", a: ["规律有序，高效执行", "灵活自由，随性而为"], b: [1, 7] },
    { q: "最终你在乎的是？", a: ["正确的事和成功", "关系的和谐与被爱"], b: [1, 2] }
];

let currentQuestion = 0;
let scores = {};

function initTest() {
    currentQuestion = 0;
    scores = {};
    document.getElementById('testResult').style.display = 'none';
    document.getElementById('testContainer').style.display = 'block';
    renderQuestion();
}

function renderQuestion() {
    const q = testQuestions[currentQuestion];
    document.getElementById('currentQ').textContent = currentQuestion + 1;
    document.getElementById('testProgress').style.width = ((currentQuestion + 1) / testQuestions.length * 100) + '%';
    document.getElementById('testQuestion').textContent = q.q;
    
    document.getElementById('testOptions').innerHTML = `
        <button class="option-btn" onclick="answerQuestion(0)">${q.a}</button>
        <button class="option-btn" onclick="answerQuestion(1)">${q.b[0] === q.b[1] ? q.a.split('，')[1] : '更倾向于后者'}</button>
    `;
}

function answerQuestion(option) {
    const q = testQuestions[currentQuestion];
    const type = q.b[option];
    scores[type] = (scores[type] || 0) + 1;
    
    currentQuestion++;
    
    if (currentQuestion < testQuestions.length) {
        renderQuestion();
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
    for (let type in scores) {
        if (scores[type] > maxScore) {
            maxScore = scores[type];
            resultType = parseInt(type);
        }
    }
    
    const type = enneagramTypes[resultType];
    
    resultDiv.innerHTML = `
        <div class="result-type">${resultType}号 - ${type.name}</div>
        <p style="font-size: 1.2rem; margin-bottom: 16px;">${type.subtitle}</p>
        <div style="text-align: left; max-width: 500px; margin: 0 auto; background: var(--bg-primary); padding: 24px; border-radius: 12px;">
            <p style="margin-bottom: 12px;"><strong>🎯 核心特征：</strong>${type.focus}</p>
            <p style="margin-bottom: 12px;"><strong>⚡ 动力来源：</strong>${type.motivation}</p>
            <p style="margin-bottom: 12px;"><strong>💪 销售优势：</strong>${type.strengths}</p>
            <p><strong>⚠️ 注意事项：</strong>${type.weakness}</p>
        </div>
        <button class="btn btn-primary" style="margin-top: 24px;" onclick="initTest()">
            <i class="fas fa-redo"></i> 重新测试
        </button>
    `;
}

// 团队搭配
let selectedTeam = [];

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
        <h4 style="margin-bottom: 12px;"><i class="fas fa-lightbulb"></i> 搭配建议</h4>
        <p><strong>组合成员：</strong>${names}</p>
        <p style="margin-top: 12px;"><strong>分析：</strong>${adviceText}</p>
        <div style="margin-top: 16px; padding: 16px; background: var(--bg-primary); border-radius: 8px;">
            <strong>团队分工建议：</strong>
            <ul style="margin-top: 8px; padding-left: 20px;">
                <li>由${enneagramTypes[selectedTeam[0]].name}负责客户开发和初步跟进</li>
                <li>由${enneagramTypes[selectedTeam[1]].name}负责方案呈现和促成签约</li>
                <li>如有需要，可邀请${Object.keys(scores)[0]}型顾问提供专业支持</li>
            </ul>
        </div>
    `;
}

// ==================== 实战案例功能 ====================

function renderCases() {
    const grid = document.getElementById('caseGrid');
    grid.innerHTML = '';
    
    cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.onclick = () => showCaseDetail(c);
        
        let stars = '';
        for (let i = 0; i < c.level; i++) {
            stars += '★';
        }
        
        card.innerHTML = `
            <div class="case-header">
                <div class="case-type">${c.type === 'success' ? '✓ 成功案例' : '✗ 失败复盘'}</div>
                <div class="case-title">${c.title}</div>
            </div>
            <div class="case-body">
                <div class="case-tags">
                    ${c.tags.map(t => `<span class="case-tag">${t}</span>`).join('')}
                </div>
                <div class="case-meta">
                    <span class="case-amount">${c.amount > 0 ? '¥' + c.amount.toLocaleString() : '未签约'}</span>
                    <span class="case-stars">${stars}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function showCaseDetail(c) {
    const modal = document.getElementById('caseModal');
    const body = document.getElementById('caseModalBody');
    
    body.innerHTML = `
        <div class="case-header" style="padding: 24px;">
            <div class="case-type">${c.type === 'success' ? '✓ 成功案例' : '✗ 失败复盘'} · 难度${c.levelText}</div>
            <div class="case-title" style="font-size: 1.3rem;">${c.title}</div>
        </div>
        <div style="padding: 24px;">
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> 客户背景</h4>
                <p>${c.background}</p>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-exclamation-circle"></i> 核心挑战</h4>
                <p>${c.challenge}</p>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-chess"></i> 应对策略</h4>
                <p>${c.strategy}</p>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-trophy"></i> 最终结果</h4>
                <p>${c.result}</p>
            </div>
            <div class="quote-block">
                <strong>💡 关键话术：</strong><br>
                ${c.keyScript}
            </div>
            ${c.amount > 0 ? `<div style="text-align: center; margin-top: 24px;"><span style="font-size: 1.5rem; font-weight: 700; color: var(--success);">¥${c.amount.toLocaleString()}</span><br><small>签约金额</small></div>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

function filterCases() {
    const type = document.getElementById('caseType').value;
    const level = document.getElementById('caseLevel').value;
    const search = document.getElementById('caseSearch').value.toLowerCase();
    
    let filtered = cases;
    
    if (type !== 'all') {
        filtered = filtered.filter(c => c.type === type);
    }
    
    if (level !== 'all') {
        const levelMap = { easy: 1, medium: 2, hard: 3 };
        filtered = filtered.filter(c => c.level === levelMap[level]);
    }
    
    if (search) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(search) || 
            c.tags.some(t => t.toLowerCase().includes(search))
        );
    }
    
    const grid = document.getElementById('caseGrid');
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-secondary);">暂无符合条件的案例</p>';
        return;
    }
    
    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.onclick = () => showCaseDetail(c);
        
        let stars = '';
        for (let i = 0; i < c.level; i++) {
            stars += '★';
        }
        
        card.innerHTML = `
            <div class="case-header">
                <div class="case-type">${c.type === 'success' ? '✓ 成功案例' : '✗ 失败复盘'}</div>
                <div class="case-title">${c.title}</div>
            </div>
            <div class="case-body">
                <div class="case-tags">
                    ${c.tags.map(t => `<span class="case-tag">${t}</span>`).join('')}
                </div>
                <div class="case-meta">
                    <span class="case-amount">${c.amount > 0 ? '¥' + c.amount.toLocaleString() : '未签约'}</span>
                    <span class="case-stars">${stars}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ==================== 弹窗功能 ====================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 点击弹窗外部关闭
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

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
    
    // 快速入口点击
    document.querySelectorAll('.quick-card').forEach(card => {
        card.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
    
    // 初始化各模块
    renderUniversities();
    renderScripts();
    renderEnneagramCards();
    renderCases();
    
    // 九型测试初始化
    initTest();
    
    // 团队按钮点击
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            this.classList.toggle('selected');
            
            if (this.classList.contains('selected')) {
                if (!selectedTeam.includes(type)) {
                    selectedTeam.push(type);
                }
            } else {
                selectedTeam = selectedTeam.filter(t => t !== type);
            }
            
            // 更新已选显示
            const container = document.getElementById('selectedMembers');
            container.innerHTML = selectedTeam.map(t => 
                `<span class="member-chip">${t}号 - ${enneagramTypes[t].name}</span>`
            ).join('');
        });
    });
    
    // 移动端菜单按钮
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.style.cssText = 'position: fixed; top: 70px; left: 10px; z-index: 1001; background: white; border: none; padding: 10px; border-radius: 8px; display: none; cursor: pointer;';
    
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
        document.querySelector('.sidebar').style.display = 'none';
    }
    
    menuToggle.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar.style.display === 'none') {
            sidebar.style.display = 'block';
        } else {
            sidebar.style.display = 'none';
        }
    });
    
    document.body.appendChild(menuToggle);
    
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
            document.querySelector('.sidebar').style.display = 'block';
        }
    });
});

// 页面可见性变化时刷新时间
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateDateTime();
    }
});
