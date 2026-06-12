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

// 话术库（B2B留学行业实战话术——面向机构老板/销售老师/外联/后期负责人）
const scripts = [
    // === 冷触达 ===
    { id: 1, category: "cold_outreach", title: "打给机构老板-30秒抓住注意力", scene: "首次联系机构负责人/老板", content: "张总您好，我是XX的Lily。今天不打长电话，就想问一句——贵司英国方向的佣金，现在多久结一次？我们这边月结，不少合作方之前都是季度甚至半年才拿到钱，换过来之后现金流松了不少。您要是有兴趣，我发个院校清单和佣金表给您看看？", rating: 5, type: "电话开发" },
    { id: 2, category: "cold_outreach", title: "加外联老师微信-给个实在理由", scene: "展会/活动后加外联老师", content: "李老师好，我是今天展会上跟您聊了几句的Lily。您提到英国这边想找新渠道，我回去查了一下——KCL、曼大、华威、格拉斯哥这些我们都有代理，佣金政策也刚更新。发您看看？不合适也没事，先存着备用。", rating: 5, type: "微信沟通" },
    { id: 3, category: "cold_outreach", title: "冷邮件-三段话讲清楚价值", scene: "邮件首次触达机构决策者", content: "王总好，\n\n简单说三点：\n1. 英国前100有开放代理的院校基本能做——KCL、曼大、华威、格拉斯哥、利兹、南安普顿等，爱尔兰TCD也有佣金\n2. 佣金月结，不用等季度，现金流不压\n3. 人工+AI双线服务，周末节假日也能找到人\n\n先推1-2个case试起，用结果说话。方便约个10分钟电话？\n\nLily", rating: 4, type: "邮件触达" },
    { id: 4, category: "cold_outreach", title: "找到后期负责人-从痛点切入", scene: "联系机构后期/文案主管", content: "赵老师您好，我是XX的Lily。直接问个事——贵司英国方向的case，合作方回复一般要多久？不少后期老师跟我吐槽过周末找不到人、催了没回音。我们这边工作日2小时响应，周末也有人在，要不我先发个服务标准给您参考？", rating: 4, type: "电话开发" },
    { id: 5, category: "cold_outreach", title: "联系销售老师-帮他多签约", scene: "联系机构一线销售顾问", content: "陈老师好，我是XX的Lily。知道一线老师最想要什么——院校要多、佣金要稳、出了问题有人兜。英国方向我们前100有代理的院校基本覆盖，佣金月结不拖欠，周末也能找到人。您要是英国方向有学生想多签几个院校，可以先配合试试。", rating: 4, type: "微信沟通" },

    // === 跟进升温 ===
    { id: 6, category: "warm_follow", title: "二次跟进-带着新资源回来", scene: "首次沟通后3-5天跟进", content: "张总，上次聊完我特意查了一下，您提到的XX院校我们刚好新拿到代理权，佣金比您目前的合作方大概高X个点，月结不变。另外最近又签了几个新院校，我一起发您？您看这周哪天方便聊5分钟？", rating: 5, type: "二次触达" },
    { id: 7, category: "warm_follow", title: "对方说'考虑考虑'-锁定时间", scene: "客户态度模糊", content: "没问题，选合作方确实得慎重。这样，我不催您，但能不能定个时间我再找您？比如下周三？我提前把院校清单、佣金政策和结算方式整理好发您，您看完心里有数，咱们再聊也更有针对性。", rating: 5, type: "跟进升温" },
    { id: 8, category: "warm_follow", title: "对方冷淡-用案例撬开话匣子", scene: "客户兴趣不高", content: "张总，理解您现在合作方可能够用。就问一句——英国方向佣金多久结一次？我们最近帮一家跟贵司体量差不多的机构切过来，光月结这一项，他们现金流就松了不少，院校匹配也更精准。要不我发个案例给您看看？", rating: 4, type: "跟进升温" },
    { id: 9, category: "warm_follow", title: "跟后期老师-从服务体验入手", scene: "上次聊过后期对接体验", content: "赵老师，上次您说后期对接有时候响应慢，我回去确认了一下——我们工作日2小时响应，周末节假日也有人，紧急情况直接打电话。另外申请进度可以实时看，不用反复催。您要不先推一个case试试？", rating: 4, type: "跟进升温" },

    // === 异议拆解（LSCPA实战版） ===
    { id: 10, category: "objection", title: "「我们已经有合作方了」-LSCPA", scene: "最常见的异议", content: "【L-倾听】有稳定合作方，说明合作得不错才会一直做，对吧？\n\n【S-共情】找个靠谱的合作方不容易，稳定合作省很多沟通成本，换我我也不会随便换。\n\n【C-澄清】我不是来抢人的，就想做个行业交流——您和现有合作方，主要看中的是哪块？佣金结算快？服务响应好？还是院校覆盖广？\n\n【P-方案】那还挺契合的，我们主做英国前100有代理的院校，佣金月结、部分可垫付——很多有稳定合作方的伙伴都是和我们搭着做，不要求替换，只是多一个备选。\n\n【A-行动】我把核心优势和院校清单发您一份，您空的时候看看，下周三下午我再跟您轻聊5分钟，同步下行业最新资源，您看可以吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 11, category: "objection", title: "「你们佣金没有XX高」-LSCPA", scene: "老板/销售对佣金敏感", content: "【L-倾听】佣金确实是合作的核心，您比这个很正常。\n\n【S-共情】这一行佣金高低直接挂钩收益，谁都想拿更好的条件，换我我也得算清楚。\n\n【C-澄清】您说的佣金顾虑，主要是比例不够高，还是结算周期太长、资金压太多？这两块解决思路不一样。\n\n【P-方案】我们差异化在这：第一，月结，很多同行季度甚至半年才打款，等于您白垫几个月；第二，部分可以垫付，行业里不多见；第三，签约效率高，同样时间多出几单，总账算下来更划算。\n\n【A-行动】我发一份佣金政策对比表给您，您跟现在条件比比看。下周二我再跟您简单聊聊，行吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 12, category: "objection", title: "「不确定你们服务行不行」-LSCPA", scene: "后期老师/销售质疑服务", content: "【L-倾听】服务质量决定了合作能走多远，您有这个顾虑说明对学生负责。\n\n【S-共情】我听到不少老师吐槽过合作方前期说得好、签约后人就找不着了，这种体验太坑了。\n\n【C-澄清】您之前遇到的问题，主要是响应慢、周末找不到人，还是申请过程沟通不透明？知道具体哪块不放心我才好对症说。\n\n【P-方案】这几个点我们正好都解决了——工作日2小时响应，周末节假日有人；申请进度AI实时同步，不用催；紧急情况24小时电话直达。\n\n【A-行动】您先推1-2个学生试试，感受下响应速度和专业度，体验不好随时停，零风险。您看这周能安排吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 13, category: "objection", title: "「你们能做哪些院校？覆盖够不够？」-LSCPA", scene: "外联/销售关心院校资源", content: "【L-倾听】院校资源是合作的地基，这块不够，别的都白搭。\n\n【S-共情】学生想申的院校做不了，等于白流失客户，这谁遇到都头疼。\n\n【C-澄清】您目前最需要补充的是哪块？是有几个特定学校想做但现有合作方覆盖不了，还是整体英国方向的院校池想扩大？\n\n【P-方案】英国前100有开放代理的院校基本能做——KCL、曼大、布里斯托、华威、格拉斯哥、利兹、南安普顿、杜伦、诺丁汉是主力，爱尔兰TCD也有佣金。有特定院校想做告诉我，我去确认能不能加进来。\n\n【A-行动】我发一份最新院校清单和佣金表，您对照看看有没有缺口。有特别想加的也告诉我，查完给您反馈，可以吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 14, category: "objection", title: "「今年换不了了/明年再说」-LSCPA", scene: "时机异议", content: "【L-倾听】目前确实没有紧迫的切换需求，这很正常。\n\n【S-共情】合作这种事得看时机，不是随便就能动的，我理解。\n\n【C-澄清】想确认一下，是今年确实没计划了，还是想多了解几个选项备着？\n\n【P-方案】即使本年度暂无计划，可以先建立联系。不少合作方一开始只是了解着，等有需求时发现正好能满足，直接就启动了，不用从头筛选。您不需要做任何承诺。\n\n【A-行动】我把院校清单和佣金政策发您存着。另外想确认——如果下一年度贵司有补充或更换合作方的需求，咱们是否有优先洽谈的机会？到时候不用再重新找，您看可以吗？", rating: 4, type: "LSCPA异议处理" },
    { id: 15, category: "objection", title: "「佣金安全吗？会不会跑路？」-LSCPA", scene: "老板/个人代理最关心安全", content: "【L-倾听】佣金安全是合作的底线，您谨慎是对的。\n\n【S-共情】这个行业确实鱼龙混杂，谁都不想遇到佣金拿不到的情况，多留个心眼没毛病。\n\n【C-澄清】您担心的主要是拖欠，还是怕合作方跑路？这两个我都能给您交底。\n\n【P-方案】我们做了27年，佣金安全是底线。月结不拖欠，每个case佣金明细清清楚楚。而且可以从小case开始，跑一单您心里就有数了——现在的大合作方，一开始也是这么试过来的。\n\n【A-行动】我发一份合作流程和佣金结算说明，您看看怎么保障安全的。有问题随时问，可以吗？", rating: 4, type: "LSCPA异议处理" },

    // === 临门促单 ===
    { id: 16, category: "closing", title: "试合作-降低决策门槛", scene: "意向有了但还在犹豫", content: "张总，别想太复杂。先推1-2个英国的学生过来，我们全程跟进——佣金月结、2小时内响应、周末也有人。不用签大协议，一个合作确认函就行。跑通一个case您心里就有数了，这周能安排吗？", rating: 5, type: "临门促单" },
    { id: 17, category: "closing", title: "锚定签约-卡住时间窗口", scene: "对方说好但一直不推进", content: "张总，方向都对齐了，我建议这周就把确认函签了，下周直接开始对接。英国申请窗口就那几个月，早一天多一分优势。而且佣金月结，签约就有进账。您看周四还是周五方便？", rating: 5, type: "临门促单" },
    { id: 18, category: "closing", title: "直面最后顾虑-把话说开", scene: "签约前最后一哆嗦", content: "张总，我能感觉您还有点犹豫——您直说，最担心什么？佣金安全？结算速度？服务响应？还是院校覆盖不够？敞开聊，能解决的我当场给方案，不能解决的我也实话实说。合作最怕有话憋着，后面反而出问题。", rating: 4, type: "临门促单" },

    // === 长期培育 ===
    { id: 19, category: "nurture", title: "首单交付后-趁热扩大", scene: "第一个case出结果后", content: "张总，XX同学的offer下来了，从提交到出结果X天，比市场平均快。趁这个势头，咱们聊聊扩大合作——最近又签了几个新院校，佣金政策也有调整。另外签约量上来之后，佣金档位可以再谈谈，我整理一下发您？", rating: 5, type: "长期培育" },
    { id: 20, category: "nurture", title: "节日问候-带点实在价值", scene: "节日/假期前", content: "张总，中秋快乐！不打扰您过节，就顺嘴提一句：我们刚拿到XX大学2026年最新佣金政策，比去年涨了2个点，月结不变。节后我发您看看？", rating: 4, type: "长期培育" },
    { id: 21, category: "nurture", title: "沉睡客户唤醒-给个新理由", scene: "很久没合作的机构", content: "张总好久不见！英国那边最近几个变化——曼大和利兹2026年新增了几个专业的代理通道，佣金调了，而且我们现在月结+可垫付，之前没有的。您那边英国方向学生量怎么样？有需求的话这次政策窗口值得抓。", rating: 4, type: "长期培育" },
    { id: 22, category: "nurture", title: "续约升级-用数据说话", scene: "试合作期结束", content: "张总，合作这段时间咱们配合得还行吧？跟您说个事——签约量到一定规模，佣金档位可以再优一档，另外配专属对接经理，响应更快，周末也优先处理您的case。您看有没有兴趣升级一下？", rating: 4, type: "长期培育" },
    { id: 23, category: "nurture", title: "给后期老师-持续服务保障", scene: "合作中的后期老师维护", content: "赵老师，最近对接还顺畅吧？跟您同步个事——我们系统升级了，申请进度现在能实时查看，不用等邮件了。另外加了紧急响应通道，突发情况直接打电话，24小时有人接。您用着哪不方便随时跟我说。", rating: 4, type: "长期培育" }
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
    'timeline': {
        title: '留学时间规划',
        icon: 'fa-clock',
        content: `【27Fall英国硕士申请时间线规划】

📌 5月 · 准备阶段
□ 明确留学目标，确定专业和院校范围
□ 了解英国硕士申请要求和时间线
□ 评估自身背景，制定提升计划（均分/语言/实习等）
□ 开始准备语言考试（雅思/托福）

📌 6-7月 · 背景提升阶段
□ 努力提升GPA，保持良好成绩
□ 参加实习/科研/项目，丰富背景经历
□ 继续备考语言，争取出分
□ 梳理个人经历，积累文书素材

📌 8-9月 · 材料准备阶段
□ 确定目标院校和专业，整理申请清单
□ 准备申请材料：个人陈述、简历、推荐信等
□ 如果需要，联系推荐人并确定推荐信
□ 语言考试出分，满足申请要求

📌 10-12月 · 申请递交阶段
□ 陆续递交申请（英国硕士采取滚动录取，建议尽早）
□ 跟进申请状态，补充材料（如有）
□ 关注邮箱，及时查看学校回复
□ 准备面试（如有）

📌 次年1-3月 · 录取与抉择阶段
□ 收到录取通知，比较offer（专业、排名、费用等）
□ 确定最终选择，回复offer并缴纳押金
□ 准备签证材料，预约签证
□ 安排住宿，预订机票

📌 次年4-9月 · 行前准备阶段
□ 办理签证
□ 预订住宿，了解当地生活
□ 准备行李，购买机票
□ 行前准备，开启英国留学之旅！

【顾问使用提示】
• 与客户初次沟通时，对照时间线确认学生当前所处阶段
• 根据阶段判断紧迫度，越靠后的阶段决策越急
• 用时间线帮客户建立"倒计时"感，推动尽快签约
• 对于错过理想节点的学生，强调"现在开始还不晚，但越晚选择越少"`
    },
    'predeparture': {
        title: '留英行前指南',
        icon: 'fa-plane-departure',
        content: `【留英行前指南——从签证到落地全流程】

━━ 一、签证准备 ━━

【肺结核体检】
• 在英停留6个月及以上需提交肺结核体检报告，有效期6个月
• 最晚在签证前3个月内体检，提前3-7个工作日电话预约
• 检测机构：北京、成都、重庆、南京、上海、深圳、西安等15城市设点
  查询：https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china
• 费用550元（不含治疗），需携带：身份证+护照原件、2张白底证件照(3.5×4.5cm)
• 17岁以下需监护人陪同；有胸部手术史/结核病史需带诊断报告
• 结果：合格1-2工作日取证明，存疑需痰培养约2个月

【签证保证金】
• 金额 = 学费 + 9个月生活费 + 额外2000镑
  （生活费最低标准：伦敦1529镑/月，非伦敦1171镑/月）
• 存款要求：签证前连续28天存期，建议开课前3个月提前存好
• 存在大型国有银行（中行/工行/建行/农行），存申请人名下
• 递签前或被抽查时再开存款证明，不要提前开（有时效性）
• 获签前勿动用资金，易致拒签
• 资金在父母名下需：亲属关系证明+资金授权信+翻译件

━━ 二、出行准备 ━━

【机票】
• 先确认学校是否提供接机服务，再订机票
• 建议获签后再订票；提前预订务必查清退改规则
• 起飞时间：晚上起飞最优（抵英为白天，方便安顿）
• 直飞vs转机：直飞舒适但贵且少；转机便宜但时长约20h，转机不超2次
• 转机优选联程机票，免二次托运与过境签
• 留学生可邮件申请航司专属优惠及额外行李额

【出国体检】
• 需办理：小红本（国际旅行健康检查证明书）+ 小黄本（疫苗接种国际证书）
• 入境可能抽查，提前半个月至两个月体检为佳
• 预约：各地国际旅行卫生保健中心公众号或电话，工作日上午8:00-11:00
• 查询卫检单位：http://m.ithc.cn/wjdw
• 携带：身份证+护照原件、4张两寸白底照片、疫苗本（如有）
• 体检需空腹，项目含一般检查/内外科/胸透/心电图/腹部超声/实验室检查
• 持1年以上英国签证+录取通知书可咨询是否免费体检
• 发证：完成后3个工作日下午14:00-17:00领取

【换汇/汇款】
• 换汇前带：护照、签证、录取通知书、身份证
• 购汇流程（中行举例）：手机银行搜"购汇"→选账户/币种(英镑)/现汇→输入金额/用途(境外留学)→确认→验证码
• 随身现金：出境限等值1万美元（超额需携带证），入英超1万欧元须申报
• 电汇：1-5工作日到账，需收款人姓名/开户行/SWIFT CODE，手续费较高
• 汇票：可自行携带出境，丢失可全额挂失，但多数校方偏好线上缴费
• 国际信用卡：父母办主卡，附属卡限额度；境外刷VISA/万事达方便，保管好安全码

【行李清单】
托运行李（20-30kg，28-30寸箱）：
□ 四季衣物、鞋子、内衣袜子
□ 指甲刀套装、针线盒
□ 万用排插2个、英标转换插头多个
□ 迷你电饭煲（可到英后留学生群二手收）、便携餐具、调味品
□ 笔记本、U盘
□ 床上用品、洗漱用品、备用眼镜

随身行李（7-10kg，20寸箱）：
□ 电子产品：相机/手机/耳机/笔记本/充电宝/充电器
□ 证件：护照+2寸彩照8张+国际健康证+疫苗接种证+肺结核报告+eVisa打印件
□ 资金：汇票/银行卡/英镑现金/校方押金收据
□ 学术材料：毕业证+学位证+成绩单原件及翻译件+语言成绩单
□ 住宿：住宿合同/offer+英国详细住址及联系电话
□ 其他：雨伞、冲锋衣、英国电话卡

⚠️ 重要提醒：
• 英国风大雨多，雨伞和冲锋衣必备
• 转换插头多带几个，排插2个够用
• 出发前称重避免超重；超重物品可走空运约800元/次
• 电饭煲可到英后留学生群提前预定二手
• 女性内衣尺码英国最小32A/70A，鞋码女鞋最小36码男鞋40码，均可网购

━━ 三、落地事宜 ━━

【手机通讯】
本地运营商：Three（覆盖广）/ Vodafone（国际通话方便）/ O2 / EE
虚拟运营商：giffgaff / Lebara / Tesco Mobile / Lycamobile（资费便宜、无需审核、信号中等）
中国运营商英国分部：中国电信/中国移动/中国联通
国际拨号：英→中 座机0086+区号(去0)+号码，手机0086+手机号
          中→英 座机0044+区号(去0)+号码，手机0044+手机号(去首位0)
⚠️ 到达学校后第一时间打电话回家报平安！

【办理入住】携带护照、CAS、押金凭证到宿舍办公室/公寓办理

【学校注册】
• 线上：凭校方邮件激活学生系统，完善信息核对课业费用
• 线下：到学生中心领学生证，备好毕业证/学位证/成绩单/护照/CAS/缴费凭证
• eVisa：2025年起停用实体BRP卡，统一eVisa电子签证，获签后按官网指引开通

【银行卡办理】
• 主要银行：HSBC / Lloyds / Santander / NatWest / Barclays / Starling
• 必备文件：护照+有效签证+学校开具的BANK LETTER
• BANK LETTER获取：学校内部信息平台申请，或邮件至学院/学生中心
• 账户类型：Current Account（消费）+ Saving Account（存款），利息不同
• 流程：官网预约→到店填表申请→1-2周分批收到银行卡和密码函→激活
• 开户耗时久，建议提前线上预约

【GP注册】
• 抵英务必注册GP社区医生，享受免费医疗
• 方法一：学校统一组织，现场填表
• 方法二：NHS网站查最近GP，前往注册 https://www.nhs.uk/service-search/find-a-gp
• 需携带：护照/签证+NHS号码+地址证明
• 线上注册：部分GP支持官网填表上传
• 线下注册（推荐）：到前台说"I'd like to register with this GP surgery"，填GMS1表
• 1-2周收到含NHS号码的通知

━━ 四、留英生活 ━━

【出行】导航：Google Maps / Citymapper
• 巴士：覆盖广，购票APP：NXBus Ticket
• 地铁：仅伦敦/格拉斯哥/纽卡斯尔三地
• 火车：城际首选，购票APP：Trainline / Trainpal，办Railcard享折扣
• 私人交通：类似滴滴，Uber等

【超市推荐】
• 低价：ALDI/LIDL（自有品牌为主，性价比高）/ Iceland/ASDA（冷冻+低价）
• 日常：TESCO（品类全门店多，留学生最常用）/ Sainsbury's（性价比稳定）
• 品质：M&S玛莎（网红超市，烘焙甜品出名）/ Waitrose（有机食品多，品质上乘）
• 便利：Morrisons/COOP（社区覆盖，日常采购方便）

━━ 五、毕业回国 ━━

□ 论文提交后约3个月学校账户和邮箱可能注销，提前下载保存重要信息
□ 退房时拍视频留证，与公寓负责人一起检查，确保退押金的卡未过期
□ 注销手机卡（确认合约是否需解约）、银行卡（清余额后致电注销）
□ 取消自动续费订阅（Netflix/Spotify/Amazon Prime/健身房等）
□ GP注销：学校关联的通常自动失效；单独注册的需到诊所填注销表
□ 邮寄行李：提前1月找物流，海运慢建议提前4周寄出
□ 检查公寓信箱：留意政府/银行各类信件通知
□ 落户准备：回国前在支付宝搜"移民局"核对出入境记录，确认境外学习时长
□ 学历认证：教育部留学服务中心网站在线申请→注册→缴费→提交材料

━━ 六、留英发展 ━━

【PSW签证（Graduate Visa）】
• 申请要求：持有效学生签、本科及以上学位、最低在英学时≥12个月
• 申请材料：护照+CAS+E-visa
• 流程：GOV.UK在线填表→ID Check APP上传材料→约8周出结果
• 注意：政策正在逐步收紧

【Skilled Worker签证（T2）】
• 申请要求：受合规英企聘用+雇主担保函(CoS)+岗位符合要求+薪资达标
• 申请材料：职业代码+雇主名称及担保号+职称及年薪
• 流程：https://www.gov.uk/skilled-worker-visa 线上申请，境外约3周/境内约8周出结果

━━ 七、安全保障 ━━

• 人身安全：避免夜间独自行走，优先选公共交通
• 交通安全：英国靠左行驶，与国内相反
• 金融安全：警惕陌生来电，银行不会电话索要账户密码
• 信息安全：不在公开网络平台透露隐私信息

【紧急求助电话】
• 紧急报警/救护/火警：999
• 非紧急报警：101
• 非紧急医疗：111
• 中国驻英大使馆(伦敦)：+44-07810792326（工作日）/ +86-10-12308（非工作时间）
• 驻曼彻斯特总领馆：+44-161-2248986
• 驻爱丁堡总领馆：+44-131-3374449
• 驻贝尔法斯特总领馆：+44-7895306461`
    }
};

// 话术分类映射
const categoryNames = {
    cold_outreach: "冷触达",
    warm_follow: "跟进升温",
    objection: "异议拆解(LSCPA)",
    closing: "临门促单",
    nurture: "长期培育",
    first_contact: "首次触达",
    request_apply: "索要申请",
    reward: "奖励发放"
};

// ==================== 工具函数 ====================

// 头像菜单
function toggleAvatarMenu() {
    const menu = document.getElementById('avatarMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function goAdmin() {
    document.getElementById('avatarMenu').style.display = 'none';
    enableAdminMode();
}

function goHome() {
    document.getElementById('avatarMenu').style.display = 'none';
    window.location.hash = '';
    switchPage('competitors');
}

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
    '4号独特型': '强调我司差异化优势——英国前100有代理的院校覆盖、月结+可垫付、人工+AI双线',
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
            models.push({ name: 'LSCPA异议处理', desc: '倾听→共情→澄清→方案→行动，把"不"变成"是"' });
            models.push({ name: '说服圆环', desc: '多角度论证，逐步推进' });
            break;
        case '需求挖掘':
            models.push({ name: '乔哈里视窗', desc: '通过提问揭示隐藏需求' });
            models.push({ name: 'OELS反馈模型', desc: '观察-解释-评估-建议，精准回应' });
            break;
        case '意向确认阶段':
            models.push({ name: 'RIDE说服模型', desc: '风险-利益-差异-影响，推动决策' });
            models.push({ name: 'LSCPA异议处理', desc: '倾听→共情→澄清→方案→行动' });
            break;
        case '签约阶段':
            models.push({ name: 'LSCPA异议处理', desc: '临门异议用LSCPA化解' });
            models.push({ name: 'RIDE说服模型', desc: '强调不签约风险和签约收益' });
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
    
    // 根据不同触达阶段生成话术（面向留学行业：老板/销售老师/外联/后期负责人）
    let scriptBlocks = [];
    let modelNames = models.map(m => m.name).join(' + ');
    if (enneagramType) modelNames += ' + 九型人格（' + enneagramType + '）';
    
    // 判断对话对象角色关键词
    const bg = clientBackground || '';
    const isBoss = /老板|负责人|决策|校长|总经理|总监/.test(bg);
    const isSales = /销售|顾问|咨询|前端/.test(bg);
    const isWailian = /外联|渠道|合作|市场/.test(bg);
    const isHouqi = /后期|文案|申请|递交|文书/.test(bg);
    const identityLabel = isBoss ? '老板' : isSales ? '销售老师' : isWailian ? '外联' : isHouqi ? '后期老师' : '老师';
    
    // === 开场白 ===
    let opening = '';
    if (reachStage === '首次触达') {
        if (isBoss) {
            opening = `${identityLabel}您好，我是${myRole}。今天不打长电话，就想问一句——贵司英国方向的佣金，现在多久结一次？我们这边月结，不少合作方之前都是季度甚至半年才拿到钱，换过来之后现金流松了不少。`;
        } else if (isSales) {
            opening = `${identityLabel}好，我是${myRole}。知道你们一线最在意什么——院校要多、佣金要稳、出了问题有人兜。英国方向我们前100有代理的院校基本覆盖了，佣金月结不拖欠，周末节假日也能找到人。`;
        } else if (isWailian) {
            opening = `${identityLabel}好，我是${myRole}。今天想跟您聊聊英国方向的院校资源和合作模式——KCL、曼大、华威、格拉斯哥这些我们都有代理，佣金政策也刚更新了。`;
        } else if (isHouqi) {
            opening = `${identityLabel}您好，我是${myRole}。想了解一下贵司英国方向后期的case对接还顺畅吗？不少后期老师反馈合作方回复慢、周末找不到人，我们人工+AI双线，基本当天响应。`;
        } else {
            opening = `${identityLabel}您好，我是${myRole}。了解到${clientBackground ? '贵司在' + bg.substring(0,30) + '方面有积累' : '您在留学行业'}，想看看能不能在英国方向帮您多一个靠谱的选择？`;
        }
    } else if (reachStage === '二次触达') {
        opening = `${identityLabel}，上次跟您聊完之后我特意整理了一些资料——${clientBackground ? '结合贵司主做方向' : '针对您的需求'}，我们几个核心院校的佣金政策有更新，而且有个新签的院校您可能会感兴趣。我发您看看？`;
    } else if (reachStage === '三次触达' || reachStage === '四次触达') {
        opening = `${identityLabel}，考虑到之前咱们聊的情况，我这边专门准备了一份针对贵司的方案。${clientNeeds ? '关于您提到的' + clientNeeds.substring(0,20) + '这个问题' : '关于佣金、服务和院校这几块'}，我有了更具体的建议。`;
    } else if (reachStage === '需求挖掘') {
        opening = `${identityLabel}，想跟您深入了解一下贵司英国方向的业务情况——主要关心哪块？佣金结算？服务响应？还是院校覆盖？这样我可以更有针对性地匹配。`;
    } else if (reachStage === '意向确认阶段') {
        opening = `${identityLabel}，根据咱们前几次沟通，我对贵司的需求已经很清楚了。现在想确认一下合作方向——佣金月结、服务2小时响应、院校前100基本覆盖，这些您都OK的话，咱们就可以推进下一步了。`;
    } else if (reachStage === '签约阶段') {
        opening = `${identityLabel}，咱们前期的沟通已经比较充分了，关于合作条款和流程，我想做最后确认，争取这周就启动。`;
    } else if (reachStage === '产出阶段') {
        opening = `${identityLabel}，合作启动以来进展如何？我这边想跟进一下产出情况，另外有几个新院校政策想同步给您。`;
    } else if (reachStage === '维护阶段') {
        opening = `${identityLabel}，最近业务怎么样？想跟您同步一下后续服务优化的事，也看看有没有新需求我们可以支持——最近院校资源和佣金政策都有变化。`;
    } else {
        opening = `${identityLabel}您好，我是${myRole}，想跟您探讨一下合作机会。`;
    }
    scriptBlocks.push({ title: '开场白', icon: 'fa-bullhorn', content: opening });
    
    // === 痛点切入（佣金/服务/院校三维度） ===
    let discovery = '';
    const levelTips = {
        'A级（头部企业）': '头部机构看重稳定和安全',
        'B级（大型企业）': '大型机构需要资源和效率兼备',
        'C级（中型企业）': '中型机构最需要性价比高的伙伴',
        'D级（小型企业）': '小团队对服务响应要求更高',
        'E级（个人工作室）': '工作室灵活，合作模式也要灵活',
        'F级（个人代理）': '个人代理最关心佣金安全和便捷'
    };
    if (clientNeeds) {
        const needsStr = clientNeeds.substring(0, 40);
        if (/佣金|结算|垫付|打款|费用/.test(needsStr)) {
            discovery = `关于您提到的"${needsStr}"——这确实是很多${identityLabel}最关心的事。我们这边佣金月结，不拖欠，而且部分情况可以垫付。${levelTips[clientLevel] || ''}。具体方案是这样的——`;
        } else if (/服务|响应|回复|周末|专业|效率/.test(needsStr)) {
            discovery = `关于您提到的"${needsStr}"——这是合作体验的核心。我们承诺工作日2小时内响应，周末节假日也能找到人，AI系统实时同步申请进度。${levelTips[clientLevel] || ''}。`;
        } else if (/院校|代理|国家|资源|学校/.test(needsStr)) {
            discovery = `关于您提到的"${needsStr}"——院校资源是我们的强项，英国前100有开放代理的基本能做，爱尔兰TCD也有佣金。${levelTips[clientLevel] || ''}。如果有哪些特定院校您想加，告诉我，我去确认。`;
        } else {
            discovery = `关于您提到的"${needsStr}"，这在留学行业确实很常见。${levelTips[clientLevel] || ''}我们的方案是这样的——`;
        }
    } else {
        discovery = `想了解一下，贵司英国方向目前最关注哪块？${levelTips[clientLevel] ? levelTips[clientLevel] + '。' : ''}\n• 佣金——多久结一次？能不能垫付？\n• 服务——响应快不快？周末找不找得到人？\n• 院校——覆盖够不够？想做的能不能做？`;
    }
    scriptBlocks.push({ title: '痛点切入', icon: 'fa-search', content: discovery });
    
    // === 核心价值呈现（按身份分层） ===
    let valueProp = '';
    if (clientIdentity === '决策者' || isBoss) {
        valueProp = `从决策角度看，跟我们合作就三件事：\n1️⃣ 【佣金安全】27年专注英国，佣金月结不拖欠，部分可垫付，合作方零资金风险\n2️⃣ 【院校覆盖广】英国前100有开放代理的院校基本能做（KCL、曼大、华威、格拉斯哥、利兹、南安普顿、谢菲、杜伦、诺丁汉等），爱尔兰TCD也有佣金，扩大可签约院校池\n3️⃣ 【服务省心】人工+AI双线，工作日2小时响应，周末也有人，让您用更少精力签更多学生`;
    } else if (clientIdentity === '影响者' || isWailian) {
        valueProp = `从渠道合作角度，我想跟您分享几个核心点：\n• 院校资源：英国前100有开放代理的都能做，KCL、曼大、华威、格拉斯哥、利兹这些主力院校全覆盖，爱尔兰TCD也有佣金\n• 佣金结算：月结，透明安全，不占您资金\n• 操作流程：简洁高效，佣金明细每笔清楚\n很多合作方外联反馈，跟我们对接后英国方向资源补充明显，签约转化也提了。`;
    } else if (isHouqi) {
        valueProp = `从后期操作体验来说，我们围绕"省心"来设计：\n• 响应速度：工作日2小时内回复，周末和节假日也能找到人\n• 进度透明：AI系统实时同步申请进度，不用反复催问\n• 专业度：27年专注英国，各种case都处理过，疑难杂症也有经验\n• 紧急通道：突发情况直接打电话，24小时有人接`;
    } else if (isSales) {
        valueProp = `从销售签约角度，我们帮您解决三个核心问题：\n• 院校要多——英国前100有代理的基本能做，学生想申的院校我们有，签约成功率自然高\n• 佣金要稳——月结不拖欠，安全有保障\n• 出了问题有人兜——人工+AI双线，周末节假日也能找到人，不会让您在学生面前掉链子`;
    } else {
        valueProp = `简单说三个核心优势：\n1️⃣ 佣金安全——月结不拖欠，部分可垫付\n2️⃣ 服务省心——工作日2小时响应，周末也有人\n3️⃣ 院校覆盖广——英国前100有代理的基本能做，爱尔兰TCD也有佣金`;
    }
    scriptBlocks.push({ title: '核心价值', icon: 'fa-gem', content: valueProp });
    
    // === LSCPA异议处理（Listen倾听→Share共情→Clarify澄清→Present方案→Ask行动） ===
    // 根据触达阶段和客户背景，预判最可能遇到的异议，生成LSCPA实战话术
    
    // 判断最可能的异议类型
    let objectionType = 'general'; // 默认
    if (/已有|合作方|合作机构|不换|稳定|不用/.test(clientNeeds) || /已有|合作方/.test(bg)) {
        objectionType = 'has_partner';
    } else if (/佣金|结算|垫付|打款|贵|价格|费用/.test(clientNeeds)) {
        objectionType = 'commission';
    } else if (/服务|响应|回复|周末|专业|不行|不信任|不确定/.test(clientNeeds)) {
        objectionType = 'service';
    } else if (/院校|代理|国家|资源|覆盖|不够|能不能做/.test(clientNeeds)) {
        objectionType = 'coverage';
    } else if (/不急|明年|再说|考虑|不需要|没计划/.test(clientNeeds)) {
        objectionType = 'timing';
    }
    
    // 签约/意向确认阶段默认给"已有合作方"异议（最常见的关门话术）
    if ((reachStage === '签约阶段' || reachStage === '意向确认阶段') && objectionType === 'general') {
        objectionType = 'has_partner';
    }
    
    let lscpa = '';
    const lLabel = '👂 L-倾听确认';
    const sLabel = '🤝 S-共情认同';
    const cLabel = '🔍 C-澄清挖掘';
    const pLabel = '💡 P-提出方案';
    const aLabel = '👉 A-请求行动';
    
    if (objectionType === 'has_partner') {
        // 最常见异议："我们已经有合作方了"
        lscpa = `${lLabel}："有稳定合作方，说明合作得不错才会一直做，对吧？"\n\n${sLabel}："找个靠谱的合作方不容易，稳定合作省很多沟通成本，换我我也不会随便换。"\n\n${cLabel}："我不是来抢人的，就想做个行业交流——您和现有合作方，主要看中的是哪块？佣金结算快？服务响应好？还是院校覆盖广？"\n\n${pLabel}："那还挺契合的，我们主做英国前100有代理的院校（KCL、曼大、华威、格拉斯哥等），佣金月结、部分可垫付——很多有稳定合作方的伙伴都是和我们搭着做，不要求替换，只是多一个备选。"\n\n${aLabel}："我把核心优势和院校清单发您一份，您空的时候看看，下周三下午我再跟您轻聊5分钟，同步下行业最新资源，您看可以吗？"`;
    } else if (objectionType === 'commission') {
        // 佣金异议："你们佣金不够高/结算不够快"
        lscpa = `${lLabel}："佣金确实是合作的核心，您比这个很正常。"\n\n${sLabel}："这一行佣金高低直接挂钩收益，谁都想拿更好的条件，换我我也得算清楚。"\n\n${cLabel}："您说的佣金顾虑，主要是比例不够高，还是结算周期太长、资金压太多？这两块解决思路不一样。"\n\n${pLabel}："我们差异化在这：第一，月结，很多同行季度甚至半年才打款，等于您白垫几个月；第二，部分可以垫付，行业里不多见；第三，签约效率高，同样时间多出几单，总账算下来更划算。"\n\n${aLabel}："我发一份佣金政策对比表给您，您跟现在条件比比看。下周二我再跟您简单聊聊，行吗？"`;
    } else if (objectionType === 'service') {
        // 服务异议："不确定你们服务行不行/响应快不快"
        lscpa = `${lLabel}："服务质量决定了合作能走多远，您有这个顾虑说明对学生负责。"\n\n${sLabel}："我听到不少老师吐槽过合作方前期说得好、签约后人就找不着了，这种体验太坑了。"\n\n${cLabel}："您之前遇到的问题，主要是响应慢、周末找不到人，还是申请过程沟通不透明？知道具体哪块不放心我才好对症说。"\n\n${pLabel}："这几个点我们正好都解决了——工作日2小时响应，周末节假日有人；申请进度AI实时同步，不用催；紧急情况24小时电话直达。27年专注英国，各种case都处理过。"\n\n${aLabel}："您先推1-2个学生试试，感受下响应速度和专业度，体验不好随时停，零风险。您看这周能安排吗？"`;
    } else if (objectionType === 'coverage') {
        // 院校覆盖异议："你们能做哪些院校？够不够？"
        lscpa = `${lLabel}："院校资源是合作的地基，这块不够，别的都白搭。"\n\n${sLabel}："学生想申的院校做不了，等于白流失客户，这谁遇到都头疼。"\n\n${cLabel}："您目前最需要补充的是哪块？是有几个特定学校想做但现有合作方覆盖不了，还是整体英国方向的院校池想扩大？"\n\n${pLabel}："英国前100有开放代理的院校基本能做——KCL、曼大、布里斯托、华威、格拉斯哥、利兹、南安普顿、杜伦、诺丁汉是主力，爱尔兰TCD也有佣金。有特定院校想做告诉我，我去确认能不能加进来，院校池一直在扩展。"\n\n${aLabel}："我发一份最新院校清单和佣金表，您对照看看有没有缺口。有特别想加的也告诉我，查完给您反馈，可以吗？"`;
    } else if (objectionType === 'timing') {
        // 时机异议："不急/明年再说/今年肯定换不了"
        lscpa = `${lLabel}："目前确实没有紧迫的切换需求，这很正常。"\n\n${sLabel}："合作这种事得看时机，不是随便就能动的，我理解。"\n\n${cLabel}："想确认一下，是今年确实没计划了，还是想多了解几个选项备着？"\n\n${pLabel}："即使本年度暂无计划，可以先建立联系。不少合作方一开始只是了解着，等有需求时发现正好能满足，直接就启动了，不用从头筛选。您不需要做任何承诺。"\n\n${aLabel}："我把院校清单和佣金政策发您存着。另外想确认——如果下一年度贵司有补充或更换合作方的需求，咱们是否有优先洽谈的机会？到时候不用再重新找，您看可以吗？"`;
    } else {
        // 通用异议处理模板
        lscpa = `${lLabel}："您有顾虑是正常的，能说出来反而好沟通。"\n\n${sLabel}："选合作方确实要慎重，毕竟涉及到学生和佣金的事。"\n\n${cLabel}："方便说说您最担心的是哪方面吗？佣金安全、服务响应，还是院校覆盖？这样我可以有针对性地给您方案。"\n\n${pLabel}："不管您担心的是哪块，我们的核心承诺是：佣金月结不拖欠、服务2小时响应周末也有人、英国前100有代理的基本能做。具体顾虑我可以逐个给您解答。"\n\n${aLabel}："我先把核心优势资料发您看看，有问题随时问我，咱们不着急，您先了解着，您看可以吗？"`;
    }
    
    scriptBlocks.push({ title: '异议处理（LSCPA五步法）', icon: 'fa-shield-alt', content: lscpa });
    
    // === 促单/下一步（低压力推进，不给拒绝理由） ===
    let closing = '';
    if (reachStage === '签约阶段') {
        closing = `既然核心问题咱们都聊清楚了，我建议这周就把合作确认函签了——不用复杂，就一个简单的框架协议。下周就能开始对接学生，早启动早出结果。您看周四还是周五方便？`;
    } else if (reachStage === '意向确认阶段') {
        closing = `我把院校清单、佣金政策和服务标准整理一份发您，您看看条件和覆盖合不合适。我下周三下午再跟您轻聊5分钟，同步下最新的合作资源，您看可以吗？`;
    } else if (reachStage === '维护阶段' || reachStage === '产出阶段') {
        closing = `后续我定期跟您同步最新院校政策和佣金变化，有需要随时联系我。另外最近有几个新签约的院校，我整理好发您。`;
    } else {
        closing = `我把核心优势、服务流程和院校清单发您一份，您空的时候看看。我下周${isBoss ? '三' : '二'}下午再跟您轻聊5分钟，同步下行业最新合作资源，您看可以吗？`;
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
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i>暂无话术，点击上方"新增话术"添加</div>';
        return;
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
                <div class="script-card-actions-top">
                    <div class="script-rating">${stars}</div>
                    <button class="script-action-btn" title="编辑" onclick="openEditScript(${script.id})"><i class="fas fa-pen"></i></button>
                    <button class="script-action-btn script-action-btn-danger" title="删除" onclick="deleteScript(${script.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="script-card-content">${script.content.replace(/\n/g, '<br>')}</div>
            <div class="script-card-footer">
                <span class="script-type-tag">${categoryNames[script.category] || script.category}</span>
                <div class="script-card-footer-actions">
                    <button class="btn btn-sm btn-outline" onclick="copyScriptContent(${script.id})"><i class="fas fa-copy"></i> 复制</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function copyScriptContent(id) {
    const script = scripts.find(s => s.id === id);
    if (script) {
        navigator.clipboard.writeText(script.content).then(() => {
            const btn = document.querySelector(`#script-${id} .script-card-footer-actions button`);
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => btn.innerHTML = original, 1500);
            }
        });
    }
}

// 新增话术
function openAddScript() {
    document.getElementById('scriptEditTitle').innerHTML = '<i class="fas fa-plus-circle"></i> 新增话术';
    document.getElementById('scriptEditId').value = '';
    document.getElementById('scriptEditName').value = '';
    document.getElementById('scriptEditScene').value = '';
    document.getElementById('scriptEditCategory').value = 'cold_outreach';
    document.getElementById('scriptEditRating').value = '4';
    document.getElementById('scriptEditContent').value = '';
    document.getElementById('scriptEditModal').classList.add('active');
}

// 编辑话术
function openEditScript(id) {
    const script = scripts.find(s => s.id === id);
    if (!script) return;
    
    document.getElementById('scriptEditTitle').innerHTML = '<i class="fas fa-edit"></i> 编辑话术';
    document.getElementById('scriptEditId').value = id;
    document.getElementById('scriptEditName').value = script.title;
    document.getElementById('scriptEditScene').value = script.scene;
    document.getElementById('scriptEditCategory').value = script.category;
    document.getElementById('scriptEditRating').value = script.rating;
    document.getElementById('scriptEditContent').value = script.content;
    document.getElementById('scriptEditModal').classList.add('active');
}

// 保存话术（新增或编辑）
function saveScriptEdit(event) {
    event.preventDefault();
    
    const editId = document.getElementById('scriptEditId').value;
    const title = document.getElementById('scriptEditName').value.trim();
    const scene = document.getElementById('scriptEditScene').value.trim();
    const category = document.getElementById('scriptEditCategory').value;
    const rating = parseInt(document.getElementById('scriptEditRating').value);
    const content = document.getElementById('scriptEditContent').value.trim();
    
    if (editId) {
        // 编辑已有
        const script = scripts.find(s => s.id === parseInt(editId));
        if (script) {
            script.title = title;
            script.scene = scene;
            script.category = category;
            script.rating = rating;
            script.content = content;
            script.type = categoryNames[category] || category;
        }
    } else {
        // 新增
        const maxId = scripts.reduce((max, s) => Math.max(max, s.id), 0);
        scripts.push({
            id: maxId + 1,
            category: category,
            title: title,
            scene: scene,
            content: content,
            rating: rating,
            type: categoryNames[category] || category
        });
    }
    
    saveScriptsLocal();
    closeModal('scriptEditModal');
    renderScripts();
}

// 删除话术
function deleteScript(id) {
    if (!confirm('确定删除这条话术吗？')) return;
    const idx = scripts.findIndex(s => s.id === id);
    if (idx !== -1) {
        scripts.splice(idx, 1);
        saveScriptsLocal();
        renderScripts();
    }
}

// 本地存储话术
function saveScriptsLocal() {
    try {
        localStorage.setItem('salesEmpowerment_scripts', JSON.stringify(scripts));
    } catch(e) {
        console.warn('保存话术到localStorage失败:', e);
    }
}

// 从本地存储加载话术
function loadScriptsLocal() {
    try {
        const saved = localStorage.getItem('salesEmpowerment_scripts');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                scripts.length = 0;
                parsed.forEach(s => scripts.push(s));
            }
        }
    } catch(e) {
        console.warn('从localStorage加载话术失败:', e);
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
    loadScriptsLocal();
    loadCompetitorsFromSupabase();
    renderTimeline();
    renderRadarChart();
    renderScripts();
    renderEnneagramCards();
    
    // 检查分享模式
    checkShareMode();
    
    // 监听hash变化
    window.addEventListener('hashchange', checkShareMode);
    
    // 头像菜单点击外部关闭
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('avatarMenu');
        const btn = document.getElementById('avatarBtn');
        if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });
    
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
