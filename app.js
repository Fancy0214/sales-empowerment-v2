// ==================== Supabase 配置 ====================
const SUPABASE_URL = 'https://hgtxozgpvccgsvslokud.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9Sc9FFYAqKl2eJUdyP0HmA_w8RdAcKH';
const ADMIN_PASSWORD = 'fancy2024'; // 管理密码，可在首次登录后修改
const LOGIN_PASSWORD = 'fancy2024'; // 平台访问密码（登录门禁）
const SHARE_PASSWORD = 'sales2026'; // 分享链接查看密码

let supabaseClient = null;
let isAdminMode = false;
let allSubmissions = []; // 管理后台用：所有提交数据

// ===== 懒加载大库（mammoth/pdfjs/xlsx仅在导入时按需加载） =====
const _lazyLibs = {};
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
async function ensureLib(name) {
    if (_lazyLibs[name]) return;
    _lazyLibs[name] = true; // 防止重复加载
    if (name === 'xlsx') {
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    } else if (name === 'mammoth') {
        await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
    } else if (name === 'pdfjs') {
        await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.js');
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
        }
    }
}
let currentAdminFilter = 'pending';

// ==================== 登录门禁 ====================
function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const pwd = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const validUsers = { 'fancy': 'fancy2024' };
    if (validUsers[username] === pwd) {
        sessionStorage.setItem('salesEmpowerment_loggedIn', 'true');
        sessionStorage.setItem('salesEmpowerment_user', username);
        document.documentElement.classList.remove('not-logged-in');
        errEl.style.display = 'none';
    } else {
        errEl.style.display = 'block';
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginUsername').focus();
    }
}

// ==================== 分享链接密码验证 ====================
let _pendingShareConfig = null; // 等待密码验证的分享配置
let _pendingShowEnnea = false; // 密码验证后是否需要切换到九型测试

function doSharePasswordVerify() {
    const pwd = document.getElementById('sharePasswordInput').value;
    const errEl = document.getElementById('sharePasswordError');
    if (pwd === SHARE_PASSWORD) {
        sessionStorage.setItem('salesEmpowerment_shareVerified', 'true');
        document.getElementById('sharePasswordGate').style.display = 'none';
        errEl.style.display = 'none';
        // 继续执行分享模式
        if (_pendingShareConfig) {
            activateShareMode(_pendingShareConfig);
            if (_pendingShowEnnea) {
                showEnneaTab('test');
                _pendingShowEnnea = false;
            }
            _pendingShareConfig = null;
        }
    } else {
        errEl.style.display = 'block';
        document.getElementById('sharePasswordInput').value = '';
        document.getElementById('sharePasswordInput').focus();
    }
}

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

// 竞品动态时间线（本地兜底数据，优先从 Supabase 加载）
const competitorTimelineFallback = [
    { date: "今天", tag: "价格调整", content: "新东方前途出国下调英澳留学服务费用，最高优惠15%", source: "新东方前途出国官网", link: "https://liuxue.xdf.cn" },
    { date: "昨天", tag: "新品发布", content: "启德教育推出「名校保录计划」，承诺申请失败全额退款", source: "启德教育官网", link: "https://www.eic.org.cn" },
    { date: "3天前", tag: "战略合作", content: "IDP诺思与剑桥大学建立官方招生合作通道", source: "IDP教育集团官网", link: "https://www.idp.com" },
    { date: "上周", tag: "营销活动", content: "澳际教育启动「暑期留学嘉年华」，签约即送iPad", source: "澳际教育公众号", link: "https://www.aoji.cn" },
    { date: "上周", tag: "服务升级", content: "啄木鸟教育上线AI智能选校系统，提升选校精准度", source: "啄木鸟教育官网", link: "https://www.zhuomuniao.com" }
];
let competitorTimeline = [...competitorTimelineFallback];

// 话术库（B2B留学行业实战话术——面向机构老板/销售老师/外联/后期负责人）
const scripts = [
    // === 冷触达 ===
    { id: 1, category: "cold_outreach", title: "打给机构老板-30秒抓住注意力", scene: "首次联系机构负责人/老板", content: "张总您好，我是XX的Lily。今天不打长电话，就想问一句——贵司英国方向的佣金，现在多久结一次？我们这边到账实时结算，不少合作方之前都是季度甚至半年才拿到钱，换过来之后现金流松了不少。您要是有兴趣，我发个院校清单和佣金表给您看看？", rating: 5, type: "电话开发" },
    { id: 2, category: "cold_outreach", title: "加外联老师微信-给个实在理由", scene: "展会/活动后加外联老师", content: "李老师好，我是今天展会上跟您聊了几句的Lily。您提到英国这边想找新渠道，我回去查了一下——KCL、曼大、华威、格拉斯哥这些我们都有代理，佣金政策也刚更新。发您看看？不合适也没事，先存着备用。", rating: 5, type: "微信沟通" },
    { id: 3, category: "cold_outreach", title: "冷邮件-三段话讲清楚价值", scene: "邮件首次触达机构决策者", content: "王总好，\n\n简单说三点：\n1. 英国前100有开放代理的院校基本能做——KCL、曼大、华威、格拉斯哥、利兹、南安普顿等，爱尔兰TCD也有佣金\n2. 佣金到账实时结算，不用等季度，现金流不压\n3. 人工服务为主，AI辅助关键节点提醒和常规答复，周末节假日也能找到人\n\n先推1-2个case试起，用结果说话。方便约个10分钟电话？\n\nLily", rating: 4, type: "邮件触达" },
    { id: 4, category: "cold_outreach", title: "找到后期负责人-从痛点切入", scene: "联系机构后期/文案主管", content: "赵老师您好，我是XX的Lily。直接问个事——贵司英国方向的case，合作方回复一般要多久？不少后期老师跟我吐槽过周末找不到人、催了没回音。我们这边工作日2小时响应，周末也有人在，要不我先发个服务标准给您参考？", rating: 4, type: "电话开发" },
    { id: 5, category: "cold_outreach", title: "联系销售老师-帮他多签约", scene: "联系机构一线销售顾问", content: "陈老师好，我是XX的Lily。知道一线老师最想要什么——院校要多、佣金要稳、出了问题有人兜。英国方向我们前100有代理的院校基本覆盖，佣金到账实时结算不拖欠，周末也能找到人。您要是英国方向有学生想多签几个院校，可以先配合试试。", rating: 4, type: "微信沟通" },

    // === 跟进升温 ===
    { id: 6, category: "warm_follow", title: "二次跟进-带着新资源回来", scene: "首次沟通后3-5天跟进", content: "张总，上次聊完我特意查了一下，您提到的XX院校我们刚好新拿到代理权，佣金比您目前的合作方大概高X个点，到账实时结算不变。另外最近又签了几个新院校，我一起发您？您看这周哪天方便聊5分钟？", rating: 5, type: "二次触达" },
    { id: 7, category: "warm_follow", title: "对方说'考虑考虑'-锁定时间", scene: "客户态度模糊", content: "没问题，选合作方确实得慎重。这样，我不催您，但能不能定个时间我再找您？比如下周三？我提前把院校清单、佣金政策和结算方式整理好发您，您看完心里有数，咱们再聊也更有针对性。", rating: 5, type: "跟进升温" },
    { id: 8, category: "warm_follow", title: "对方冷淡-用案例撬开话匣子", scene: "客户兴趣不高", content: "张总，理解您现在合作方可能够用。就问一句——英国方向佣金多久结一次？我们最近帮一家跟贵司体量差不多的机构切过来，光到账实时结算这一项，他们现金流就松了不少，院校匹配也更精准。要不我发个案例给您看看？", rating: 4, type: "跟进升温" },
    { id: 9, category: "warm_follow", title: "跟后期老师-从服务体验入手", scene: "上次聊过后期对接体验", content: "赵老师，上次您说后期对接有时候响应慢，我回去确认了一下——我们工作日2小时响应，周末节假日也有人，紧急情况直接打电话。另外申请进度可以实时看，不用反复催。您要不先推一个case试试？", rating: 4, type: "跟进升温" },

    // === 异议拆解（LSCPA实战版） ===
    { id: 10, category: "objection", title: "「我们已经有合作方了」-LSCPA", scene: "最常见的异议", content: "【L-倾听】有稳定合作方，说明合作得不错才会一直做，对吧？\n\n【S-共情】找个靠谱的合作方不容易，稳定合作省很多沟通成本，换我我也不会随便换。\n\n【C-澄清】我不是来抢人的，就想做个行业交流——您和现有合作方，主要看中的是哪块？佣金结算快？服务响应好？还是院校覆盖广？\n\n【P-方案】那还挺契合的，我们主做英国前100有代理的院校，佣金到账实时结算、部分可垫付——很多有稳定合作方的伙伴都是和我们搭着做，不要求替换，只是多一个备选。\n\n【A-行动】我把核心优势和院校清单发您一份，您空的时候看看，下周三下午我再跟您轻聊5分钟，同步下行业最新资源，您看可以吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 11, category: "objection", title: "「你们佣金没有XX高」-LSCPA", scene: "老板/销售对佣金敏感", content: "【L-倾听】佣金确实是合作的核心，您比这个很正常。\n\n【S-共情】这一行佣金高低直接挂钩收益，谁都想拿更好的条件，换我我也得算清楚。\n\n【C-澄清】您说的佣金顾虑，主要是比例不够高，还是结算周期太长、资金压太多？这两块解决思路不一样。\n\n【P-方案】我们差异化在这：第一，到账实时结算，很多同行季度甚至半年才打款，等于您白垫几个月；第二，部分可以垫付，行业里不多见；第三，签约效率高，同样时间多出几单，总账算下来更划算。\n\n【A-行动】我发一份佣金政策对比表给您，您跟现在条件比比看。下周二我再跟您简单聊聊，行吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 12, category: "objection", title: "「不确定你们服务行不行」-LSCPA", scene: "后期老师/销售质疑服务", content: "【L-倾听】服务质量决定了合作能走多远，您有这个顾虑说明对学生负责。\n\n【S-共情】我听到不少老师吐槽过合作方前期说得好、签约后人就找不着了，这种体验太坑了。\n\n【C-澄清】您之前遇到的问题，主要是响应慢、周末找不到人，还是申请过程沟通不透明？知道具体哪块不放心我才好对症说。\n\n【P-方案】这几个点我们正好都解决了——工作日2小时响应，周末节假日有人；AI自动提醒关键节点（材料截止、offer回复等），常规问题秒答复，不用催；紧急情况24小时电话直达。\n\n【A-行动】您先推1-2个学生试试，感受下响应速度和专业度，体验不好随时停，零风险。您看这周能安排吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 13, category: "objection", title: "「你们能做哪些院校？覆盖够不够？」-LSCPA", scene: "外联/销售关心院校资源", content: "【L-倾听】院校资源是合作的地基，这块不够，别的都白搭。\n\n【S-共情】学生想申的院校做不了，等于白流失客户，这谁遇到都头疼。\n\n【C-澄清】您目前最需要补充的是哪块？是有几个特定学校想做但现有合作方覆盖不了，还是整体英国方向的院校池想扩大？\n\n【P-方案】英国前100有开放代理的院校基本能做——KCL、曼大、布里斯托、华威、格拉斯哥、利兹、南安普顿、杜伦、诺丁汉是主力，爱尔兰TCD也有佣金。有特定院校想做告诉我，我去确认能不能加进来。\n\n【A-行动】我发一份最新院校清单和佣金表，您对照看看有没有缺口。有特别想加的也告诉我，查完给您反馈，可以吗？", rating: 5, type: "LSCPA异议处理" },
    { id: 14, category: "objection", title: "「今年换不了了/明年再说」-LSCPA", scene: "时机异议", content: "【L-倾听】目前确实没有紧迫的切换需求，这很正常。\n\n【S-共情】合作这种事得看时机，不是随便就能动的，我理解。\n\n【C-澄清】想确认一下，是今年确实没计划了，还是想多了解几个选项备着？\n\n【P-方案】即使本年度暂无计划，可以先建立联系。不少合作方一开始只是了解着，等有需求时发现正好能满足，直接就启动了，不用从头筛选。您不需要做任何承诺。\n\n【A-行动】我把院校清单和佣金政策发您存着。另外想确认——如果下一年度贵司有补充或更换合作方的需求，咱们是否有优先洽谈的机会？到时候不用再重新找，您看可以吗？", rating: 4, type: "LSCPA异议处理" },
    { id: 15, category: "objection", title: "「佣金安全吗？会不会跑路？」-LSCPA", scene: "老板/个人代理最关心安全", content: "【L-倾听】佣金安全是合作的底线，您谨慎是对的。\n\n【S-共情】这个行业确实鱼龙混杂，谁都不想遇到佣金拿不到的情况，多留个心眼没毛病。\n\n【C-澄清】您担心的主要是拖欠，还是怕合作方跑路？这两个我都能给您交底。\n\n【P-方案】我们做了27年，佣金安全是底线。到账实时结算不拖欠，每个case佣金明细清清楚楚。而且可以从小case开始，跑一单您心里就有数了——现在的大合作方，一开始也是这么试过来的。\n\n【A-行动】我发一份合作流程和佣金结算说明，您看看怎么保障安全的。有问题随时问，可以吗？", rating: 4, type: "LSCPA异议处理" },

    // === 临门促单 ===
    { id: 16, category: "closing", title: "试合作-降低决策门槛", scene: "意向有了但还在犹豫", content: "张总，别想太复杂。先推1-2个英国的学生过来，我们全程跟进——佣金到账实时结算、2小时内响应、周末也有人。不用签大协议，一个合作确认函就行。跑通一个case您心里就有数了，这周能安排吗？", rating: 5, type: "临门促单" },
    { id: 17, category: "closing", title: "锚定签约-卡住时间窗口", scene: "对方说好但一直不推进", content: "张总，方向都对齐了，我建议这周就把确认函签了，下周直接开始对接。英国申请窗口就那几个月，早一天多一分优势。而且佣金到账实时结算，签约就有进账。您看周四还是周五方便？", rating: 5, type: "临门促单" },
    { id: 18, category: "closing", title: "直面最后顾虑-把话说开", scene: "签约前最后一哆嗦", content: "张总，我能感觉您还有点犹豫——您直说，最担心什么？佣金安全？结算速度？服务响应？还是院校覆盖不够？敞开聊，能解决的我当场给方案，不能解决的我也实话实说。合作最怕有话憋着，后面反而出问题。", rating: 4, type: "临门促单" },

    // === 长期培育 ===
    { id: 19, category: "nurture", title: "首单交付后-趁热扩大", scene: "第一个case出结果后", content: "张总，XX同学的offer下来了，从提交到出结果X天，比市场平均快。趁这个势头，咱们聊聊扩大合作——最近又签了几个新院校，佣金政策也有调整。另外签约量上来之后，佣金档位可以再谈谈，我整理一下发您？", rating: 5, type: "长期培育" },
    { id: 20, category: "nurture", title: "节日问候-带点实在价值", scene: "节日/假期前", content: "张总，中秋快乐！不打扰您过节，就顺嘴提一句：我们刚拿到XX大学2026年最新佣金政策，比去年涨了2个点，到账实时结算不变。节后我发您看看？", rating: 4, type: "长期培育" },
    { id: 21, category: "nurture", title: "沉睡客户唤醒-给个新理由", scene: "很久没合作的机构", content: "张总好久不见！英国那边最近几个变化——曼大和利兹2026年新增了几个专业的代理通道，佣金调了，而且我们现在到账实时结算+可垫付，之前没有的。您那边英国方向学生量怎么样？有需求的话这次政策窗口值得抓。", rating: 4, type: "长期培育" },
    { id: 22, category: "nurture", title: "续约升级-用数据说话", scene: "试合作期结束", content: "张总，合作这段时间咱们配合得还行吧？跟您说个事——签约量到一定规模，佣金档位可以再优一档，另外配专属对接经理，响应更快，周末也优先处理您的case。您看有没有兴趣升级一下？", rating: 4, type: "长期培育" },
    { id: 23, category: "nurture", title: "给后期老师-持续服务保障", scene: "合作中的后期老师维护", content: "赵老师，最近对接还顺畅吧？跟您同步个事——我们系统升级了，申请进度现在能实时查看，不用等邮件了。另外加了紧急响应通道，突发情况直接打电话，24小时有人接。您用着哪不方便随时跟我说。", rating: 4, type: "长期培育" }
];


// 九型人格完整数据
const enneagramTypes = {
    1: {
        name: "完美主义者",
        cardDesc: "追求正确与完美，注重细节与规则，有强烈的内在标准，善于发现问题和改进空间。",
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
        name: "助人者",
        cardDesc: "关注他人需求，善于建立人际关系，通过帮助他人获得价值感，温暖而有同理心。",
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
        name: "成就者",
        cardDesc: "目标导向，追求成功与认可，高效执行力强，善于展现自我，适应力出色。",
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
        name: "个人主义者",
        cardDesc: "追求独特与真实，情感丰富细腻，富有创造力和审美能力，渴望深层连接。",
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
        name: "探索者",
        cardDesc: "追求知识与理解，善于观察和分析，独立思考，注重隐私和个人空间。",
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
        name: "忠诚者",
        cardDesc: "注重安全与确定性，善于预见风险，忠诚可靠，在团队中是稳定的支持力量。",
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
        name: "热情者",
        cardDesc: "追求体验与快乐，思维活跃，善于发现机会，乐观积极，讨厌被束缚。",
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
        name: "挑战者",
        cardDesc: "追求力量与控制，果断直接，保护弱者，有强烈的正义感和领导力。",
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
        name: "和平者",
        cardDesc: "追求和谐与平静，善于调解冲突，包容性强，能站在多角度看问题。",
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
    'timeline': {
        title: '留学时间规划',
        icon: 'fa-clock',
        tag: '27Fall · 英国硕士申请',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-clock"></i></div>
    <h1>留学时间规划</h1>
    <span class="st-tag">27Fall · 英国硕士申请</span>
  </div>
  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">申请时间轴</span></div>
    <div class="st-card-body">
      <div class="st-timeline">
        <div class="st-tl-node">
          <div class="st-tl-label">📌 5月 · 准备阶段</div>
          <div class="st-tl-desc">明确留学目标，确定专业和院校范围<br>了解英国硕士申请要求和时间线<br>评估自身背景，制定提升计划（均分/语言/实习等）<br>开始准备语言考试（雅思/托福）</div>
          <div class="st-tl-tags"><span class="st-tl-tag">GPA评估</span><span class="st-tl-tag">雅思备考</span><span class="st-tl-tag">背景评估</span></div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">📌 6-7月 · 背景提升阶段</div>
          <div class="st-tl-desc">努力提升GPA，保持良好成绩<br>参加实习/科研/项目，丰富背景经历<br>继续备考语言，争取出分<br>梳理个人经历，积累文书素材</div>
          <div class="st-tl-tags"><span class="st-tl-tag">实习</span><span class="st-tl-tag">科研</span><span class="st-tl-tag">雅思出分</span></div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">📌 8-9月 · 材料准备阶段</div>
          <div class="st-tl-desc">确定目标院校和专业，整理申请清单<br>准备申请材料：个人陈述、简历、推荐信等<br>如果需要，联系推荐人并确定推荐信<br>语言考试出分，满足申请要求</div>
          <div class="st-tl-tags"><span class="st-tl-tag">PS</span><span class="st-tl-tag">CV</span><span class="st-tl-tag">推荐信</span></div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">📌 10-12月 · 申请递交阶段</div>
          <div class="st-tl-desc">陆续递交申请（英国硕士采取滚动录取，建议尽早）<br>跟进申请状态，补充材料（如有）<br>关注邮箱，及时查看学校回复<br>准备面试（如有）</div>
          <div class="st-tl-tags"><span class="st-tl-tag">早申</span><span class="st-tl-tag">面试</span></div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">📌 次年1-3月 · 录取与抉择阶段</div>
          <div class="st-tl-desc">收到录取通知，比较offer（专业、排名、费用等）<br>确定最终选择，回复offer并缴纳押金<br>准备签证材料，预约签证<br>安排住宿，预订机票</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">📌 次年4-9月 · 行前准备阶段</div>
          <div class="st-tl-desc">办理签证<br>预订住宿，了解当地生活<br>准备行李，购买机票<br>行前准备，开启英国留学之旅！</div>
        </div>
      </div>
    </div>
  </div>  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【27Fall英国硕士申请时间线规划】

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
`
    },
    'predeparture': {
        title: '留英行前指南',
        icon: 'fa-plane-departure',
        tag: '签证 · 体检 · 行李 · 落地 · 生活',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-plane-departure"></i></div>
    <h1>留英行前指南</h1>
    <span class="st-tag">签证 · 体检 · 行李 · 落地 · 生活</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">一、签证准备</span></div>
    <div class="st-card-body">
      <div class="st-section-title">肺结核体检</div>
      <ul class="st-bullet-list">
        <li>在英停留6个月及以上需提交肺结核体检报告，有效期6个月</li>
        <li>最晚在签证前3个月内体检，提前3-7个工作日电话预约</li>
        <li>检测机构：北京、成都、重庆、南京、上海、深圳、西安等15城市设点<br>查询：<a href="https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china" target="_blank">https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china</a></li>
        <li>费用550元（不含治疗），需携带：身份证+护照原件、2张白底证件照(3.5×4.5cm)</li>
        <li>17岁以下需监护人陪同；有胸部手术史/结核病史需带诊断报告</li>
        <li>结果：合格1-2工作日取证明，存疑需痰培养约2个月</li>
      </ul>
      <div class="st-section-title">签证保证金</div>
      <ul class="st-bullet-list">
        <li>金额 = 学费 + 9个月生活费 + 额外2000镑<br>（生活费最低标准：伦敦1529镑/月，非伦敦1171镑/月）</li>
        <li>存款要求：签证前连续28天存期，建议开课前3个月提前存好</li>
        <li>存在大型国有银行（中行/工行/建行/农行），存申请人名下</li>
        <li>递签前或被抽查时再开存款证明，不要提前开（有时效性）</li>
        <li>获签前勿动用资金，易致拒签</li>
        <li>资金在父母名下需：亲属关系证明+资金授权信+翻译件</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">二、出行准备</span></div>
    <div class="st-card-body">
      <div class="st-section-title">机票</div>
      <ul class="st-bullet-list">
        <li>先确认学校是否提供接机服务，再订机票</li>
        <li>建议获签后再订票；提前预订务必查清退改规则</li>
        <li>起飞时间：晚上起飞最优（抵英为白天，方便安顿）</li>
        <li>直飞vs转机：直飞舒适但贵且少；转机便宜但时长约20h，转机不超2次</li>
        <li>转机优选联程机票，免二次托运与过境签</li>
        <li>留学生可邮件申请航司专属优惠及额外行李额</li>
      </ul>
      <div class="st-section-title">出国体检</div>
      <ul class="st-bullet-list">
        <li>需办理：小红本（国际旅行健康检查证明书）+ 小黄本（疫苗接种国际证书）</li>
        <li>入境可能抽查，提前半个月至两个月体检为佳</li>
        <li>预约：各地国际旅行卫生保健中心公众号或电话，工作日上午8:00-11:00</li>
        <li>查询卫检单位：<a href="http://m.ithc.cn/wjdw" target="_blank">http://m.ithc.cn/wjdw</a></li>
        <li>携带：身份证+护照原件、4张两寸白底照片、疫苗本（如有）</li>
        <li>体检需空腹，项目含一般检查/内外科/胸透/心电图/腹部超声/实验室检查</li>
        <li>持1年以上英国签证+录取通知书可咨询是否免费体检</li>
        <li>发证：完成后3个工作日下午14:00-17:00领取</li>
      </ul>
      <div class="st-section-title">换汇/汇款</div>
      <ul class="st-bullet-list">
        <li>换汇前带：护照、签证、录取通知书、身份证</li>
        <li>购汇流程（中行举例）：手机银行搜"购汇"→选账户/币种(英镑)/现汇→输入金额/用途(境外留学)→确认→验证码</li>
        <li>随身现金：出境限等值1万美元（超额需携带证），入英超1万欧元须申报</li>
        <li>电汇：1-5工作日到账，需收款人姓名/开户行/SWIFT CODE，手续费较高</li>
        <li>汇票：可自行携带出境，丢失可全额挂失，但多数校方偏好线上缴费</li>
        <li>国际信用卡：父母办主卡，附属卡限额度；境外刷VISA/万事达方便，保管好安全码</li>
      </ul>
      <div class="st-section-title">行李清单</div>
      <div class="st-section-title" style="font-size:0.84rem;border-bottom:none;margin-bottom:4px;">托运行李（20-30kg，28-30寸箱）</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>四季衣物、鞋子、内衣袜子</li>
        <li><span class="st-checklist-icon"></span>指甲刀套装、针线盒</li>
        <li><span class="st-checklist-icon"></span>万用排插2个、英标转换插头多个</li>
        <li><span class="st-checklist-icon"></span>迷你电饭煲（可到英后留学生群二手收）、便携餐具、调味品</li>
        <li><span class="st-checklist-icon"></span>笔记本、U盘</li>
        <li><span class="st-checklist-icon"></span>床上用品、洗漱用品、备用眼镜</li>
      </ul>
      <div class="st-section-title" style="font-size:0.84rem;border-bottom:none;margin-bottom:4px;margin-top:12px;">随身行李（7-10kg，20寸箱）</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>电子产品：相机/手机/耳机/笔记本/充电宝/充电器</li>
        <li><span class="st-checklist-icon"></span>证件：护照+2寸彩照8张+国际健康证+疫苗接种证+肺结核报告+eVisa打印件</li>
        <li><span class="st-checklist-icon"></span>资金：汇票/银行卡/英镑现金/校方押金收据</li>
        <li><span class="st-checklist-icon"></span>学术材料：毕业证+学位证+成绩单原件及翻译件+语言成绩单</li>
        <li><span class="st-checklist-icon"></span>住宿：住宿合同/offer+英国详细住址及联系电话</li>
        <li><span class="st-checklist-icon"></span>其他：雨伞、冲锋衣、英国电话卡</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>重要提醒：英国风大雨多，雨伞和冲锋衣必备；转换插头多带几个，排插2个够用；出发前称重避免超重；超重物品可走空运约800元/次；电饭煲可到英后留学生群提前预定二手；女性内衣尺码英国最小32A/70A，鞋码女鞋最小36码男鞋40码，均可网购</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">三、落地事宜</span></div>
    <div class="st-card-body">
      <div class="st-section-title">手机通讯</div>
      <ul class="st-bullet-list">
        <li>本地运营商：Three（覆盖广）/ Vodafone（国际通话方便）/ O2 / EE</li>
        <li>虚拟运营商：giffgaff / Lebara / Tesco Mobile / Lycamobile（资费便宜、无需审核、信号中等）</li>
        <li>中国运营商英国分部：中国电信/中国移动/中国联通</li>
        <li>国际拨号：英→中 座机0086+区号(去0)+号码，手机0086+手机号<br>中→英 座机0044+区号(去0)+号码，手机0044+手机号(去首位0)</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>到达学校后第一时间打电话回家报平安！</span></div>
      <div class="st-section-title">办理入住</div>
      <p style="font-size:0.86rem;color:#374151;">携带护照、CAS、押金凭证到宿舍办公室/公寓办理</p>
      <div class="st-section-title">学校注册</div>
      <ul class="st-bullet-list">
        <li>线上：凭校方邮件激活学生系统，完善信息核对课业费用</li>
        <li>线下：到学生中心领学生证，备好毕业证/学位证/成绩单/护照/CAS/缴费凭证</li>
        <li>eVisa：2025年起停用实体BRP卡，统一eVisa电子签证，获签后按官网指引开通</li>
      </ul>
      <div class="st-section-title">银行卡办理</div>
      <ul class="st-bullet-list">
        <li>主要银行：HSBC / Lloyds / Santander / NatWest / Barclays / Starling</li>
        <li>必备文件：护照+有效签证+学校开具的BANK LETTER</li>
        <li>BANK LETTER获取：学校内部信息平台申请，或邮件至学院/学生中心</li>
        <li>账户类型：Current Account（消费）+ Saving Account（存款），利息不同</li>
        <li>流程：官网预约→到店填表申请→1-2周分批收到银行卡和密码函→激活</li>
        <li>开户耗时久，建议提前线上预约</li>
      </ul>
      <div class="st-section-title">GP注册</div>
      <ul class="st-bullet-list">
        <li>抵英务必注册GP社区医生，享受免费医疗</li>
        <li>方法一：学校统一组织，现场填表</li>
        <li>方法二：NHS网站查最近GP，前往注册 <a href="https://www.nhs.uk/service-search/find-a-gp" target="_blank">https://www.nhs.uk/service-search/find-a-gp</a></li>
        <li>需携带：护照/签证+NHS号码+地址证明</li>
        <li>线上注册：部分GP支持官网填表上传</li>
        <li>线下注册（推荐）：到前台说"I'd like to register with this GP surgery"，填GMS1表</li>
        <li>1-2周收到含NHS号码的通知</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">四、留英生活</span></div>
    <div class="st-card-body">
      <div class="st-section-title">出行</div>
      <p style="font-size:0.86rem;color:#374151;">导航：Google Maps / Citymapper</p>
      <ul class="st-bullet-list">
        <li>巴士：覆盖广，购票APP：NXBus Ticket</li>
        <li>地铁：仅伦敦/格拉斯哥/纽卡斯尔三地</li>
        <li>火车：城际首选，购票APP：Trainline / Trainpal，办Railcard享折扣</li>
        <li>私人交通：类似滴滴，Uber等</li>
      </ul>
      <div class="st-section-title">超市推荐</div>
      <ul class="st-bullet-list">
        <li>低价：ALDI/LIDL（自有品牌为主，性价比高）/ Iceland/ASDA（冷冻+低价）</li>
        <li>日常：TESCO（品类全门店多，留学生最常用）/ Sainsbury's（性价比稳定）</li>
        <li>品质：M&S玛莎（网红超市，烘焙甜品出名）/ Waitrose（有机食品多，品质上乘）</li>
        <li>便利：Morrisons/COOP（社区覆盖，日常采购方便）</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">五、毕业回国</span></div>
    <div class="st-card-body">
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>论文提交后约3个月学校账户和邮箱可能注销，提前下载保存重要信息</li>
        <li><span class="st-checklist-icon"></span>退房时拍视频留证，与公寓负责人一起检查，确保退押金的卡未过期</li>
        <li><span class="st-checklist-icon"></span>注销手机卡（确认合约是否需解约）、银行卡（清余额后致电注销）</li>
        <li><span class="st-checklist-icon"></span>取消自动续费订阅（Netflix/Spotify/Amazon Prime/健身房等）</li>
        <li><span class="st-checklist-icon"></span>GP注销：学校关联的通常自动失效；单独注册的需到诊所填注销表</li>
        <li><span class="st-checklist-icon"></span>邮寄行李：提前1月找物流，海运慢建议提前4周寄出</li>
        <li><span class="st-checklist-icon"></span>检查公寓信箱：留意政府/银行各类信件通知</li>
        <li><span class="st-checklist-icon"></span>落户准备：回国前在支付宝搜"移民局"核对出入境记录，确认境外学习时长</li>
        <li><span class="st-checklist-icon"></span>学历认证：教育部留学服务中心网站在线申请→注册→缴费→提交材料</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">06</span><span class="st-card-title">六、留英发展</span></div>
    <div class="st-card-body">
      <div class="st-section-title">PSW签证（Graduate Visa）</div>
      <ul class="st-bullet-list">
        <li>申请要求：持有效学生签、本科及以上学位、最低在英学时≥12个月</li>
        <li>申请材料：护照+CAS+E-visa</li>
        <li>流程：GOV.UK在线填表→ID Check APP上传材料→约8周出结果</li>
        <li>注意：政策正在逐步收紧</li>
      </ul>
      <div class="st-section-title">Skilled Worker签证（T2）</div>
      <ul class="st-bullet-list">
        <li>申请要求：受合规英企聘用+雇主担保函(CoS)+岗位符合要求+薪资达标</li>
        <li>申请材料：职业代码+雇主名称及担保号+职称及年薪</li>
        <li>流程：<a href="https://www.gov.uk/skilled-worker-visa" target="_blank">https://www.gov.uk/skilled-worker-visa</a> 线上申请，境外约3周/境内约8周出结果</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">07</span><span class="st-card-title">七、安全保障</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>人身安全：避免夜间独自行走，优先选公共交通</li>
        <li>交通安全：英国靠左行驶，与国内相反</li>
        <li>金融安全：警惕陌生来电，银行不会电话索要账户密码</li>
        <li>信息安全：不在公开网络平台透露隐私信息</li>
      </ul>
      <div class="st-section-title">紧急求助电话</div>
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">紧急报警/救护/火警</div><div class="st-igi-value">999</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">非紧急报警</div><div class="st-igi-value">101</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">非紧急医疗</div><div class="st-igi-value">111</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">中国驻英大使馆(伦敦)</div><div class="st-igi-value" style="font-size:0.82rem;">+44-07810792326</div><div class="st-igi-sub">工作日 / 非工作时间 +86-10-12308</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">驻曼彻斯特总领馆</div><div class="st-igi-value" style="font-size:0.88rem;">+44-161-2248986</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">驻爱丁堡总领馆</div><div class="st-igi-value" style="font-size:0.88rem;">+44-131-3374449</div></div>
        <div class="st-info-grid-item" style="grid-column:span 2;"><div class="st-igi-label">驻贝尔法斯特总领馆</div><div class="st-igi-value" style="font-size:0.88rem;">+44-7895306461</div></div>
      </div>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【留英行前指南——从签证到落地全流程】

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
    },
    'degree_auth': {
        title: '境外学历认证指南',
        icon: 'fa-certificate',
        tag: '国（境）外学历学位认证',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-certificate"></i></div>
    <h1>境外学历认证指南</h1>
    <span class="st-tag">国（境）外学历学位认证</span>
  </div>

  <div class="st-hint-bar st-info" style="margin-bottom:16px;"><span class="st-hint-icon">🌐</span><span>认证官网：教育部留学服务中心网上服务大厅 <a href="http://zwfw.cscse.edu.cn/" target="_blank">http://zwfw.cscse.edu.cn/</a></span></div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">一、注册账号</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>登录官网 → 点击上方"登录" → 个人用户登录 → 立即注册</li>
        <li>手机验证（推荐）或邮箱验证，获取6位验证码完成校验</li>
        <li>填写真实姓名、国籍、证件类型、证件号码、手机号、邮箱</li>
        <li>中国内地居民：姓名+证件号务必准确，注册后不可修改</li>
        <li>外籍学生：大写字母，按护照姓名从上到下、从左到右输入</li>
        <li>密码8-18位，含数字+大小写字母+特殊符号</li>
        <li>注册完成后保存短信/邮件中的用户名和密码</li>
        <li>忘记密码：选"忘记密码"→手机/邮箱验证重置；均不可用选"人工找回"</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">二、提交认证申请（9步）</span></div>
    <div class="st-card-body">
      <div class="st-tag-list">
        <div class="st-tag-item"><span class="st-tag-num">1</span>实人认证，获取出入境记录</div>
        <div class="st-tag-item"><span class="st-tag-num">2</span>填写申请人基本信息</div>
        <div class="st-tag-item"><span class="st-tag-num">3</span>选择申请类型</div>
        <div class="st-tag-item"><span class="st-tag-num">4</span>填写认证申请信息</div>
        <div class="st-tag-item"><span class="st-tag-num">5</span>填写学习经历</div>
        <div class="st-tag-item"><span class="st-tag-num">6</span>上传认证材料</div>
        <div class="st-tag-item"><span class="st-tag-num">7</span>确认申请信息并提交</div>
        <div class="st-tag-item"><span class="st-tag-num">8</span>在线支付认证费用</div>
        <div class="st-tag-item"><span class="st-tag-num">9</span>认证申请提交成功</div>
      </div>

      <div class="st-section-title">第1步：实人认证，获取出入境记录</div>
      <ul class="st-bullet-list">
        <li>方式一（推荐）：用"移民局12367"APP或小程序→人脸识别→获取8位授权码→授权留服中心获取出入境记录</li>
        <li>方式二：无法获取授权码时选"无法获取出入境记录"（注意：此途径可能延长认证周期）</li>
        <li>实人认证：用"微留服"小程序扫码进行人脸识别</li>
      </ul>

      <div class="st-section-title">第2步：填写申请人基本信息</div>
      <p style="font-size:0.86rem;color:#374151;">确认无误后点击"下一步"</p>

      <div class="st-section-title">第3步：选择申请类型</div>
      <p style="font-size:0.86rem;color:#374151;">选择"国（境）外学历学位认证"</p>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">💡</span><span>注：中外合作办学学历选"中外合作办学学历学位认证"</span></div>

      <div class="st-section-title">第4步：填写认证申请信息</div>
      <ul class="st-bullet-list">
        <li>一份申请只能认证一个学历学位</li>
        <li>多个学历学位需分别提交申请</li>
        <li>确保填写信息与上传材料一致</li>
      </ul>

      <div class="st-section-title">第5步：填写学习经历</div>
      <ul class="st-bullet-list">
        <li>从高中阶段开始填写，至少两条经历</li>
        <li>上一步已填的会自动添加，需点"新增"补充其他</li>
      </ul>

      <div class="st-section-title">第6步：上传认证材料</div>
      <ul class="st-bullet-list">
        <li>注意红色字体提示，按要求上传</li>
        <li>大部分院校授权声明在线自动生成，申请人只需在线签署</li>
        <li>个别院校需手动上传特殊版本授权声明</li>
        <li>页面附材料模板和填写样例可参考</li>
      </ul>

      <div class="st-section-title">第7步：确认申请信息并提交</div>
      <ul class="st-bullet-list">
        <li>核对个人信息及认证信息，有误可返回修改</li>
        <li>确认无误→勾选保证书→点击"提交"</li>
      </ul>

      <div class="st-section-title">第8步：在线支付认证费用</div>
      <ul class="st-bullet-list">
        <li>费用：360元/份</li>
        <li>支付方式：微信或支付宝</li>
        <li>付款后点击"支付成功"</li>
        <li>收据：用户中心→"我的支付"→《学历学位认证费用收讫证明》，可随时打印</li>
      </ul>

      <div class="st-section-title">第9步：认证申请提交成功</div>
      <ul class="st-bullet-list">
        <li>可在"用户中心"查看认证状态和预计完成时间</li>
        <li>如需补交材料，手机和邮箱会收到通知</li>
        <li>认证完成后可登录查看电子认证书并自行打印</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">三、认证进度与补材料</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>查看状态：用户中心→我的申请→点击"查看"</li>
        <li>补材料通知：短信/邮件通知→登录系统→点击"补材料"→按链接内容补交</li>
        <li>额外添加材料：原材料不变，额外上传新材料</li>
        <li>重新上传材料：退回指定材料，重新上传正确版本</li>
        <li>线下补材料：点击"线下补材料"→按通知补充</li>
        <li>通知消息：仅需阅读，无需补充材料</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">四、中外合作办学认证</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>申请类型选"中外合作办学学历学位认证"</li>
        <li>本科及以上：系统用身份证号检索合作办学学生注册数据库<br>- 已注册→自动匹配信息→补填其他信息<br>- 未注册→2012年9月后入学的联系中方院校；9月前的点"下一步"</li>
        <li>专科层次/2012年9月前入学：下拉菜单选择项目名称→填写信息</li>
        <li>其他流程与境外学历认证一致</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">五、认证结果复核</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>适用情况：对认证结果有异议</li>
        <li>申请时限：获得认证结果后12个月内</li>
        <li>提供虚假材料/不实信息：需在10个工作日内申请复核</li>
        <li>操作：用户中心→我的申请→操作栏选"复核"→阅读《复核需知》→填写原因→上传补充材料（最多50张，≤1M的jpg/jpeg）→提交</li>
        <li>查看状态：用户中心→复核申请状态</li>
        <li>复核完成：认证状态变为"认证完成"→查看证书</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">06</span><span class="st-card-title">六、认证退费</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>退费条件：认证结果为《暂不认证通知单》</li>
        <li>不退费情况：因提供虚假材料导致不予认证</li>
        <li>退费周期：一般15个工作日，特殊情况可能延长</li>
        <li>咨询邮箱：renzheng@cscse.edu.cn</li>
      </ul>
      <div class="st-section-title">退费操作（按申请时间）</div>
      <ul class="st-bullet-list">
        <li>2019年6月28日前申请：注册登录→用户中心→我的支付→退费记录→退费条件审核→同意后退费申请填账户信息</li>
        <li>2019.6.28—2022.11.30申请：登录原账户→用户中心→我的支付→付费记录→点退费按钮→1年内退原支付卡/超1年填退费账户</li>
        <li>2022年11月30日后：费用自动退回原支付账户（复核需重新缴费）</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">07</span><span class="st-card-title">七、常见问题速查</span></div>
    <div class="st-card-body">
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>认证需要多长时间？<br>A：视材料完整度而定，补材料会延长周期；建议尽早申请</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>多个学历可以一起认证吗？<br>A：不可以，一份申请只认证一个学历，多个需分别提交</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>手机号无法接收验证码怎么办？<br>A：仅限国（境）内手机号；境外手机号无法收短信，改用邮箱验证</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>注册后姓名/证件号可以修改吗？<br>A：中国内地居民注册后不可修改，务必一次填对</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>认证费用可以代付吗？<br>A：可以，建议由亲友微信/支付宝代付</span></div>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【国（境）外学历学位认证操作指引】

认证官网：教育部留学服务中心网上服务大厅
http://zwfw.cscse.edu.cn/

━━ 一、注册账号 ━━

• 登录官网 → 点击上方"登录" → 个人用户登录 → 立即注册
• 手机验证（推荐）或邮箱验证，获取6位验证码完成校验
• 填写真实姓名、国籍、证件类型、证件号码、手机号、邮箱
• 中国内地居民：姓名+证件号务必准确，注册后不可修改
• 外籍学生：大写字母，按护照姓名从上到下、从左到右输入
• 密码8-18位，含数字+大小写字母+特殊符号
• 注册完成后保存短信/邮件中的用户名和密码
• 忘记密码：选"忘记密码"→手机/邮箱验证重置；均不可用选"人工找回"

━━ 二、提交认证申请（9步） ━━

【第1步：实人认证，获取出入境记录】
• 方式一（推荐）：用"移民局12367"APP或小程序→人脸识别→获取8位授权码→授权留服中心获取出入境记录
• 方式二：无法获取授权码时选"无法获取出入境记录"（注意：此途径可能延长认证周期）
• 实人认证：用"微留服"小程序扫码进行人脸识别

【第2步：填写申请人基本信息】确认无误后点击"下一步"

【第3步：选择申请类型】选择"国（境）外学历学位认证"
注：中外合作办学学历选"中外合作办学学历学位认证"

【第4步：填写认证申请信息】
• 一份申请只能认证一个学历学位
• 多个学历学位需分别提交申请
• 确保填写信息与上传材料一致

【第5步：填写学习经历】
• 从高中阶段开始填写，至少两条经历
• 上一步已填的会自动添加，需点"新增"补充其他

【第6步：上传认证材料】
• 注意红色字体提示，按要求上传
• 大部分院校授权声明在线自动生成，申请人只需在线签署
• 个别院校需手动上传特殊版本授权声明
• 页面附材料模板和填写样例可参考

【第7步：确认申请信息并提交】
• 核对个人信息及认证信息，有误可返回修改
• 确认无误→勾选保证书→点击"提交"

【第8步：在线支付认证费用】
• 费用：360元/份
• 支付方式：微信或支付宝
• 付款后点击"支付成功"
• 收据：用户中心→"我的支付"→《学历学位认证费用收讫证明》，可随时打印

【第9步：认证申请提交成功】
• 可在"用户中心"查看认证状态和预计完成时间
• 如需补交材料，手机和邮箱会收到通知
• 认证完成后可登录查看电子认证书并自行打印

━━ 三、认证进度与补材料 ━━

• 查看状态：用户中心→我的申请→点击"查看"
• 补材料通知：短信/邮件通知→登录系统→点击"补材料"→按链接内容补交
• 额外添加材料：原材料不变，额外上传新材料
• 重新上传材料：退回指定材料，重新上传正确版本
• 线下补材料：点击"线下补材料"→按通知补充
• 通知消息：仅需阅读，无需补充材料

━━ 四、中外合作办学认证 ━━

• 申请类型选"中外合作办学学历学位认证"
• 本科及以上：系统用身份证号检索合作办学学生注册数据库
  - 已注册→自动匹配信息→补填其他信息
  - 未注册→2012年9月后入学的联系中方院校；9月前的点"下一步"
• 专科层次/2012年9月前入学：下拉菜单选择项目名称→填写信息
• 其他流程与境外学历认证一致

━━ 五、认证结果复核 ━━

• 适用情况：对认证结果有异议
• 申请时限：获得认证结果后12个月内
• 提供虚假材料/不实信息：需在10个工作日内申请复核
• 操作：用户中心→我的申请→操作栏选"复核"→阅读《复核需知》→填写原因→上传补充材料（最多50张，≤1M的jpg/jpeg）→提交
• 查看状态：用户中心→复核申请状态
• 复核完成：认证状态变为"认证完成"→查看证书

━━ 六、认证退费 ━━

• 退费条件：认证结果为《暂不认证通知单》
• 不退费情况：因提供虚假材料导致不予认证
• 退费周期：一般15个工作日，特殊情况可能延长
• 咨询邮箱：renzheng@cscse.edu.cn

退费操作（按申请时间）：
• 2019年6月28日前申请：注册登录→用户中心→我的支付→退费记录→退费条件审核→同意后退费申请填账户信息
• 2019.6.28—2022.11.30申请：登录原账户→用户中心→我的支付→付费记录→点退费按钮→1年内退原支付卡/超1年填退费账户
• 2022年11月30日后：费用自动退回原支付账户（复核需重新缴费）

━━ 七、常见问题速查 ━━

Q：认证需要多长时间？
A：视材料完整度而定，补材料会延长周期；建议尽早申请

Q：多个学历可以一起认证吗？
A：不可以，一份申请只认证一个学历，多个需分别提交

Q：手机号无法接收验证码怎么办？
A：仅限国（境）内手机号；境外手机号无法收短信，改用邮箱验证

Q：注册后姓名/证件号可以修改吗？
A：中国内地居民注册后不可修改，务必一次填对

Q：认证费用可以代付吗？
A：可以，建议由亲友微信/支付宝代付
`
    },
    'ireland_predeparture': {
        title: '爱尔兰行前指南',
        icon: 'fa-shamrock',
        tag: '入境 · IRP · 行李 · 生活',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-shamrock"></i></div>
    <h1>爱尔兰行前指南</h1>
    <span class="st-tag">入境 · IRP · 行李 · 生活</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">一、出发与入境</span></div>
    <div class="st-card-body">
      <div class="st-section-title">航班与登机</div>
      <ul class="st-bullet-list">
        <li>国际航班提前3小时办理登机手续，建议提前抵达机场</li>
        <li>行李托运及海关出境人数较多，预留充足时间</li>
      </ul>
      <div class="st-section-title">入境检查</div>
      <ul class="st-bullet-list">
        <li>中国学生在NON-EU（非欧盟）通道排队入境</li>
        <li>入境官员可能简单询问：去哪个学校、读什么专业等</li>
      </ul>
      <div class="st-section-title">入境必须文件清单</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>护照原件</li>
        <li><span class="st-checklist-icon"></span>有效入境签证（通常自签发之日起3个月有效）</li>
        <li><span class="st-checklist-icon"></span>学校录取通知书（打印件即可）</li>
        <li><span class="st-checklist-icon"></span>学费收据</li>
        <li><span class="st-checklist-icon"></span>毕业证书等学术材料中英文原件或公证件</li>
        <li><span class="st-checklist-icon"></span>住宿相关信息（若有）</li>
        <li><span class="st-checklist-icon"></span>保险证明</li>
        <li><span class="st-checklist-icon"></span>出生证附加证明书（海牙认证）</li>
        <li><span class="st-checklist-icon"></span>欧元现金备用（建议3000-4000欧元）</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>重要：入境文件务必随身携带，不要放托运行李！</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">二、落地必办事项</span></div>
    <div class="st-card-body">
      <div class="st-section-title">到校注册</div>
      <ul class="st-bullet-list">
        <li>准时到校报到，注册学生卡</li>
        <li>办理银行卡等信息</li>
      </ul>
      <div class="st-section-title">IRP居留卡办理（最重要！）</div>
      <ul class="st-bullet-list">
        <li>IRP = Irish Residence Permit，留学生在爱尔兰合法居留的身份证明</li>
        <li>有效期通常与课程长度一致</li>
        <li>办理时限：入境后90天内必须办理</li>
        <li>办理方式：通过ISD官网预约<br><a href="https://www.irishimmigration.ie/registering-your-immigration-permission/how-to-register-your-immigration-permission-for-the-first-time/" target="_blank">https://www.irishimmigration.ie/registering-your-immigration-permission/how-to-register-your-immigration-permission-for-the-first-time/</a></li>
        <li>预约后按指定时间前往办理点，携带护照+学校注册证明+资金证明等</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>IRP务必提醒入境90天内办理，逾期影响合法居留！</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">三、行李准备</span></div>
    <div class="st-card-body">
      <div class="st-hint-bar st-tip"><span class="st-hint-icon">✅</span><span>核心原则：行李精简为主，大部分生活用品当地超市可买</span></div>
      <div class="st-section-title">必带物品</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>英标转换插头 + 接线板</li>
        <li><span class="st-checklist-icon"></span>常用药品（附药品说明书，尽量不携中药；大量处方药需中英文医嘱）</li>
        <li><span class="st-checklist-icon"></span>小五金工具</li>
      </ul>
      <div class="st-section-title">厨房类</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>简易厨房用具（或到爱后收留学生二手，便宜划算）</li>
        <li><span class="st-checklist-icon"></span>其他调料等亚洲超市可买</li>
      </ul>
      <div class="st-section-title">服装类</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>棉制内衣裤、短袖衬衣、牛仔裤</li>
        <li><span class="st-checklist-icon"></span>防雨休闲服装（爱尔兰多雨，防水外套必备）</li>
      </ul>
      <div class="st-section-title">床上用品</div>
      <p style="font-size:0.86rem;color:#374151;">轻便床品即可，当地也可购买</p>
      <div class="st-section-title">其他</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>运动鞋（日常通勤以步行为主）</li>
        <li><span class="st-checklist-icon"></span>拖鞋（宿舍和酒店不提供）</li>
        <li><span class="st-checklist-icon"></span>备用眼镜/隐形眼镜（当地较贵，多备一些）</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>提醒：药品须留说明书，大量处方药需中英文医嘱；爱尔兰与英国一样使用英标插头，转换插头多带几个</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">四、爱尔兰生活速览</span></div>
    <div class="st-card-body">
      <div class="st-section-title">气候</div>
      <ul class="st-bullet-list">
        <li>温带海洋性气候，全年温和但多雨</li>
        <li>冬季湿冷，夏季凉爽（15-20°C），防雨装备是刚需</li>
      </ul>
      <div class="st-section-title">交通</div>
      <ul class="st-bullet-list">
        <li>都柏林：LUAS轻轨 + DART通勤铁路 + 公交 + 步行</li>
        <li>城际：Bus Éireann长途巴士 / Iarnród Éireann火车</li>
        <li>打车：FreeNow（类似滴滴）/ 街边招手</li>
      </ul>
      <div class="st-section-title">支付</div>
      <ul class="st-bullet-list">
        <li>通用货币：欧元（€）</li>
        <li>刷卡非常普及，Visa/Mastercard几乎通吃</li>
        <li>现金少带，日常刷卡或Apple Pay即可</li>
      </ul>
      <div class="st-section-title">通讯</div>
      <ul class="st-bullet-list">
        <li>主流运营商：Three / Vodafone / Eir / Tesco Mobile</li>
        <li>预付费SIM卡便利店可买，资费便宜</li>
        <li>拨号：爱→中 0086+号码；中→爱 00353+号码（去首位0）</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">五、紧急联系方式</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">爱尔兰报警/急救/火警</div><div class="st-igi-value">999 / 112</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">驻爱尔兰使馆领保协助</div><div class="st-igi-value" style="font-size:0.82rem;">00353-872239198</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">外交部全球领保应急呼叫中心</div><div class="st-igi-value" style="font-size:0.82rem;">+86-10-65612308</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">领事直通车微信公众号</div><div class="st-igi-value" style="font-size:0.88rem;">ls12308</div></div>
      </div>
      <p style="font-size:0.86rem;color:#374151;margin-top:8px;">爱尔兰警察官网：<a href="https://garda.ie" target="_blank">garda.ie</a></p>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【爱尔兰留学行前指南——从出发到落地全流程】

━━ 一、出发与入境 ━━

【航班与登机】
• 国际航班提前3小时办理登机手续，建议提前抵达机场
• 行李托运及海关出境人数较多，预留充足时间

【入境检查】
• 中国学生在NON-EU（非欧盟）通道排队入境
• 入境官员可能简单询问：去哪个学校、读什么专业等

【入境必须文件清单】
□ 护照原件
□ 有效入境签证（通常自签发之日起3个月有效）
□ 学校录取通知书（打印件即可）
□ 学费收据
□ 毕业证书等学术材料中英文原件或公证件
□ 住宿相关信息（若有）
□ 保险证明
□ 出生证附加证明书（海牙认证）
□ 欧元现金备用（建议3000-4000欧元）

⚠️ 重要：入境文件务必随身携带，不要放托运行李！

━━ 二、落地必办事项 ━━

【到校注册】
• 准时到校报到，注册学生卡
• 办理银行卡等信息

【IRP居留卡办理（最重要！）】
• IRP = Irish Residence Permit，留学生在爱尔兰合法居留的身份证明
• 有效期通常与课程长度一致
• 办理时限：入境后90天内必须办理
• 办理方式：通过ISD官网预约
  https://www.irishimmigration.ie/registering-your-immigration-permission/how-to-register-your-immigration-permission-for-the-first-time/
• 预约后按指定时间前往办理点，携带护照+学校注册证明+资金证明等

━━ 三、行李准备 ━━

【核心原则】行李精简为主，大部分生活用品当地超市可买

【必带物品】
□ 英标转换插头 + 接线板
□ 常用药品（附药品说明书，尽量不携中药；大量处方药需中英文医嘱）
□ 小五金工具

【厨房类】
□ 简易厨房用具（或到爱后收留学生二手，便宜划算）
□ 其他调料等亚洲超市可买

【服装类】
□ 棉制内衣裤、短袖衬衣、牛仔裤
□ 防雨休闲服装（爱尔兰多雨，防水外套必备）

【床上用品】
□ 轻便床品即可，当地也可购买

【其他】
□ 运动鞋（日常通勤以步行为主）
□ 拖鞋（宿舍和酒店不提供）
□ 备用眼镜/隐形眼镜（当地较贵，多备一些）

⚠️ 提醒：
• 药品须留说明书，大量处方药需中英文医嘱
• 爱尔兰与英国一样使用英标插头，转换插头多带几个

━━ 四、爱尔兰生活速览 ━━

【气候】
• 温带海洋性气候，全年温和但多雨
• 冬季湿冷，夏季凉爽（15-20°C），防雨装备是刚需

【交通】
• 都柏林：LUAS轻轨 + DART通勤铁路 + 公交 + 步行
• 城际：Bus Éireann长途巴士 / Iarnród Éireann火车
• 打车：FreeNow（类似滴滴）/ 街边招手

【支付】
• 通用货币：欧元（€）
• 刷卡非常普及，Visa/Mastercard几乎通吃
• 现金少带，日常刷卡或Apple Pay即可

【通讯】
• 主流运营商：Three / Vodafone / Eir / Tesco Mobile
• 预付费SIM卡便利店可买，资费便宜
• 拨号：爱→中 0086+号码；中→爱 00353+号码（去首位0）

━━ 五、紧急联系方式 ━━

• 爱尔兰报警/急救/火警：999 或 112
• 驻爱尔兰使馆领保协助：00353-872239198
• 外交部全球领保应急呼叫中心：+86-10-65612308
• 领事直通车微信公众号：ls12308
• 爱尔兰警察官网：garda.ie
`
    },
    'ucas': {
        title: 'UCAS申请说明',
        icon: 'fa-university',
        tag: '英国本科统一申请',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-university"></i></div>
    <h1>UCAS申请说明</h1>
    <span class="st-tag">英国本科统一申请</span>
  </div>

  <div class="st-hint-bar st-info" style="margin-bottom:16px;"><span class="st-hint-icon">🌐</span><span>官网：<a href="https://www.ucas.com" target="_blank">www.ucas.com</a></span></div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">一、UCAS简介</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>UCAS = Universities and Colleges Admissions Service（大学和学院招生服务中心）</li>
        <li>英国本科申请统一通道，约90%英国大学本科课程需通过UCAS递交</li>
        <li>一次申请最多可选5个课程（以课程为单位，同一大学两个专业算两个课程）</li>
        <li>音乐学院最多可选6个课程</li>
      </ul>
      <div class="st-section-title">不需通过UCAS的常申院校</div>
      <p style="font-size:0.86rem;color:#374151;">（通过院校自有网申或Agent系统递交）</p>
      <div class="st-tag-list">
        <div class="st-tag-item">莱斯特大学</div>
        <div class="st-tag-item">考文垂大学</div>
        <div class="st-tag-item">埃塞克斯大学</div>
        <div class="st-tag-item">诺森比亚大学</div>
        <div class="st-tag-item">曼彻斯特城市大学</div>
        <div class="st-tag-item">布鲁内尔大学</div>
        <div class="st-tag-item">伯明翰大学学院</div>
        <div class="st-tag-item">北安普顿大学</div>
        <div class="st-tag-item">普茨茅斯大学</div>
      </div>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>申请方式可能变更，以大学最新要求为准</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">二、申请费用</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">常规本科申请</div><div class="st-igi-value">£28.95</div><div class="st-igi-sub">含5个选择</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">音乐院校申请</div><div class="st-igi-value">£28.95</div><div class="st-igi-sub">含5个选择</div></div>
      </div>
      <ul class="st-bullet-list" style="margin-top:8px;">
        <li>常规本科最多同时申请5个课程，音乐学院最多6个课程</li>
        <li>1-5个课程申请费相同，申1个和申5个价格一样</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">三、申请时间线</span></div>
    <div class="st-card-body">
      <div class="st-hint-bar st-info"><span class="st-hint-icon">🔗</span><span>查询链接：<a href="https://www.ucas.com/undergraduate/applying-university/dates-and-deadlines-uni-applications" target="_blank">www.ucas.com/undergraduate/applying-university/dates-and-deadlines-uni-applications</a></span></div>
      <div class="st-section-title">常规本科关键节点（2026 Entry）</div>
      <div class="st-timeline">
        <div class="st-tl-node">
          <div class="st-tl-label">9月初</div>
          <div class="st-tl-desc">申请开放</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">10月15日 18:00(UK)</div>
          <div class="st-tl-desc">牛津/剑桥/医学/牙医/兽医课程截止</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">1月14日 18:00(UK)</div>
          <div class="st-tl-desc">大部分本科课程截止</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">6月30日</div>
          <div class="st-tl-desc">之后申请进入Clearing</div>
        </div>
      </div>
      <div class="st-section-title">音乐戏剧类关键节点（2026 Entry）</div>
      <div class="st-timeline">
        <div class="st-tl-node">
          <div class="st-tl-label">7月10日</div>
          <div class="st-tl-desc">申请开放</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">10月2日 18:00(UK)</div>
          <div class="st-tl-desc">音乐课程截止</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">1月14日 18:00(UK)</div>
          <div class="st-tl-desc">舞蹈/戏剧/音乐剧课程截止</div>
        </div>
        <div class="st-tl-node">
          <div class="st-tl-label">9月24日 18:00(UK)</div>
          <div class="st-tl-desc">音乐学院申请最终截止</div>
        </div>
      </div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">四、申请所需材料</span></div>
    <div class="st-card-body">
      <div class="st-section-title">1. 学生基本信息</div>
      <p style="font-size:0.86rem;color:#374151;">姓名、性别、生日、电话、申请邮箱、家庭地址</p>
      <div class="st-section-title">2. 院校及课程信息</div>
      <ul class="st-bullet-list">
        <li>准确告知：申请本科几年级（一年级/二年级）、课程长度、课程名称</li>
        <li>UCAS课程代码、所在校区</li>
        <li>是否选择带三明治实习（Sandwich Year）的本科课程</li>
      </ul>
      <div class="st-section-title">3. 常规申请材料</div>
      <ul class="st-checklist">
        <li><span class="st-checklist-icon"></span>PS个人陈述（Word版，详见下方PS要求）</li>
        <li><span class="st-checklist-icon"></span>在读证明/毕业证（中英文盖章版）</li>
        <li><span class="st-checklist-icon"></span>成绩单（中英文盖章版）</li>
        <li><span class="st-checklist-icon"></span>1封推荐信（详见下方推荐信要求）</li>
        <li><span class="st-checklist-icon"></span>雅思成绩（如有）</li>
        <li><span class="st-checklist-icon"></span>护照（如有英国学习经历，必须提供护照+Visa+BRP+CAS）</li>
        <li><span class="st-checklist-icon"></span>其他：荣誉证书、作品集（艺术/表演类）、资格证等（如有）</li>
        <li><span class="st-checklist-icon"></span>CV（有Gap Year或工作经验的强烈建议提供）</li>
      </ul>
      <div class="st-section-title">预估成绩说明</div>
      <ul class="st-bullet-list">
        <li>申请时未出最终成绩的，需提供预估成绩</li>
        <li>A Level：后续要考的科目都需提供预估，重考科目也要</li>
        <li>AP：同上</li>
        <li>高考：提供高考预估总分</li>
      </ul>
      <div class="st-section-title">英文件说明</div>
      <p style="font-size:0.86rem;color:#374151;">非英文材料必须提供英文翻译件，且需加盖学校或正规翻译公章</p>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">五、PS个人陈述要求</span></div>
    <div class="st-card-body">
      <div class="st-section-title">格式要求</div>
      <ul class="st-bullet-list">
        <li>Word版本提交（系统粘贴用）</li>
        <li>不超过4000个字符（含空格和标点），不超过47行</li>
        <li>多一个字符/多一行都会导致提交失败</li>
        <li>严禁中文字符标点符号（会导致系统无法识别）</li>
        <li>通用版本PS，不要出现任何大学名称</li>
      </ul>
      <div class="st-section-title">内容要求——3个问题逐一解答</div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q1</span><span><strong>Why do you want to study this course or subject?</strong><br>你为何希望学习这门课程或这个专业？<br>展开方向：学习该课程的动机 / 对该学科领域的了解和兴趣 / 未来规划及为何该课程适合你</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q2</span><span><strong>How have your qualifications and studies helped you to prepare for this course or subject?</strong><br>你的学历背景和过往学习经历如何帮助你做准备？<br>展开方向：学习/培训与所选课程的关联 / 相关的或可迁移的技能 / 相关教育成就</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q3</span><span><strong>What else have you done to prepare outside education, and why are these experiences useful?</strong><br>学业之外你还做过哪些准备？这些经历为何有帮助？<br>展开方向：工作经验/实习/志愿服务 / 个人生活经历或责任 / 兴趣爱好、课外活动 / 校外成就 / 毕业后的活动</span></div>
      <div class="st-section-title">音乐学院PS</div>
      <ul class="st-bullet-list">
        <li>除上述通用内容外，还需体现：</li>
        <li>申请该专业的具体原因和目标</li>
        <li>所选课程的理由（每所音乐学院都能看到其他申请）</li>
        <li>专业方向（演奏乐器/表演/指挥/舞台设计等）</li>
        <li>专业领域的经验</li>
        <li>适合性：如国家/国际乐团/合唱团成员、相关技能和成就</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">06</span><span class="st-card-title">六、推荐信要求</span></div>
    <div class="st-card-body">
      <div class="st-section-title">通过机构UCAS账户递交</div>
      <ul class="st-bullet-list">
        <li>需提供两版：Word版（内容粘贴至UCAS系统）+ 抬头纸打印签字扫描版（递交后发所申院校）</li>
        <li>推荐信按UCAS三个问题格式撰写</li>
        <li>如推荐老师未按三问题格式写，默认将全部内容粘贴在第一个板块</li>
      </ul>
      <div class="st-section-title">以个人名义递交</div>
      <ul class="st-bullet-list">
        <li>推荐老师自行上传推荐信，具体形式以推荐老师收到的邮件通知为准</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">07</span><span class="st-card-title">七、递交方式</span></div>
    <div class="st-card-body">
      <div class="st-section-title">方式一：机构名义递交（首选）</div>
      <ul class="st-bullet-list">
        <li>需机构获UCAS官方授权，拿到Buzzword</li>
        <li>学生注册时填写机构Buzzword → 授权机构申请及跟进 → 绑定送生机构 → 大学结算佣金的重要凭证</li>
        <li>佣金结算通过Buzzword关联，务必通过自己机构的UCAS账号递交</li>
      </ul>
      <div class="st-section-title">方式二：个人名义递交</div>
      <ul class="st-bullet-list">
        <li>学生自行注册UCAS账号，填写申请并递交</li>
        <li>不需填写Buzzword，但大学只与学生本人沟通（隐私法）</li>
        <li>佣金结算风险：如需后续Link Agent，存在风险</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">08</span><span class="st-card-title">八、申请注意事项</span></div>
    <div class="st-card-body">
      <ul class="st-bullet-list">
        <li>课程个数1-5个，申请费相同，建议填满</li>
        <li>通过机构递交后，非会员院校的课程也可添加到系统，但后续其他机构Link Agent可能受影响</li>
        <li>递交后机构会打包发送材料至申请的英国大学；非会员院校需自行发送材料及跟进</li>
        <li>部分大学会将邮件发到学生邮箱（机构收不到），提醒学生收到重要邮件及时转发</li>
        <li>选校建议拉开档次：冲刺+稳妥+保底，确保至少拿到一个Offer</li>
        <li>Offer发放：系统显示有Offer后，需等所有院校出结果，大学才会单独发电子版Offer Letter</li>
        <li>Offer接受：所有专业出结果后，UCAS要求在截止日期前选择第一志愿（Firm Choice）和第二志愿（Insurance Choice），其余Offer自动撤销</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>第二志愿务必是保底院校，确保学生能满足条件</span></div>
      <ul class="st-bullet-list">
        <li>换无条件Offer：需单独发材料给大学本科Admission部门申请（UCAS系统中无法上传材料）</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">09</span><span class="st-card-title">九、常见Q&amp;A</span></div>
    <div class="st-card-body">
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>学生个人账户递交的UCAS，可以Link Agent结算佣金吗？<br>A：有佣金结算风险。如接受风险，需在UCAS递交后48小时内将学生信息及材料发给机构向大学申请Link Agent。能否Link成功以大学回复及最终佣金结算为准。</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>学生自己注册了UCAS账号（无Buzzword）但未递交，可以转给机构操作吗？<br>A：可以，但必须在推荐老师上传推荐信之前添加机构的Buzzword。</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>学生学校已帮注册UCAS账户，还能通过机构递交吗？<br>A：原则上不行，学校注册时会录入自己的Buzzword，Buzzword具有排他性。</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>申请课程中只有1个是佣金课程，机构能接单吗？<br>A：只要有1个佣金课程就可以接单。非佣金课程机构不跟进，仅免费帮忙添加到系统。但需提醒：Buzzword排他性导致非佣金课程可能无法通过其他机构Link Agent，客户需综合考虑通过哪家递交更划算。</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>Social Work硕士需要通过UCAS吗？<br>A：部分大学的Social Work相关课程需通过UCAS提交，具体以大学要求为准。</span></div>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【UCAS本科申请完整指南】

官网：www.ucas.com

━━ 一、UCAS简介 ━━

UCAS = Universities and Colleges Admissions Service（大学和学院招生服务中心）
• 英国本科申请统一通道，约90%英国大学本科课程需通过UCAS递交
• 一次申请最多可选5个课程（以课程为单位，同一大学两个专业算两个课程）
• 音乐学院最多可选6个课程

【不需通过UCAS的常申院校】（通过院校自有网申或Agent系统递交）：
莱斯特大学、考文垂大学、埃塞克斯大学、诺森比亚大学、曼彻斯特城市大学、布鲁内尔大学、伯明翰大学学院、北安普顿大学、普茨茅斯大学
⚠️ 申请方式可能变更，以大学最新要求为准

━━ 二、申请费用 ━━

• 2026学年常规本科申请&音乐院校申请费均为：28.95英镑
• 常规本科最多同时申请5个课程，音乐学院最多6个课程
• 1-5个课程申请费相同，申1个和申5个价格一样

━━ 三、申请时间线 ━━

查询链接：www.ucas.com/undergraduate/applying-university/dates-and-deadlines-uni-applications

【常规本科关键节点（2026 Entry）】
• 9月初：申请开放
• 10月15日 18:00(UK)：牛津/剑桥/医学/牙医/兽医课程截止
• 1月14日 18:00(UK)：大部分本科课程截止
• 6月30日：之后申请进入Clearing

【音乐戏剧类关键节点（2026 Entry）】
• 7月10日：申请开放
• 10月2日 18:00(UK)：音乐课程截止
• 1月14日 18:00(UK)：舞蹈/戏剧/音乐剧课程截止
• 9月24日 18:00(UK)：音乐学院申请最终截止

━━ 四、申请所需材料 ━━

【1. 学生基本信息】
姓名、性别、生日、电话、申请邮箱、家庭地址

【2. 院校及课程信息】
• 准确告知：申请本科几年级（一年级/二年级）、课程长度、课程名称
• UCAS课程代码、所在校区
• 是否选择带三明治实习（Sandwich Year）的本科课程

【3. 常规申请材料】
□ PS个人陈述（Word版，详见下方PS要求）
□ 在读证明/毕业证（中英文盖章版）
□ 成绩单（中英文盖章版）
□ 1封推荐信（详见下方推荐信要求）
□ 雅思成绩（如有）
□ 护照（如有英国学习经历，必须提供护照+Visa+BRP+CAS）
□ 其他：荣誉证书、作品集（艺术/表演类）、资格证等（如有）
□ CV（有Gap Year或工作经验的强烈建议提供）

【预估成绩说明】
• 申请时未出最终成绩的，需提供预估成绩
• A Level：后续要考的科目都需提供预估，重考科目也要
• AP：同上
• 高考：提供高考预估总分

【英文件说明】
• 非英文材料必须提供英文翻译件，且需加盖学校或正规翻译公章

━━ 五、PS个人陈述要求 ━━

【格式要求】
• Word版本提交（系统粘贴用）
• 不超过4000个字符（含空格和标点），不超过47行
• 多一个字符/多一行都会导致提交失败
• 严禁中文字符标点符号（会导致系统无法识别）
• 通用版本PS，不要出现任何大学名称

【内容要求——3个问题逐一解答】

Question 1: Why do you want to study this course or subject?
你为何希望学习这门课程或这个专业？
展开方向：
• 学习该课程的动机
• 对该学科领域的了解和兴趣
• 未来规划及为何该课程适合你

Question 2: How have your qualifications and studies helped you to prepare for this course or subject?
你的学历背景和过往学习经历如何帮助你做准备？
展开方向：
• 学习/培训与所选课程的关联
• 相关的或可迁移的技能
• 相关教育成就

Question 3: What else have you done to prepare outside education, and why are these experiences useful?
学业之外你还做过哪些准备？这些经历为何有帮助？
展开方向：
• 工作经验/实习/志愿服务
• 个人生活经历或责任
• 兴趣爱好、课外活动
• 校外成就
• 毕业后的活动

【音乐学院PS】
除上述通用内容外，还需体现：
• 申请该专业的具体原因和目标
• 所选课程的理由（每所音乐学院都能看到其他申请）
• 专业方向（演奏乐器/表演/指挥/舞台设计等）
• 专业领域的经验
• 适合性：如国家/国际乐团/合唱团成员、相关技能和成就

━━ 六、推荐信要求 ━━

【通过机构UCAS账户递交】
• 需提供两版：Word版（内容粘贴至UCAS系统）+ 抬头纸打印签字扫描版（递交后发所申院校）
• 推荐信按UCAS三个问题格式撰写
• 如推荐老师未按三问题格式写，默认将全部内容粘贴在第一个板块

【以个人名义递交】
• 推荐老师自行上传推荐信，具体形式以推荐老师收到的邮件通知为准

━━ 七、递交方式 ━━

【方式一：机构名义递交（首选）】
• 需机构获UCAS官方授权，拿到Buzzword
• 学生注册时填写机构Buzzword → 授权机构申请及跟进 → 绑定送生机构 → 大学结算佣金的重要凭证
• 佣金结算通过Buzzword关联，务必通过自己机构的UCAS账号递交

【方式二：个人名义递交】
• 学生自行注册UCAS账号，填写申请并递交
• 不需填写Buzzword，但大学只与学生本人沟通（隐私法）
• 佣金结算风险：如需后续Link Agent，存在风险

━━ 八、申请注意事项 ━━

1. 课程个数1-5个，申请费相同，建议填满
2. 通过机构递交后，非会员院校的课程也可添加到系统，但后续其他机构Link Agent可能受影响
3. 递交后机构会打包发送材料至申请的英国大学；非会员院校需自行发送材料及跟进
4. 部分大学会将邮件发到学生邮箱（机构收不到），提醒学生收到重要邮件及时转发
5. 选校建议拉开档次：冲刺+稳妥+保底，确保至少拿到一个Offer
6. Offer发放：系统显示有Offer后，需等所有院校出结果，大学才会单独发电子版Offer Letter
7. Offer接受：所有专业出结果后，UCAS要求在截止日期前选择第一志愿（Firm Choice）和第二志愿（Insurance Choice），其余Offer自动撤销
   ⚠️ 第二志愿务必是保底院校，确保学生能满足条件
8. 换无条件Offer：需单独发材料给大学本科Admission部门申请（UCAS系统中无法上传材料）

━━ 九、常见Q&A ━━

Q：学生个人账户递交的UCAS，可以Link Agent结算佣金吗？
A：有佣金结算风险。如接受风险，需在UCAS递交后48小时内将学生信息及材料发给机构向大学申请Link Agent。能否Link成功以大学回复及最终佣金结算为准。

Q：学生自己注册了UCAS账号（无Buzzword）但未递交，可以转给机构操作吗？
A：可以，但必须在推荐老师上传推荐信之前添加机构的Buzzword。

Q：学生学校已帮注册UCAS账户，还能通过机构递交吗？
A：原则上不行，学校注册时会录入自己的Buzzword，Buzzword具有排他性。

Q：申请课程中只有1个是佣金课程，机构能接单吗？
A：只要有1个佣金课程就可以接单。非佣金课程机构不跟进，仅免费帮忙添加到系统。但需提醒：Buzzword排他性导致非佣金课程可能无法通过其他机构Link Agent，客户需综合考虑通过哪家递交更划算。

Q：Social Work硕士需要通过UCAS吗？
A：部分大学的Social Work相关课程需通过UCAS提交，具体以大学要求为准。
`
    },
    'uk_visa': {
        title: '英国学生签证指南',
        icon: 'fa-passport',
        tag: '材料 · 保证金 · 体检 · 流程',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-passport"></i></div>
    <h1>英国学生签证指南</h1>
    <span class="st-tag">材料 · 保证金 · 体检 · 流程</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">一、签证流程</span></div>
    <div class="st-card-body">
      <div class="st-flow">
        <div class="st-flow-step">1. 获得CAS</div>
        <span class="st-flow-arrow">→</span>
        <div class="st-flow-step">2. 准备材料</div>
        <span class="st-flow-arrow">→</span>
        <div class="st-flow-step">3. 在线填表预约</div>
        <span class="st-flow-arrow">→</span>
        <div class="st-flow-step">4. 递签录入</div>
        <span class="st-flow-arrow">→</span>
        <div class="st-flow-step">5. 等待出签</div>
      </div>
      <p style="font-size:0.83rem;color:#64748b;text-align:center;margin-top:6px;">标准服务约3周，加急服务可选</p>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">二、签证材料清单</span></div>
    <div class="st-card-body">
      <div class="st-section-title">1. 护照</div>
      <ul class="st-bullet-list">
        <li>护照原件 + 整本扫描件</li>
      </ul>
      <div class="st-section-title">2. CAS</div>
      <ul class="st-bullet-list">
        <li>CAS有效期6个月，务必在有效期内递签</li>
        <li>核对CAS信息是否与实际情况一致（姓名/课程/费用等）</li>
      </ul>
      <div class="st-section-title">3. 保证金</div>
      <ul class="st-bullet-list">
        <li>时间要求：递签前至少连续存满28天</li>
        <li>存款期间不要动用，直到签证办理完毕</li>
      </ul>
      <div class="st-section-title">保证金金额计算</div>
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">伦敦地区</div><div class="st-igi-value" style="font-size:0.82rem;">1年学费+9月生活费</div><div class="st-igi-sub">£1529×9 + 学费 + £2000</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">非伦敦地区</div><div class="st-igi-value" style="font-size:0.82rem;">1年学费+9月生活费</div><div class="st-igi-sub">£1171×9 + 学费 + £2000</div></div>
      </div>
      <div class="st-section-title">存储方式</div>
      <ul class="st-bullet-list">
        <li>存学生本人或父母名下均可</li>
        <li>存成3个月定期转存</li>
        <li>存好就不要动，直到签证办完</li>
      </ul>
      <div class="st-section-title">4. 肺结核报告</div>
      <ul class="st-bullet-list">
        <li>有效期6个月，需涵盖到递签当天（保险起见涵盖到入境当天）</li>
        <li>费用：550元</li>
        <li>详见下方"肺结核体检"板块</li>
      </ul>
      <div class="st-section-title">5. 亲子关系证明</div>
      <ul class="st-bullet-list">
        <li>户口本 或 出生医学证明</li>
        <li>保证金存在父母名下时必须提供</li>
      </ul>
      <div class="st-section-title">6. ATAS证书（仅特定专业）</div>
      <ul class="st-bullet-list">
        <li>部分理工科、军事技术类专业需要</li>
        <li>CAS或Offer上会注明是否需要</li>
        <li>ATAS有效期6个月</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">三、肺结核体检</span></div>
    <div class="st-card-body">
      <div class="st-section-title">谁要做</div>
      <ul class="st-bullet-list">
        <li>需在英居留超过6个月的非欧洲经济区公民均需检查</li>
        <li>中国大陆不属于豁免国籍，必须做</li>
      </ul>
      <div class="st-section-title">在哪做</div>
      <ul class="st-bullet-list">
        <li>必须到英国签证与移民局在华指定医院</li>
        <li>查询指定机构：<a href="https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china/approved-tuberculosis-testing-clinics-in-china" target="_blank">https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china/approved-tuberculosis-testing-clinics-in-china</a></li>
        <li>查不到所在地机构 → 找最近的指定城市办理（如福建同学一般去福州）</li>
      </ul>
      <div class="st-section-title">如何预约</div>
      <ul class="st-bullet-list">
        <li>按链接提供的联系方式电话或网络预约</li>
        <li>可咨询上下班时间、体检费用、具体材料要求</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>温馨提示：不要在感冒发烧期间做检查；有严重肺病史或家族肺病史→可能被抽痰培养，需8-10周出结果；有肺结核病史→建议先到普通医院检查确认无问题后再去指定医院；感染过新冠的同学极有可能被要求痰培养，务必预留充足时间</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">四、签证费用与时间</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">申请费</div><div class="st-igi-value">£558</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">标准出签时间</div><div class="st-igi-value">约3周</div></div>
      </div>
      <div class="st-section-title">最早可申请时间</div>
      <ul class="st-bullet-list">
        <li>英国境内：开课前最早3个月</li>
        <li>英国境外：开课前最早6个月</li>
      </ul>
      <div class="st-section-title">签证中心查询</div>
      <p style="font-size:0.86rem;color:#374151;"><a href="https://visa.vfsglobal.com/chn/zh/gbr/attend-centre" target="_blank">https://visa.vfsglobal.com/chn/zh/gbr/attend-centre</a></p>
      <div class="st-section-title">递签城市</div>
      <p style="font-size:0.86rem;color:#374151;">可选择非户口所在地递签，就近选择签证中心即可</p>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">五、常见Q&amp;A</span></div>
    <div class="st-card-body">
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>保证金存多久？<br>A：递签前连续存满28天即可，建议开课前3个月提前存好，存了就别动</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>保证金存在谁名下？<br>A：学生本人或父母名下均可。父母名下需额外提供亲子关系证明</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>存款证明什么时候开？<br>A：递签前或被抽查时再开，不要提前开（有时效性），获签前勿动用资金</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>肺结核报告有效期怎么算？<br>A：6个月，需涵盖到递签当天。保险起见最好涵盖到入境当天</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>递签可以不在户口所在地吗？<br>A：可以，就近选择签证中心即可</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>ATAS是什么？都需要吗？<br>A：只有特定理工科/军事技术类专业需要，CAS上会注明，一般专业不需要</span></div>
      <div class="st-hint-bar st-info"><span class="st-hint-icon">Q</span><span>签证被抽查保证金怎么办？<br>A：如收到抽查通知，按要求在线提交存款证明等材料即可，大部分申请不会被抽查</span></div>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以官方信息为准</div>
</div>`,
        rawText: `【英国学生签证申请完整指引】

━━ 一、签证流程 ━━

1. 获得CAS（Confirmation of Acceptance for Studies）
2. 准备签证材料（见下方清单）
3. 在线填写签证申请表并预约递签
4. 前往签证中心递交材料+录指纹拍照
5. 等待出签（标准服务约3周，加急服务可选）

━━ 二、签证材料清单 ━━

【1. 护照】
• 护照原件 + 整本扫描件

【2. CAS】
• CAS有效期6个月，务必在有效期内递签
• 核对CAS信息是否与实际情况一致（姓名/课程/费用等）

【3. 保证金】
• 时间要求：递签前至少连续存满28天
• 存款期间不要动用，直到签证办理完毕

【保证金金额计算】
• 伦敦地区：1年学费 + 9个月生活费(£1529×9) + 汇率浮动余量£2000
• 非伦敦地区：1年学费 + 9个月生活费(£1171×9) + 汇率浮动余量£2000

【存储方式】
• 存学生本人或父母名下均可
• 存成3个月定期转存
• 存好就不要动，直到签证办完

【4. 肺结核报告】
• 有效期6个月，需涵盖到递签当天（保险起见涵盖到入境当天）
• 费用：550元
• 详见下方"肺结核体检"板块

【5. 亲子关系证明】
• 户口本 或 出生医学证明
• 保证金存在父母名下时必须提供

【6. ATAS证书（仅特定专业）】
• 部分理工科、军事技术类专业需要
• CAS或Offer上会注明是否需要
• ATAS有效期6个月

━━ 三、肺结核体检 ━━

【谁要做】
• 需在英居留超过6个月的非欧洲经济区公民均需检查
• 中国大陆不属于豁免国籍，必须做

【在哪做】
• 必须到英国签证与移民局在华指定医院
• 查询指定机构：https://www.gov.uk/government/publications/tuberculosis-test-for-a-uk-visa-clinics-in-china/approved-tuberculosis-testing-clinics-in-china
• 查不到所在地机构 → 找最近的指定城市办理（如福建同学一般去福州）

【如何预约】
• 按链接提供的联系方式电话或网络预约
• 可咨询上下班时间、体检费用、具体材料要求

【温馨提示】
• 不要在感冒发烧期间做检查
• 有严重肺病史或家族肺病史 → 可能被抽痰培养，需8-10周出结果
• 有肺结核病史 → 建议先到普通医院检查确认无问题后再去指定医院
• 感染过新冠的同学极有可能被要求痰培养，务必预留充足时间

━━ 四、签证费用与时间 ━━

【申请费】558英镑

【最早可申请时间】
• 英国境内：开课前最早3个月
• 英国境外：开课前最早6个月

【签证中心查询】
https://visa.vfsglobal.com/chn/zh/gbr/attend-centre

【递签城市】
• 可选择非户口所在地递签，就近选择签证中心即可

━━ 五、常见Q&A ━━

Q：保证金存多久？
A：递签前连续存满28天即可，建议开课前3个月提前存好，存了就别动

Q：保证金存在谁名下？
A：学生本人或父母名下均可。父母名下需额外提供亲子关系证明

Q：存款证明什么时候开？
A：递签前或被抽查时再开，不要提前开（有时效性），获签前勿动用资金

Q：肺结核报告有效期怎么算？
A：6个月，需涵盖到递签当天。保险起见最好涵盖到入境当天

Q：递签可以不在户口所在地吗？
A：可以，就近选择签证中心即可

Q：ATAS是什么？都需要吗？
A：只有特定理工科/军事技术类专业需要，CAS上会注明，一般专业不需要

Q：签证被抽查保证金怎么办？
A：如收到抽查通知，按要求在线提交存款证明等材料即可，大部分申请不会被抽查
`
    },
    'emergency_switch': {
        title: '紧急换校指南',
        icon: 'fa-exchange-alt',
        tag: '换校 · 选校 · 流程',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-exchange-alt"></i></div>
    <h1>当下阶段紧急换校怎么办？</h1>
    <span class="st-tag">换校 · 选校 · 流程</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">选校维度</span></div>
    <div class="st-card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="background:#fff;border:1px solid rgba(139,164,184,0.18);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#A8C8C8,#8BA4B8);color:#fff;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
          <div><div style="font-size:14px;font-weight:500;color:#3D5A6E;margin-bottom:3px;">申请简单</div><div style="font-size:12px;color:#8E9EAB;line-height:1.5;">无需文书（PS或推荐信）</div></div>
        </div>
        <div style="background:#fff;border:1px solid rgba(139,164,184,0.18);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#A8C8C8,#8BA4B8);color:#fff;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
          <div><div style="font-size:14px;font-weight:500;color:#3D5A6E;margin-bottom:3px;">出结果快</div><div style="font-size:12px;color:#8E9EAB;line-height:1.5;">通常1周左右出结果</div></div>
        </div>
        <div style="background:#fff;border:1px solid rgba(139,164,184,0.18);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#A8C8C8,#8BA4B8);color:#fff;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
          <div><div style="font-size:14px;font-weight:500;color:#3D5A6E;margin-bottom:3px;">课程覆盖全面</div><div style="font-size:12px;color:#8E9EAB;line-height:1.5;">常见热门课程均覆盖</div></div>
        </div>
        <div style="background:#fff;border:1px solid rgba(139,164,184,0.18);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#A8C8C8,#8BA4B8);color:#fff;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div>
          <div><div style="font-size:14px;font-weight:500;color:#3D5A6E;margin-bottom:3px;">要求灵活</div><div style="font-size:12px;color:#8E9EAB;line-height:1.5;">不卡list，只要均分够都可以考虑</div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">推荐院校：谢菲尔德大学</span></div>
    <div class="st-card-body">
      <div class="st-checklist">
        <div class="st-check-item"><i class="fas fa-check-circle"></i>绝大部分PGT硕士无需PS和推荐信，申请递交后通常2-5个工作日出结果</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>不卡院校list，均分符合即可申请（绝大多数课程均分要求65-85%，大部分专业都考虑2:2学位）</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>对专业背景限制低，很多可以接转专业申请</div>
      </div>
      <div class="st-hint-bar st-hint-warning"><i class="fas fa-exclamation-triangle"></i>不接受函授/自考/非全日制等</div>
      <div style="margin-top:14px;">
        <div class="st-check-item"><i class="fas fa-check-circle"></i>专业选择多，目前除开下面课程即将截止外，其余均可正常申请</div>
      </div>
      <div class="st-hint-bar st-hint-danger" style="margin-top:10px;">
        <i class="fas fa-clock"></i>
        <strong>即将截止申请 · 截止日期：2026年6月17日</strong>
      </div>
      <div class="st-tag-list" style="margin-top:8px;">
        <span class="st-tag-item">MSc Management and International Business</span>
        <span class="st-tag-item">MSc International Marketing and Management</span>
        <span class="st-tag-item">MSc Finance and Accounting</span>
        <span class="st-tag-item">MSc Management</span>
        <span class="st-tag-item">MSc Human Resource Management with CIPD Pathway</span>
      </div>
      <div class="st-hint-bar st-hint-success" style="margin-top:10px;">
        <i class="fas fa-gift"></i>
        <span>硕士3,000镑无门槛奖学金：2026年7月7日英国时间下午4点前接offer即可享有</span>
      </div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">推荐院校：诺丁汉大学</span></div>
    <div class="st-card-body">
      <div class="st-checklist">
        <div class="st-check-item"><i class="fas fa-check-circle"></i>大部分课程无需推荐信，部分需要2封，申请递交后通常2-5个工作日出结果</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>不卡院校List，均分符合即可申请（均分要求68-82%）</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>接受函授/自考/非全日制等学历，只要有学位证</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>专业选择多，目前均可申请</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>3+1最后一年在英国本土完成并获得2.1学位可以免雅思</div>
      </div>
      <div class="st-hint-bar st-hint-success" style="margin-bottom:8px;"><i class="fas fa-check"></i>目前均可申请</div>
      <div class="st-hint-bar st-hint-success">
        <i class="fas fa-gift"></i>
        <span>3,000镑无门槛奖学金，无需单独申请，大学自动授予</span>
      </div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">推荐院校：伯明翰大学</span></div>
    <div class="st-card-body">
      <div class="st-checklist">
        <div class="st-check-item"><i class="fas fa-check-circle"></i>大部分课程仅需1封推荐信，申请递交后快的话1-2周出结果</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>绝大多数专业不卡院校List，均分符合即可申请（均分要求73-87%不等）</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>通常3+1（海外这1年在UKVI认可的英语母语国家）可申请免语言</div>
        <div class="st-check-item"><i class="fas fa-check-circle"></i>专业选择多，目前均可申请</div>
      </div>
      <div class="st-hint-bar st-hint-success"><i class="fas fa-check"></i>目前均可申请</div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">换校流程</span></div>
    <div class="st-card-body">
      <div class="st-flow" style="margin-bottom:16px;">
        <div class="st-flow-step st-flow-highlight">如果无其他院校或适合自己院校的offer</div>
        <span class="st-flow-arrow">→</span>
        <div class="st-flow-step" style="background:#4a90d9;color:#fff;">紧急补申</div>
      </div>
      <div style="margin:12px 0 8px;color:#6B7280;font-size:13px;">如果已有想要更换院校的Offer：</div>
      <div class="st-timeline">
        <div class="st-timeline-item">
          <div class="st-timeline-marker">1</div>
          <div class="st-timeline-content">
            <div class="st-timeline-title">恭喜你！完成了第一步。</div>
          </div>
        </div>
        <div class="st-timeline-item">
          <div class="st-timeline-marker">2</div>
          <div class="st-timeline-content">
            <div class="st-timeline-title">确认是否能匹配该offer条件</div>
            <div class="st-timeline-desc">均分是否能满足？语言是否能满足（直入or可配语言班）？</div>
          </div>
        </div>
        <div class="st-timeline-item">
          <div class="st-timeline-marker">3</div>
          <div class="st-timeline-content">
            <div class="st-timeline-title">确认一切OK后，接offer并支付押金留位</div>
            <div class="st-timeline-desc">如有，如需配语言班，请即刻联系相应老师申请语言班。</div>
          </div>
        </div>
        <div class="st-timeline-item">
          <div class="st-timeline-marker">4</div>
          <div class="st-timeline-content">
            <div class="st-timeline-title">关注此前院校是否支付过押金</div>
            <div class="st-timeline-desc">如有，请查看退费政策以及退费DDL，若符合请及时在DDL前申请退费，最大限度减少损失。</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
        rawText: `【当下阶段紧急换校怎么办？】
当下阶段如需紧急换校怎么办？可以从以下维度去选择更换的院校

▎选校维度
1. 申请简单 — 无需文书（PS或推荐信）
2. 出结果快 — 通常1周左右出结果
3. 课程覆盖全面 — 常见热门课程均覆盖
4. 要求灵活 — 不卡list，只要均分够都可以考虑

▎推荐院校：谢菲尔德大学
• 绝大部分PGT硕士无需PS和推荐信，申请递交后通常2-5个工作日出结果
• 不卡院校list，均分符合即可申请（绝大多数课程均分要求65-85%，大部分专业都考虑2:2学位）
• 对专业背景限制低，很多可以接转专业申请
⚠ 注意：不接受函授/自考/非全日制等
• 专业选择多，目前除开下面课程即将截止外，其余均可正常申请
🕐 即将截止申请 | 截止日期：2026年6月17日
  · MSc Management and International Business
  · MSc International Marketing and Management
  · MSc Finance and Accounting
  · MSc Management
  · MSc Human Resource Management with CIPD Pathway
🎁 硕士3,000镑无门槛奖学金：2026年7月7日英国时间下午4点前接offer即可享有

▎推荐院校：诺丁汉大学
• 大部分课程无需推荐信，部分需要2封，申请递交后通常2-5个工作日出结果
• 不卡院校List，均分符合即可申请（均分要求68-82%）
• 接受函授/自考/非全日制等学历，只要有学位证
• 专业选择多，目前均可申请
• 3+1最后一年在英国本土完成并获得2.1学位可以免雅思
🎁 3,000镑无门槛奖学金，无需单独申请，大学自动授予

▎推荐院校：伯明翰大学
• 大部分课程仅需1封推荐信，申请递交后快的话1-2周出结果
• 绝大多数专业不卡院校List，均分符合即可申请（均分要求73-87%不等）
• 通常3+1（海外这1年在UKVI认可的英语母语国家）可申请免语言
• 专业选择多，目前均可申请

▎换校流程
路径A：如果无其他院校或适合自己院校的offer → 紧急补申

路径B：如果已有想要更换院校的Offer
Step1：恭喜你！完成了第一步。
Step2：确认是否能匹配该offer条件——均分是否能满足？语言是否能满足（直入or可配语言班）？
Step3：确认一切OK后，接offer并支付押金留位（如有）。如需配语言班，请即刻联系相应老师申请语言班。
Step4：关注此前院校是否支付过押金？如有，请查看退费政策以及退费DDL，若符合请及时在DDL前申请退费，最大限度减少损失。`
    },
    'writing_service': {
        title: '文书外售服务清单及报价',
        icon: 'fa-file-invoice-dollar',
        tag: '2026-2027 · 限时外售',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-file-invoice-dollar"></i></div>
    <h1>文书外售服务清单及报价</h1>
    <span class="st-tag">2026-2027 · 限时外售</span>
  </div>

  <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>服务对象：仅面向计划2026和2027年度入学的客户<br>销售期限：2026年3月24日至2026年7月31日，逾期将恢复内部专用服务</span></div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">套餐文书</span></div>
    <div class="st-card-body">

      <div class="st-card" style="margin-bottom:12px;">
        <div class="st-card-header" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);"><span class="st-card-title" style="color:#fff;">尊享文书</span><span class="st-tag" style="background:rgba(255,255,255,0.2);color:#fff;margin-left:8px;">牛津剑桥</span></div>
        <div class="st-card-body">
          <div class="st-info-grid">
            <div class="st-info-grid-item"><div class="st-igi-label">价格</div><div class="st-igi-value">5,000元</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">内容</div><div class="st-igi-value">PS + 2RL</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">增值服务</div><div class="st-igi-value" style="font-size:0.9rem;">含头脑风暴1次</div></div>
          </div>
        </div>
      </div>

      <div class="st-card" style="margin-bottom:12px;">
        <div class="st-card-header" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);"><span class="st-card-title" style="color:#fff;">U享文书</span><span class="st-tag" style="background:rgba(255,255,255,0.2);color:#fff;margin-left:8px;">G5/王曼爱华/港前三</span></div>
        <div class="st-card-body">
          <div class="st-info-grid">
            <div class="st-info-grid-item"><div class="st-igi-label">价格</div><div class="st-igi-value">3,000元</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">内容</div><div class="st-igi-value">PS + 2RL</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">增值服务</div><div class="st-igi-value" style="font-size:0.9rem;">含素材指导服务1次</div></div>
          </div>
          <div class="st-hint-bar st-info" style="margin-top:8px;"><span class="st-hint-icon">💡</span><span>每校PS加写1,000元</span></div>
        </div>
      </div>

      <div class="st-card" style="margin-bottom:0;">
        <div class="st-card-header" style="background:linear-gradient(135deg,#059669,#047857);"><span class="st-card-title" style="color:#fff;">标准文书</span><span class="st-tag" style="background:rgba(255,255,255,0.2);color:#fff;margin-left:8px;">其他院校</span></div>
        <div class="st-card-body">
          <div class="st-info-grid">
            <div class="st-info-grid-item"><div class="st-igi-label">价格</div><div class="st-igi-value">1,500元</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">内容</div><div class="st-igi-value">PS + 2RL</div></div>
            <div class="st-info-grid-item"><div class="st-igi-label">增值服务</div><div class="st-igi-value" style="font-size:0.85rem;">不提供素材指导，非质量问题不予修改</div></div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">散件文书</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item"><div class="st-igi-label">单独PS</div><div class="st-igi-value">按对应等级全套价格的80%</div><div class="st-igi-sub">尊享4,000元 / U享2,400元 / 标准1,200元</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">单独RL</div><div class="st-igi-value">500元/篇</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">单独CV</div><div class="st-igi-value">500元</div></div>
        <div class="st-info-grid-item"><div class="st-igi-label">Essay等额外材料直译</div><div class="st-igi-value">300元/1000字</div><div class="st-igi-sub">不足按1000字计</div></div>
      </div>
    </div>
  </div>

  <div class="st-hint-bar st-info"><span class="st-hint-icon">💡</span><span>返件时间均与文书中心每阶段公布的返件时间一致</span></div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以最新公告为准</div>
</div>`,
        rawText: `【文书外售服务清单及报价】
2026-2027年度 · 限时外售

⚠️ 服务对象：仅面向计划2026和2027年度入学的客户
⚠️ 销售期限：2026年3月24日至2026年7月31日，逾期将恢复内部专用服务

▎01 套餐文书

尊享文书 | 牛津剑桥
• 价格：5,000元
• 内容：PS + 2RL
• 增值服务：含头脑风暴1次

U享文书 | G5/王曼爱华/港前三
• 价格：3,000元
• 内容：PS + 2RL
• 增值服务：含素材指导服务1次
💡 每校PS加写1,000元

标准文书 | 其他院校
• 价格：1,500元
• 内容：PS + 2RL
• 增值服务：不提供素材指导，非质量问题不予修改

▎02 散件文书
• 单独PS：按对应等级全套价格的80%（尊享4,000元 / U享2,400元 / 标准1,200元）
• 单独RL：500元/篇
• 单独CV：500元
• Essay等额外材料直译：300元/1000字（不足按1000字计）

💡 返件时间均与文书中心每阶段公布的返件时间一致

以上信息仅供参考，具体请以最新公告为准`
    },
    'uk_materials': {
        title: '英国申请材料清单',
        icon: 'fa-clipboard-list',
        tag: '申请 · 材料 · 清单',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-clipboard-list"></i></div>
    <h1>英国申请材料清单</h1>
    <span class="st-tag">申请 · 材料 · 清单</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">申请填写</span></div>
    <div class="st-card-body">
      <div class="st-section-title">Application Form 申请表</div>
      <ul class="st-bullet-list">
        <li><strong>Email邮件申请时：</strong>需填写申请表格、签字扫描</li>
        <li><strong>Online网申申请时：</strong>在线填写申请表</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">学术材料 <span class="st-tag" style="font-size:0.7rem;background:#fef6e6;color:#92610a;">标*为必须</span></span></div>
    <div class="st-card-body">
      <div class="st-section-title">*Study Certificate 在读证明</div>
      <ul class="st-bullet-list">
        <li>若申请时还未毕业请开具在读证明</li>
        <li>请注意信息准确，中英文版都需要逐页加盖申请人就读学校的公章；接受盖章件原件的扫描件（通常不接受复印件的扫描件）；不接受系统下载的、截图的此类非正式学术材料</li>
        <li>优先接受申请人毕业学校加盖公章的翻译件；除非学校不同意在翻译件上盖章，才会考虑接受其他形式的翻译章</li>
      </ul>
      <div class="st-section-title">*Graduation Certificate and Bachelor's Degree Certificate 毕业证和学位证</div>
      <ul class="st-bullet-list">
        <li>请注意信息准确，中英文版都需要逐页加盖申请人毕业学校的公章；接受盖章件原件的扫描件</li>
        <li>优先接受申请人毕业学校加盖公章的翻译件</li>
        <li>若有多个院校的学习经历，请按证书+成绩单的组合方式、按学历由高到低的顺序依次排列</li>
      </ul>
      <div class="st-section-title">*Transcript 学术成绩单</div>
      <ul class="st-bullet-list">
        <li>请注意信息准确，中英文版都需要逐页加盖申请人就读学校的公章</li>
        <li>优先接受申请人毕业学校加盖公章的翻译件</li>
        <li>成绩单若未体现准确的平均分，请再单独开一份学校盖章的均分证明</li>
        <li>如果计算平均分时，个别科目的核算方式并未在成绩单里说明，可单独开一份学校盖章的成绩单补充说明</li>
        <li>如果由于情况特殊，多次提供了成绩单，每份成绩单有不一致或需更正的信息，也请单独开一份学校盖章的成绩单补充说明</li>
      </ul>
      <div class="st-hint-bar st-warn"><span class="st-hint-icon">⚠️</span><span>成绩单是评估录取、获取CAS等环节的重要核心材料之一，请务必真实且跟学籍系统保持一致</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">语言材料 <span class="st-tag" style="font-size:0.7rem;background:#fef6e6;color:#92610a;">标*为必须</span></span></div>
    <div class="st-card-body">
      <div class="st-section-title">*Language Test 语言成绩单</div>
      <ul class="st-bullet-list">
        <li>语言成绩单可包含英国校方认可的多种形式，例如最常见的：雅思成绩单（优先推荐UKVI IELTS，建议申请递交时已有符合或接近录取要求的雅思成绩，如没有语言成绩，请提供预计考试的时间和预估分数）</li>
        <li>部分课程在申请时必须提供雅思成绩，比如Manchester曼彻斯特大学商学院要求在申请时需提供总分6.5（单项不低于6.0）的雅思成绩</li>
        <li>请提供真实且在有效期内的语言成绩单，若预计在开课前语言成绩单要过期，请提前指导学生重考！雅思成绩单的有效期为两年</li>
        <li>原则上只接受原件成绩单的扫描件</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">文书材料 <span class="st-tag" style="font-size:0.7rem;background:#fef6e6;color:#92610a;">标*为必须</span></span></div>
    <div class="st-card-body">
      <div class="st-section-title">*Personal Statement 个人陈述</div>
      <ul class="st-bullet-list">
        <li>请提供真实、齐备、无误的终稿PS用于申请，PS务必要满足英国校方的要求</li>
        <li>不能有较多明显的低级错误（例如姓名、性别、国家、院校名称、课程名称写错）；不能抄袭；不能超字数、篇幅限制；须点明申请原因、课程认识、就业规划、转专业原因（如涉及转专业）等要点</li>
        <li>WMG, Kent, Essex的PS中要求必须点明院校全称、所申请的课程全称</li>
        <li>请注意通用版PS与1对1 PS的区别，在文件命名时请加以区分</li>
      </ul>
      <div class="st-section-title">*References 推荐信</div>
      <ul class="st-bullet-list">
        <li>硕士课程一般需要2封推荐信</li>
        <li>推荐人必须在推荐信上手写签字！推荐信必须用推荐人所在单位的抬头纸张打印，不接受白纸打印</li>
        <li>推荐信必须包含的落款信息：推荐信日期（原则上此日期需距离开课1年以内）、推荐人姓名、性别、职位、工作单位、工作地址、工作邮箱（原则上只接受工作邮箱而非个人邮箱）、工作电话</li>
        <li>若有外籍推荐信：我方在申请时默认不会上传外籍推荐信，只会提供外籍推荐人的联系方式注明请学校直接联系推荐人提供推荐信</li>
      </ul>
      <div class="st-section-title" style="color:#6b7280;">CV/Resume 简历（如有）</div>
      <ul class="st-bullet-list" style="color:#6b7280;">
        <li>如有工作经验建议提供CV（如有工作证明作为CV的配套材料更佳）</li>
        <li>申请商科课程的学生建议都提供CV</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">05</span><span class="st-card-title">其他材料</span></div>
    <div class="st-card-body">
      <div class="st-section-title" style="color:#6b7280;">Certificate of Honor 荣誉证书（如有）</div>
      <ul class="st-bullet-list" style="color:#6b7280;">
        <li>请挑选有代表性、价值较高的荣誉证书，按时间由近及远的顺序排列</li>
      </ul>
      <div class="st-section-title" style="color:#6b7280;">Passport 护照（如有）</div>
      <ul class="st-bullet-list" style="color:#6b7280;">
        <li>确保护照在有效期内、信息准确；如有英国学习经历请一并提供Visa Page(s)、BRP卡、UK学习经历的CAS；如有任何国家的拒签史请如实告知</li>
      </ul>
      <div class="st-section-title" style="color:#6b7280;">Portfolio 作品集（如有）</div>
      <ul class="st-bullet-list" style="color:#6b7280;">
        <li>通常建筑类、设计类、音乐类课程需提供；请注意格式、大小限制（一般在10M以内，爱丁堡大学在4M以内）</li>
      </ul>
      <div class="st-section-title" style="color:#6b7280;">Other Documents 其他材料（如有）</div>
      <ul class="st-bullet-list" style="color:#6b7280;">
        <li>英国校方指定要求提供的额外材料，如翻译试卷、大四课程列表、高考成绩、GMAT、GRE等</li>
      </ul>
    </div>
  </div>

  <div class="st-hint-bar st-warn" style="margin-top:16px;">
    <span class="st-hint-icon">⚠️</span>
    <span>1. 以上材料，标有*星号的一般为申请时必须提供的核心材料<br>2. 申请材料请务必真实、齐备、无误、清晰，逻辑清楚，不混淆、不重复<br>3. 如果只有非英文的材料，请一律提供正规的英文翻译件，若涉及从申请人就读学校开具的材料，优先接受就读学校的公章<br>4. 英国校方一般不接受公证件<br>5. 无论网申、邮申，请务必写全学生的准确联系方式<br>6. 一个学生只能有1个学生邮箱用于网申注册及邮申表填写，勿使用公司邮箱</span>
  </div>

  <div class="st-card" style="margin-top:16px;">
    <div class="st-card-header"><span class="st-card-title">其他课程申请材料</span></div>
    <div class="st-card-body">
      <div class="st-info-grid" style="grid-template-columns:1fr;">
        <div class="st-info-grid-item" style="text-align:left;">
          <div class="st-igi-label" style="margin-bottom:8px;font-size:0.88rem;color:#2d3748;font-weight:700;">GCSE / Pre A-level / A-level</div>
          <div style="font-size:0.84rem;color:#4a5568;line-height:1.7;">PS；在读证明（或毕业证）；成绩单；1封推荐信（如有）。此类课程可能有年龄限制，需注意核实年龄是否达标。A-level申请时请在申请表准确填写或勾选所学科目且勿轻易更换。</div>
        </div>
        <div class="st-info-grid-item" style="text-align:left;">
          <div class="st-igi-label" style="margin-bottom:8px;font-size:0.88rem;color:#2d3748;font-weight:700;">Foundation / Pre-master</div>
          <div style="font-size:0.84rem;color:#4a5568;line-height:1.7;">PS；在读证明（或毕业证）；成绩单；其他材料（如有）。需准确填写开学日期、预科方向、预科课程长度、所在校区、所要衔接的正课课程全称等要点。大学直授的预科通常需按照申请本科或硕士的标准提供PS、推荐信；教育集团的预科除特殊要求外通常无需提供PS、推荐信。</div>
        </div>
        <div class="st-info-grid-item" style="text-align:left;">
          <div class="st-igi-label" style="margin-bottom:8px;font-size:0.88rem;color:#2d3748;font-weight:700;">First Year Diploma 大一文凭课程</div>
          <div style="font-size:0.84rem;color:#4a5568;line-height:1.7;">大学在读证明；高中毕业证；高中成绩单；大一成绩单；雅思；护照；其他材料（如有）。</div>
        </div>
      </div>
    </div>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以校方最新要求为准</div>
</div>`,
        rawText: `【英国申请材料清单】
申请 · 材料 · 清单

▎01 申请填写
Application Form 申请表
• Email邮件申请时：需填写申请表格、签字扫描
• Online网申申请时：在线填写申请表

▎02 学术材料（标*为必须）
*Study Certificate 在读证明
• 若申请时还未毕业请开具在读证明
• 请注意信息准确，中英文版都需要逐页加盖申请人就读学校的公章；接受盖章件原件的扫描件（通常不接受复印件的扫描件）；不接受系统下载的、截图的此类非正式学术材料
• 优先接受申请人毕业学校加盖公章的翻译件；除非学校不同意在翻译件上盖章，才会考虑接受其他形式的翻译章

*Graduation Certificate and Bachelor's Degree Certificate 毕业证和学位证
• 请注意信息准确，中英文版都需要逐页加盖申请人毕业学校的公章；接受盖章件原件的扫描件
• 优先接受申请人毕业学校加盖公章的翻译件
• 若有多个院校的学习经历，请按证书+成绩单的组合方式、按学历由高到低的顺序依次排列

*Transcript 学术成绩单
• 请注意信息准确，中英文版都需要逐页加盖申请人就读学校的公章
• 优先接受申请人毕业学校加盖公章的翻译件
• 成绩单若未体现准确的平均分，请再单独开一份学校盖章的均分证明
• 如果计算平均分时，个别科目的核算方式并未在成绩单里说明，可单独开一份学校盖章的成绩单补充说明
• 如果由于情况特殊，多次提供了成绩单，每份成绩单有不一致或需更正的信息，也请单独开一份学校盖章的成绩单补充说明
⚠️ 成绩单是评估录取、获取CAS等环节的重要核心材料之一，请务必真实且跟学籍系统保持一致

▎03 语言材料（标*为必须）
*Language Test 语言成绩单
• 语言成绩单可包含英国校方认可的多种形式，例如最常见的：雅思成绩单（优先推荐UKVI IELTS，建议申请递交时已有符合或接近录取要求的雅思成绩，如没有语言成绩，请提供预计考试的时间和预估分数）
• 部分课程在申请时必须提供雅思成绩，比如Manchester曼彻斯特大学商学院要求在申请时需提供总分6.5（单项不低于6.0）的雅思成绩
• 请提供真实且在有效期内的语言成绩单，若预计在开课前语言成绩单要过期，请提前指导学生重考！雅思成绩单的有效期为两年
• 原则上只接受原件成绩单的扫描件

▎04 文书材料（标*为必须）
*Personal Statement 个人陈述
• 请提供真实、齐备、无误的终稿PS用于申请，PS务必要满足英国校方的要求
• 不能有较多明显的低级错误（例如姓名、性别、国家、院校名称、课程名称写错）；不能抄袭；不能超字数、篇幅限制；须点明申请原因、课程认识、就业规划、转专业原因（如涉及转专业）等要点
• WMG, Kent, Essex的PS中要求必须点明院校全称、所申请的课程全称
• 请注意通用版PS与1对1 PS的区别，在文件命名时请加以区分

*References 推荐信
• 硕士课程一般需要2封推荐信
• 推荐人必须在推荐信上手写签字！推荐信必须用推荐人所在单位的抬头纸张打印，不接受白纸打印
• 推荐信必须包含的落款信息：推荐信日期（原则上此日期需距离开课1年以内）、推荐人姓名、性别、职位、工作单位、工作地址、工作邮箱（原则上只接受工作邮箱而非个人邮箱）、工作电话
• 若有外籍推荐信：我方在申请时默认不会上传外籍推荐信，只会提供外籍推荐人的联系方式注明请学校直接联系推荐人提供推荐信

CV/Resume 简历（如有）
• 如有工作经验建议提供CV（如有工作证明作为CV的配套材料更佳）
• 申请商科课程的学生建议都提供CV

▎05 其他材料
Certificate of Honor 荣誉证书（如有）
• 请挑选有代表性、价值较高的荣誉证书，按时间由近及远的顺序排列

Passport 护照（如有）
• 确保护照在有效期内、信息准确；如有英国学习经历请一并提供Visa Page(s)、BRP卡、UK学习经历的CAS；如有任何国家的拒签史请如实告知

Portfolio 作品集（如有）
• 通常建筑类、设计类、音乐类课程需提供；请注意格式、大小限制（一般在10M以内，爱丁堡大学在4M以内）

Other Documents 其他材料（如有）
• 英国校方指定要求提供的额外材料，如翻译试卷、大四课程列表、高考成绩、GMAT、GRE等

⚠️ 重要提示：
1. 以上材料，标有*星号的一般为申请时必须提供的核心材料
2. 申请材料请务必真实、齐备、无误、清晰，逻辑清楚，不混淆、不重复
3. 如果只有非英文的材料，请一律提供正规的英文翻译件，若涉及从申请人就读学校开具的材料，优先接受就读学校的公章
4. 英国校方一般不接受公证件
5. 无论网申、邮申，请务必写全学生的准确联系方式
6. 一个学生只能有1个学生邮箱用于网申注册及邮申表填写，勿使用公司邮箱

▎其他课程申请材料
GCSE / Pre A-level / A-level：PS；在读证明（或毕业证）；成绩单；1封推荐信（如有）。此类课程可能有年龄限制，需注意核实年龄是否达标。A-level申请时请在申请表准确填写或勾选所学科目且勿轻易更换。

Foundation / Pre-master：PS；在读证明（或毕业证）；成绩单；其他材料（如有）。需准确填写开学日期、预科方向、预科课程长度、所在校区、所要衔接的正课课程全称等要点。大学直授的预科通常需按照申请本科或硕士的标准提供PS、推荐信；教育集团的预科除特殊要求外通常无需提供PS、推荐信。

First Year Diploma 大一文凭课程：大学在读证明；高中毕业证；高中成绩单；大一成绩单；雅思；护照；其他材料（如有）。

以上信息仅供参考，具体请以校方最新要求为准`
    },
    'graduation_docs': {
        title: '毕业材料办理温馨提示',
        icon: 'fa-graduation-cap',
        tag: '毕业 · 材料 · 办理',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-graduation-cap"></i></div>
    <h1>国内本科生毕业材料办理温馨提示</h1>
    <span class="st-tag">毕业 · 材料 · 办理</span>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">01</span><span class="st-card-title">毕业证&学位证</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item">
          <div class="st-igi-label">原件盖章件</div>
          <div class="st-igi-value">各1份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">英文翻译盖章件</div>
          <div class="st-igi-value">建议各2-3份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">出具部门</div>
          <div class="st-igi-value">教务处 或 档案馆</div>
        </div>
      </div>
      <div class="st-section-title" style="margin-top:12px;">出具部门说明</div>
      <ul class="st-bullet-list">
        <li><strong>学校教务处</strong>（例如：校级/院级教务处）</li>
        <li><strong>学校档案馆</strong>（一般适用于已毕业的学生）</li>
      </ul>
      <div class="st-hint-bar st-hint-warning" style="margin-top:8px;"><span class="st-hint-icon">💡</span><span>若以上途径均无法提供毕业材料，可咨询我方寻求解决方案</span></div>

      <div class="st-section-title" style="margin-top:16px;">盖章说明</div>

      <div class="st-card" style="margin:8px 0;background:#f0f9ff;border-left:3px solid #3b82f6;">
        <div class="st-card-body" style="padding:10px 14px;">
          <div style="font-weight:700;color:#1e40af;font-size:0.88rem;margin-bottom:6px;">1）通常情况</div>
          <div style="font-size:0.84rem;color:#334155;line-height:1.7;">无论是原件还是英文翻译件，优先认可的、效力最大的是<strong>教务处章、校级/院级/系级等学生所在毕业院校开具的公章</strong>。</div>
        </div>
      </div>

      <div class="st-card" style="margin:8px 0;background:#fffbeb;border-left:3px solid #f59e0b;">
        <div class="st-card-body" style="padding:10px 14px;">
          <div style="font-weight:700;color:#92400e;font-size:0.88rem;margin-bottom:6px;">2）特殊情况</div>
          <div style="font-size:0.84rem;color:#334155;line-height:1.7;">若少数学校不愿意在英文翻译件上加盖学校公章，则需盖翻译章：</div>
          <ul class="st-bullet-list" style="margin-top:6px;">
            <li>应UKVI签证要求，若文件非英文或威尔士语版本，申请人须提交由专业翻译人员或翻译公司出具的<strong>完整认证翻译件</strong>，且该翻译件需能被UKVI独立核实</li>
            <li>盖翻译章时要注意找具有翻译资质的翻译公司来加盖翻译章，翻译件需由具有<strong>CATTI或NAATI资质</strong>译者翻译并需提供证书编号</li>
            <li>翻译件必须包含以下所有信息：<br>① 确认其为文件准确无误的翻译版<br>② 翻译日期<br>③ 翻译人员的全名及签名，或翻译公司官员的全名及签名<br>④ 翻译人员或翻译公司的联系方式</li>
          </ul>
        </div>
      </div>

      <div class="st-card" style="margin:8px 0;background:#fef2f2;border-left:3px solid #ef4444;">
        <div class="st-card-body" style="padding:10px 14px;">
          <div style="font-weight:700;color:#991b1b;font-size:0.88rem;margin-bottom:6px;">3）少数有特殊要求的院校举例</div>
          <div style="font-size:0.78rem;color:#6b7280;margin-bottom:8px;">以下为2026学年要求，如要求有变动须以英国大学官方途径发布的要求为准</div>

          <div style="margin-bottom:10px;">
            <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>谢菲尔德大学</strong></div>
            <div style="font-size:0.84rem;color:#475569;line-height:1.7;">认可中方大学出具的英文版本的学术材料，或具有NAATI, CATTI或NAETI资质译者翻译并盖翻译章，且有注明译者联系方式、证书编号、翻译日期、译者签名的翻译件。<strong>不认可专八TEM-8为有效的翻译资质，不认可中介翻译章。</strong></div>
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>伦敦玛丽女王大学</strong></div>
            <div style="font-size:0.84rem;color:#475569;line-height:1.7;">中方院校材料翻译件需要中方院校盖章；若中方院校无法盖章：<br>• 如翻译件为中介提供，只接受提供CATTI或NAATI证书编号的译者的翻译（不接受专八或HSK等），需要在翻译材料上提供"中介盖章+译者信息+认可资质信息+译者签名"<br>• 如翻译件为翻译公司提供，翻译件盖翻译公司章的前提下，可以接受译者资质为专八或HSK，需要在翻译件上提供"翻译公司盖章+译者信息+译者资质信息+译者签名"</div>
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>纽卡斯尔大学</strong></div>
            <div style="font-size:0.84rem;color:#475569;line-height:1.7;">a. 翻译件需打印在有中介公司logo的抬头纸上<br>b. 盖上中介公司英文章（若公司无英文章，中文章需翻译为英文）<br>c. 提供翻译者英语语言水平资质信息<br>d. 提供翻译者签名及签名日期<br>e. 将翻译内容和以上内容放在同一页<br>f. 针对中方学校提供的官方英文成绩单或毕业证但盖章是中文，仍需将中文章翻译为英文<br>g. <strong>不接受电子印章和电子签名</strong></div>
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>杜伦大学</strong></div>
            <div style="font-size:0.84rem;color:#475569;line-height:1.7;">翻译件须包含：① 确认其为文件准确无误的翻译版 ② 翻译日期 ③ 翻译人员的全名及签名 ④ 翻译人员或翻译公司的联系方式</div>
          </div>

          <div>
            <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>拉夫堡大学</strong></div>
            <div style="font-size:0.84rem;color:#475569;line-height:1.7;">证书原件及翻译件均需盖有大学鲜章，且能清晰显示完整内容。电子生成的文件应由大学进行数字签名/保护，以防止编辑。详见：<a href="https://www.lboro.ac.uk/study/pg-offer/send-results/" target="_blank" style="color:#2563eb;text-decoration:underline;">https://www.lboro.ac.uk/study/pg-offer/send-results/</a></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">02</span><span class="st-card-title">最终成绩单</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item">
          <div class="st-igi-label">原件盖章件</div>
          <div class="st-igi-value">1份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">英文翻译盖章件</div>
          <div class="st-igi-value">建议2-3份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">出具部门</div>
          <div class="st-igi-value">教务处 或 档案馆</div>
        </div>
      </div>
      <ul class="st-bullet-list" style="margin-top:12px;">
        <li>盖章说明同上</li>
        <li>若英国大学Offer对学术成绩还有其他特殊要求（如辅修成绩单、交换期间成绩等），也请一并开具</li>
        <li>若最终成绩单上未显示符合英国大学有条件Offer要求的准确成绩，须额外开具均分证明材料</li>
      </ul>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">03</span><span class="st-card-title">均分证明（如需）</span></div>
    <div class="st-card-body">
      <div class="st-info-grid">
        <div class="st-info-grid-item">
          <div class="st-igi-label">原件盖章件</div>
          <div class="st-igi-value">1份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">英文翻译盖章件</div>
          <div class="st-igi-value">建议2-3份</div>
        </div>
        <div class="st-info-grid-item">
          <div class="st-igi-label">出具部门</div>
          <div class="st-igi-value">教务处 或 档案馆</div>
        </div>
      </div>
      <ul class="st-bullet-list" style="margin-top:12px;">
        <li>均分证明建议开具在大学抬头纸上</li>
        <li>部分学校可能会重新核算学生的均分，比如南安普顿大学、谢菲尔德大学等，具体以大学审核结果为准</li>
      </ul>

      <div class="st-section-title" style="margin-top:12px;">部分院校对均分证明要求举例</div>

      <div class="st-card" style="margin:8px 0;background:#f0f9ff;border-left:3px solid #3b82f6;">
        <div class="st-card-body" style="padding:10px 14px;">
          <div style="font-weight:700;color:#1e293b;font-size:0.85rem;margin-bottom:4px;">🔹 <strong>伦敦玛丽女王大学</strong></div>
          <div style="font-size:0.84rem;color:#475569;line-height:1.7;">① 需要开具在大学抬头纸上，且尽可能盖有相应公章<br>② 证明需要由学校中央管理部门开具，不接受学院或老师提供的证明<br>③ 换取无条件录取时，均分证明需要体现出是最终成绩（不会发生改变）</div>
        </div>
      </div>

      <div class="st-card" style="margin:8px 0;background:#fffbeb;border-left:3px solid #f59e0b;">
        <div class="st-card-body" style="padding:10px 14px;">
          <div style="font-weight:700;color:#92400e;font-size:0.85rem;margin-bottom:6px;">场景举例</div>
          <div style="font-size:0.84rem;color:#475569;line-height:1.7;">英国大学Offer要求85%，但成绩单只显示GPA3.5，需开具证明材料证明GPA3.5等同于85%</div>
        </div>
      </div>

      <div class="st-hint-bar st-hint-warning" style="margin-top:8px;"><span class="st-hint-icon">⚠️</span><span>绩点GPA与百分制均分换算标准以学生毕业学校的标准为准</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-card-header"><span class="st-card-num">04</span><span class="st-card-title">其他院校额外需求</span></div>
    <div class="st-card-body">
      <div style="font-size:0.88rem;color:#1e293b;font-weight:700;margin-bottom:10px;">伦敦玛丽女王大学换无条件Offer时除上述材料外还需额外注意：</div>
      <ul class="st-bullet-list">
        <li><strong>1）</strong>无法接受学生或Agent直接在Track系统上传电子版成绩单或毕业证明换取无条件录取（将电子版下载后打印再扫描也视为电子版），须上传学校官方开具的<strong>纸质版最终成绩单、毕业证、学位证等材料的原件扫描件</strong></li>
        <li><strong>2）</strong>若学生暂时无法拿到材料原件，可使用成绩分享系统（如HEAR、Gradintel、Parchment或大学教务系统等）将相应材料分享给对应的Admissions团队并备注学生申请ID</li>
        <li><strong>3）</strong>若学生大学不提供成绩或毕业材料分享系统，建议请大学教务部门使用<strong>官方邮箱</strong>直接将电子版毕业材料发送至相应的Admissions团队</li>
        <li><strong>4）</strong>使用成绩分享系统分享后或大学教务部门发送邮件后，请将截图发至我方以便加速审理</li>
        <li><strong>5）</strong>如果个别国外大学发学位证时间晚于该校开学时间，提供的Award Letter能否被接受将由Admissions case by case决定</li>
      </ul>
    </div>
  </div>

  <div class="st-hint-bar st-hint-danger" style="margin-top:16px;">
    <span class="st-hint-icon">🔴</span>
    <span>以上院校特殊要求基于2026学年信息整理，具体请以英国大学官方最新要求为准。办理材料前建议先确认目标院校的最新政策。</span>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体请以校方最新要求为准</div>
</div>`,
        rawText: `【国内本科生毕业材料办理温馨提示】
毕业 · 材料 · 办理

▎01 毕业证&学位证
┌─────────────┬──────────────┐
│ 原件盖章件   │ 各1份        │
│ 英文翻译盖章件│ 建议各2-3份  │
│ 出具部门     │ 教务处 或 档案馆 │
└─────────────┴──────────────┘

出具部门说明：
• 学校教务处（例如：校级/院级教务处）
• 学校档案馆（一般适用于已毕业的学生）
💡 若以上途径均无法提供毕业材料，可咨询我方寻求解决方案

【盖章说明】

1）通常情况
无论是原件还是英文翻译件，优先认可的、效力最大的是教务处章、校级/院级/系级等学生所在毕业院校开具的公章。

2）特殊情况
若少数学校不愿意在英文翻译件上加盖学校公章，则需盖翻译章：
• 应UKVI签证要求，若文件非英文或威尔士语版本，申请人须提交由专业翻译人员或翻译公司出具的完整认证翻译件，且该翻译件需能被UKVI独立核实
• 盖翻译章时要注意找具有翻译资质的翻译公司来加盖翻译章，翻译件需由具有CATTI或NAATI资质译者翻译并需提供证书编号
• 翻译件必须包含以下所有信息：
  ① 确认其为文件准确无误的翻译版
  ② 翻译日期
  ③ 翻译人员的全名及签名，或翻译公司官员的全名及签名
  ④ 翻译人员或翻译公司的联系方式

3）少数有特殊要求的院校举例（以下为2026学年要求，如要求有变动须以英国大学官方途径发布的要求为准）

🔹 谢菲尔德大学
认可中方大学出具的英文版本的学术材料，或具有NAATI, CATTI或NAETI资质译者翻译并盖翻译章，且有注明译者联系方式、证书编号、翻译日期、译者签名的翻译件。不认可专八TEM-8为有效的翻译资质，不认可中介翻译章。

🔹 伦敦玛丽女王大学
中方院校材料翻译件需要中方院校盖章；若中方院校无法盖章：
• 如翻译件为中介提供，只接受提供CATTI或NAATI证书编号的译者的翻译（不接受专八或HSK等），需要在翻译材料上提供"中介盖章+译者信息+认可资质信息+译者签名"
• 如翻译件为翻译公司提供，翻译件盖翻译公司章的前提下，可以接受译者资质为专八或HSK，需要在翻译件上提供"翻译公司盖章+译者信息+译者资质信息+译者签名"

🔹 纽卡斯尔大学
a.翻译件需打印在有中介公司logo的抬头纸上
b.盖上中介公司英文章（若公司无英文章，中文章需翻译为英文）
c.提供翻译者英语语言水平资质信息
d.提供翻译者签名及签名日期
e.将翻译内容和以上内容放在同一页
f.针对中方学校提供的官方英文成绩单或毕业证但盖章是中文，仍需将中文章翻译为英文
g.不接受电子印章和电子签名

🔹 杜伦大学
翻译件须包含：① 确认其为文件准确无误的翻译版 ② 翻译日期 ③ 翻译人员的全名及签名 ④ 翻译人员或翻译公司的联系方式

🔹 拉夫堡大学
证书原件及翻译件均需盖有大学鲜章，且能清晰显示完整内容。电子生成的文件应由大学进行数字签名/保护，以防止编辑。详见：https://www.lboro.ac.uk/study/pg-offer/send-results/

▎02 最终成绩单
┌─────────────┬──────────────┐
│ 原件盖章件   │ 1份          │
│ 英文翻译盖章件│ 建议2-3份    │
│ 出具部门     │ 教务处 或 档案馆 │
└─────────────┴──────────────┘
• 盖章说明同上
• 若英国大学Offer对学术成绩还有其他特殊要求（如辅修成绩单、交换期间成绩等），也请一并开具
• 若最终成绩单上未显示符合英国大学有条件Offer要求的准确成绩，须额外开具均分证明材料

▎03 均分证明（如需）
┌─────────────┬──────────────┐
│ 原件盖章件   │ 1份          │
│ 英文翻译盖章件│ 建议2-3份    │
│ 出具部门     │ 教务处 或 档案馆 │
└─────────────┴──────────────┘
• 均分证明建议开具在大学抬头纸上
• 部分学校可能会重新核算学生的均分，比如南安普顿大学、谢菲尔德大学等，具体以大学审核结果为准

部分院校对均分证明要求举例：
🔹 伦敦玛丽女王大学：① 需要开具在大学抬头纸上，且尽可能盖有相应公章 ② 证明需要由学校中央管理部门开具，不接受学院或老师提供的证明 ③ 换取无条件录取时，均分证明需要体现出是最终成绩（不会发生改变）

场景举例：英国大学Offer要求85%，但成绩单只显示GPA3.5，需开具证明材料证明GPA3.5等同于85%
⚠️ 绩点GPA与百分制均分换算标准以学生毕业学校的标准为准

▎04 其他院校额外需求
伦敦玛丽女王大学换无条件Offer时除上述材料外还需额外注意：
1）无法接受学生或Agent直接在Track系统上传电子版成绩单或毕业证明换取无条件录取（将电子版下载后打印再扫描也视为电子版），须上传学校官方开具的纸质版最终成绩单、毕业证、学位证等材料的原件扫描件
2）若学生暂时无法拿到材料原件，可使用成绩分享系统（如HEAR、Gradintel、Parchment或大学教务系统等）将相应材料分享给对应的Admissions团队并备注学生申请ID
3）若学生大学不提供成绩或毕业材料分享系统，建议请大学教务部门使用官方邮箱直接将电子版毕业材料发送至相应的Admissions团队
4）使用成绩分享系统分享后或大学教务部门发送邮件后，请将截图发至我方以便加速审理
5）如果个别国外大学发学位证时间晚于该校开学时间，提供的Award Letter能否被接受将由Admissions case by case决定

🔴 以上院校特殊要求基于2026学年信息整理，具体请以英国大学官方最新要求为准。办理材料前建议先确认目标院校的最新政策。

以上信息仅供参考，具体请以校方最新要求为准`
    },
    'deposit_refund': {
        title: '英国热门大学留位费退费政策汇总',
        icon: 'fa-sterling-sign',
        tag: '申请',
        content: `<div class="st-tool-container">
  <div class="st-tool-header">
    <div class="st-tool-header-icon"><i class="fas fa-sterling-sign"></i></div>
    <h1>英国热门大学留位费退费政策汇总</h1>
    <span class="st-tag">申请</span>
  </div>

  <div class="st-hint-bar st-hint-info" style="margin-bottom:16px;"><span class="st-hint-icon">ℹ️</span><span>留位费即定金（Deposit），缴纳后锁定入学名额，入学后抵扣学费。各校退费政策不同，以下汇总13所英国热门大学的退费规则，供销售顾问快速查阅。具体以校方最新政策为准。</span></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">01</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">帝国理工学院 IC</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：无明确14天冷静期｜支付时间：接受offer后30天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 未能满足录取条件，并已尽力提供证据</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒（非欺诈性申请或先前入境障碍），需提供UKVI拒签信</li>
          <li><span style="color:#16a34a;">✅</span> 学校不再开设所申请专业</li>
          <li><span style="color:#ea580c;">⚠️</span> 其他极端或特殊情况需个案审核</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">02</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">牛津大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：接受offer后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 接受offer后14天内撤回</li>
          <li><span style="color:#16a34a;">✅</span> 未满足学术条件，需提供考试成绩证明</li>
          <li><span style="color:#16a34a;">✅</span> 未达到英语语言要求，需提供尝试但未通过的证据</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒，需提供拒签证据</li>
          <li><span style="color:#16a34a;">✅</span> 因不可预见情况无法学习，需提供证据</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">03</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">伦敦大学学院 UCL</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：接受offer并支付押金后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 未满足学术条件（不含语言能力条件）</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒绝</li>
          <li><span style="color:#16a34a;">✅</span> UCL无法提供录取（原学习计划不可用）</li>
          <li><span style="color:#16a34a;">✅</span> 接受offer后14天内改变主意（需在14天内支付押金且14天内终止）</li>
          <li><span style="color:#16a34a;">✅</span> 入学前获得全额资助并提供证明</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">04</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">爱丁堡大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：缴纳后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 缴纳后14天内要求退还</li>
          <li><span style="color:#16a34a;">✅</span> 课程被取消且不接受调剂</li>
          <li><span style="color:#16a34a;">✅</span> 未满足offer条件（含语言），需提供证据</li>
          <li><span style="color:#16a34a;">✅</span> 学生签证或ATAS被拒（不含欺诈/资金不足/错误文件）</li>
          <li><span style="color:#ea580c;">⚠️</span> 特殊情况由院校个案判定</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">05</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">伦敦国王学院 KCL</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：14天犹豫期</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 14天犹豫期内拒绝offer</li>
          <li><span style="color:#16a34a;">✅</span> 无法满足入学条件</li>
          <li><span style="color:#16a34a;">✅</span> 非学生过错导致签证被拒</li>
          <li><span style="color:#16a34a;">✅</span> 大学取消课程且学生无法调剂</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">06</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">曼彻斯特大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：接受offer后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 接受offer 14天内要求退还</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒绝</li>
          <li><span style="color:#16a34a;">✅</span> 不符合学术入学要求，需提供正式成绩单/文件</li>
          <li><span style="color:#16a34a;">✅</span> 不符合英语语言要求，需提供缴费后参加的语言测试官方证书</li>
          <li><span style="color:#16a34a;">✅</span> 因政府旅行限制无法前往</li>
          <li><span style="color:#ea580c;">⚠️</span> 自身特殊原因需相关证明</li>
          <li><span style="color:#16a34a;">✅</span> 学校取消课程，调剂专业不接受</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">07</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">布里斯托大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：缴纳后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 缴纳后14天内申请取消</li>
          <li><span style="color:#16a34a;">✅</span> 非申请人错误的签证被拒</li>
          <li><span style="color:#16a34a;">✅</span> 大学取消课程</li>
          <li><span style="color:#2563eb;">💰</span> 退费扣除£200管理费</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">08</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">华威大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：支付后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 支付后14天内书面通知招生团队</li>
          <li><span style="color:#16a34a;">✅</span> 未满足学术或语言条件（提供成绩证明）</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒（提供UKVI拒签信）</li>
          <li><span style="color:#2563eb;">💰</span> 2026年正课押金£1,500，原则上不可退还</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">09</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">伯明翰大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：接受offer后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 接受offer后14天内取消</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒（非欺诈性申请）</li>
          <li><span style="color:#16a34a;">✅</span> 大学取消课程</li>
          <li><span style="color:#16a34a;">✅</span> 未满足录取条件（含语言成绩）</li>
          <li><span style="color:#ea580c;">⚠️</span> 未达到英国但通知大学希望推迟入学，押金可结转一年</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">10</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">格拉斯哥大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：学校收到定金后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 学校无法提供入学名额</li>
          <li><span style="color:#16a34a;">✅</span> 本人或家属健康原因（如疾病、丧亲），需提供证明</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒或ATAS被拒</li>
          <li><span style="color:#16a34a;">✅</span> 未满足录取条件（学术或语言），语言退费需提供缴费后参加的考试成绩</li>
          <li><span style="color:#16a34a;">✅</span> 学校收到定金后14天内申请退款</li>
          <li><span style="color:#2563eb;">💰</span> 退费扣除25%手续费</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">11</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">利兹大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：学校收到付款后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 学校收到付款后14天内要求退款</li>
          <li><span style="color:#16a34a;">✅</span> 获得全额资助且资助人全额支付学费（提供证明）</li>
          <li><span style="color:#ea580c;">⚠️</span> PSE课程押金：若不符合硕士offer条件且未开始PSE学习，大学可能考虑退款</li>
          <li><span style="color:#ea580c;">⚠️</span> 不接受任何其他理由的退款请求</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">12</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">南安普顿大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：接受offer后14天内｜退费申请截止：同年9月30日前</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 接受offer后14天内取消（已注册不适用）</li>
          <li><span style="color:#16a34a;">✅</span> 因大学错误导致签证被UKVI拒绝</li>
          <li><span style="color:#16a34a;">✅</span> 大学取消课程</li>
          <li><span style="color:#16a34a;">✅</span> 未满足录取条件（学术/语言）</li>
          <li><span style="color:#ea580c;">⚠️</span> 因不可抗力（疫情、自然灾害）无法入学</li>
          <li><span style="color:#ea580c;">⚠️</span> 无法获得ATAS认证</li>
          <li style="color:#6b7280;font-size:12px;">退费流程：学校21天内回复，28天内打款</li>
        </ul>
      </div>
    </div>

    <div class="st-card">
      <div class="st-card-body" style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">13</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;">诺丁汉大学</div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">冷静期：缴纳后14天内</div>
        <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8;">
          <li><span style="color:#16a34a;">✅</span> 缴纳后14天内无理由全额退款</li>
          <li><span style="color:#16a34a;">✅</span> 签证被拒（非假材料原因），需提供拒签信</li>
          <li><span style="color:#16a34a;">✅</span> 未满足offer条件（语言或学术成绩未达标）</li>
          <li><span style="color:#16a34a;">✅</span> 课程被取消</li>
        </ul>
      </div>
    </div>

  </div>

  <div class="st-hint-bar st-hint-danger" style="margin-top:16px;">
    <span class="st-hint-icon">⚠️</span>
    <span>重要提醒：① 各校退费政策可能随时调整，具体以校方最新官方通知为准；② 退费申请通常需提供：拒签信、成绩单/语言成绩单、医疗证明等材料；③ 冷静期从学校收到付款之日起算，跨境汇款可能有1-3天延迟；④ 多数学校不接受「单纯后悔」「拿到更好offer」等主观理由退费。</span>
  </div>

  <div class="st-tool-footer">以上信息仅供参考，具体以校方最新政策为准</div>
</div>`,
        rawText: `【英国热门大学留位费退费政策汇总】
申请

ℹ️ 留位费即定金（Deposit），缴纳后锁定入学名额，入学后抵扣学费。各校退费政策不同，以下汇总13所英国热门大学的退费规则，供销售顾问快速查阅。具体以校方最新政策为准。

━━━━━━━━━━━━━━━━━━━━

01 帝国理工学院 IC
冷静期：无明确14天冷静期｜支付时间：接受offer后30天内
✅ 未能满足录取条件，并已尽力提供证据
✅ 签证被拒（非欺诈性申请或先前入境障碍），需提供UKVI拒签信
✅ 学校不再开设所申请专业
⚠️ 其他极端或特殊情况需个案审核

02 牛津大学
冷静期：接受offer后14天内
✅ 接受offer后14天内撤回
✅ 未满足学术条件，需提供考试成绩证明
✅ 未达到英语语言要求，需提供尝试但未通过的证据
✅ 签证被拒，需提供拒签证据
✅ 因不可预见情况无法学习，需提供证据

03 伦敦大学学院 UCL
冷静期：接受offer并支付押金后14天内
✅ 未满足学术条件（不含语言能力条件）
✅ 签证被拒绝
✅ UCL无法提供录取（原学习计划不可用）
✅ 接受offer后14天内改变主意（需在14天内支付押金且14天内终止）
✅ 入学前获得全额资助并提供证明

04 爱丁堡大学
冷静期：缴纳后14天内
✅ 缴纳后14天内要求退还
✅ 课程被取消且不接受调剂
✅ 未满足offer条件（含语言），需提供证据
✅ 学生签证或ATAS被拒（不含欺诈/资金不足/错误文件）
⚠️ 特殊情况由院校个案判定

05 伦敦国王学院 KCL
冷静期：14天犹豫期
✅ 14天犹豫期内拒绝offer
✅ 无法满足入学条件
✅ 非学生过错导致签证被拒
✅ 大学取消课程且学生无法调剂

06 曼彻斯特大学
冷静期：接受offer后14天内
✅ 接受offer 14天内要求退还
✅ 签证被拒绝
✅ 不符合学术入学要求，需提供正式成绩单/文件
✅ 不符合英语语言要求，需提供缴费后参加的语言测试官方证书
✅ 因政府旅行限制无法前往
⚠️ 自身特殊原因需相关证明
✅ 学校取消课程，调剂专业不接受

07 布里斯托大学
冷静期：缴纳后14天内
✅ 缴纳后14天内申请取消
✅ 非申请人错误的签证被拒
✅ 大学取消课程
💰 退费扣除£200管理费

08 华威大学
冷静期：支付后14天内
✅ 支付后14天内书面通知招生团队
✅ 未满足学术或语言条件（提供成绩证明）
✅ 签证被拒（提供UKVI拒签信）
💰 2026年正课押金£1,500，原则上不可退还

09 伯明翰大学
冷静期：接受offer后14天内
✅ 接受offer后14天内取消
✅ 签证被拒（非欺诈性申请）
✅ 大学取消课程
✅ 未满足录取条件（含语言成绩）
⚠️ 未达到英国但通知大学希望推迟入学，押金可结转一年

10 格拉斯哥大学
冷静期：学校收到定金后14天内
✅ 学校无法提供入学名额
✅ 本人或家属健康原因（如疾病、丧亲），需提供证明
✅ 签证被拒或ATAS被拒
✅ 未满足录取条件（学术或语言），语言退费需提供缴费后参加的考试成绩
✅ 学校收到定金后14天内申请退款
💰 退费扣除25%手续费

11 利兹大学
冷静期：学校收到付款后14天内
✅ 学校收到付款后14天内要求退款
✅ 获得全额资助且资助人全额支付学费（提供证明）
⚠️ PSE课程押金：若不符合硕士offer条件且未开始PSE学习，大学可能考虑退款
⚠️ 不接受任何其他理由的退款请求

12 南安普顿大学
冷静期：接受offer后14天内｜退费申请截止：同年9月30日前
✅ 接受offer后14天内取消（已注册不适用）
✅ 因大学错误导致签证被UKVI拒绝
✅ 大学取消课程
✅ 未满足录取条件（学术/语言）
⚠️ 因不可抗力（疫情、自然灾害）无法入学
⚠️ 无法获得ATAS认证
退费流程：学校21天内回复，28天内打款

13 诺丁汉大学
冷静期：缴纳后14天内
✅ 缴纳后14天内无理由全额退款
✅ 签证被拒（非假材料原因），需提供拒签信
✅ 未满足offer条件（语言或学术成绩未达标）
✅ 课程被取消

━━━━━━━━━━━━━━━━━━━━

⚠️ 重要提醒：
① 各校退费政策可能随时调整，具体以校方最新官方通知为准
② 退费申请通常需提供：拒签信、成绩单/语言成绩单、医疗证明等材料
③ 冷静期从学校收到付款之日起算，跨境汇款可能有1-3天延迟
④ 多数学校不接受「单纯后悔」「拿到更好offer」等主观理由退费

以上信息仅供参考，具体以校方最新政策为准`
    }
};

// ==================== AI话术工坊功能 ====================

// System Prompt
const STUDIO_SYSTEM_PROMPT = `你是一位B2B留学行业话术专家，帮助一代留学机构的BD/顾问生成专业的触达/跟进/谈判话术。

核心原则（必须遵守）：
1. 推新增不推替换：让对方多一个合作通道，不要求切换现有合作方，降低决策压力
2. 不诋毁同行：只共情问题本身，不评判对方现有合作方，不预设对方有问题
3. 角色边界：我方是一代BD/顾问，代表公司，共情用"我见过你们这种情况"，不说"我也这样过"
4. 收尾方式："先体验再决定"，如"不用您立马决定切换合作方，可以考虑新增一个合作通道"
5. 触达节奏：发完不追问，等1-2天，没回就换场景钩子再触

输出格式（必须严格遵循，不要输出⚠️原则提醒部分，该部分由前端固定展示）：

📊 客户痛点分析
（3-5条要点，每条1-2行）

🧠 匹配沟通框架：[框架名称]
（框架简述 + 适用原因，1-2行）

💬 话术方案

【第一步：XXX】
（具体话术文本）

【如果对方XXX】
（具体话术文本）

【如果对方XXX】
（具体话术文本）

注意：
- 话术要贴近微信聊天风格，短句、自然、像朋友说话。不要用大段书面语。
- 如果用户上传了文件（如聊天记录截图），仔细阅读其中的对话内容和上下文，基于真实对话场景生成话术。
- 每一步话术都要考虑对方可能的反应，给出分支应对。
- 我方不代理G5院校（牛津、剑桥、帝国理工、UCL、LSE），话术中不要提及我方可以做G5，避免过度承诺。
- 提到AI时，AI的角色是辅助做关键节点的提醒（如材料截止日期、offer回复截止等）和高频但常规问题快速答复，AI不是用来处理文书润色、基础信息处理或选校决策的。话术中描述AI能力时请用"AI辅助关键节点提醒和常规问题答复"，不要说"AI处理基础信息""AI文书润色""AI选校"等不准确的说法。

【客户分级画像与触达策略】（根据客户层级自动匹配，生成话术时必须参考）：

A+级（头部企业，公司≥100人，英爱业务线≥30人，年入学≥100人）：
- 痛点：院校覆盖有盲区（非会员院校需一代补充）、对稳定性和合规性要求极高
- 触达策略：以院校资源互补为核心钩子，不推佣金和服务快（他们不缺）；强调27年品牌+合规安全
- 首句方向："你们现有合作方覆盖不了的院校，我们来补"

A级（大型企业，公司≥50人，英爱业务线≥20人，年入学≥50人）：
- 痛点：院校资源有缺口、服务响应有期待、对AI辅助感兴趣但谨慎
- 触达策略：院校互补+服务专业度双重钩子，强调27年经验+佣金到账实时结算=安全可靠
- 首句方向："英国前100有代理的基本能做，能补你们现有合作方的缺口"

B级·转型公司（自带流量中途加留学业务，公司≥20人，年入学≥30人）：
- 痛点：懂流量但不懂留学业务、顾问经验不足定校容易踩坑、院校活动稀缺、业务培训需求强烈
- 触达策略："一站式建起英爱业务"——定校+培训+院校活动站台，帮他们快速补课；佣金到账实时结算对正在投钱建业务的转型公司现金流友好
- 首句方向："帮您快速建起英爱业务线——定校+培训+院校活动一站到位"

B级·留学公司（以留学为主营，公司≥20人，年入学≥30人）：
- 痛点：院校资源需要补充、院校活动需求增强签约转化、佣金结算效率关注
- 触达策略：院校资源互补+院校活动站台+佣金到账实时结算，强调专业度和稳定性
- 首句方向："我们XX院校有稳定通道，你们现有合作方可能覆盖不到"

C级（中型企业，公司<20人，英爱业务线≥5人，年入学≥10人）：
- 痛点：①获客焦虑（最痛！有固定数据源但不够，想拓展没方法没资源）②现金流敏感（等不起月结，佣金到账实时结算是刚需）③定校踩坑（没有专职研究院校的人，政策变化跟不上）④抗风险差（一个学生出问题就很被动）
- 触达策略：首句抛"佣金到账实时结算"直击现金流痛点→帮获客(业务培训)→定校避坑；语言短口语，3行等回复；不用"弹药库""多一个选择"——C级要省心伙伴不是更多选项
- 首句方向："佣金到账实时结算，不占您资金——另外我们有业务培训帮机构获客"

D级（小型企业，公司<10人，英爱业务线2-4人，年入学<10人）：
- 痛点：人手严重不足又做销售又做后期、服务响应要求极高、佣金实时结算比C级更敏感、定校完全依赖一代、怕被嫌小
- 触达策略："小机构也能享大机构服务"没有起定量一视同仁；佣金到账实时结算杀伤力最大；服务2小时响应帮补人手；不提AI（D级要的是人不信任机器）
- 首句方向："佣金到账实时结算，合作没门槛——无论大小机构我们都2小时响应"

E级（个人工作室，1-3人，年入学<5人）：
- 痛点：什么都要自己干最需要省心托管、合作模式要灵活不被绑死、佣金安全和便捷、专业度不足需全程指导
- 触达策略："一站式托管"从选校到申请到入学全程跟你只管招生；合作模式灵活没有最低量；佣金到账实时结算消除信任顾虑
- 首句方向："你招生我服务，佣金到账实时结算——全程托管，你不用操心后端"

F级（个人代理，1人兼职，年入学<3人）：
- 痛点：最关心佣金每单都是额外收入、不专业不想学、流程要极简、信任门槛高
- 触达策略：佣金到账实时结算唯一核心钩子；流程极简"推荐学生→我们全做→你拿佣金"；27年品牌+实时结算=信任保障
- 首句方向："推荐学生就赚佣金，到账实时结算——其他全部我们来处理"

【竞品差异化打法】（当客户背景提及现有合作方时，根据竞品名称匹配差异化话术）：
- 对方用加诚：我们更灵活不制式，佣金同样实时结算但服务更个性化
- 对方用启德：我们佣金到账实时结算不用等月结，27年只做英国爱尔兰比多国铺开更专
- 对方用HTI：我们后期也有人、假期找得到人，佣金不用等2个月
- 对方用SIUK：我们华威/GSA有直代且佣金Top，服务不止行业平均
- 对方用小希（澳际）：我们有人工服务不是纯系统，佣金实时结算同样安全

【U公司短板翻转话术】（当客户提出以下疑虑时使用）：
- 国家线少："只做英国爱尔兰，所以做得更深"
- 系统/技术偏弱："系统提醒+人工兜底，比纯系统更靠谱，比纯人工更高效"
- 品牌力不如头部："27年专注英国，不拼品牌拼专业度"
- 渠道覆盖有限："日常线上触达为主，节省下来的交通时间可以更好地为合作方提供服务，尤其是高峰期——老师们更希望随时能找到人做支持，而非永远在拜访的路上"
- 非纯B2B（客户担心C端冲突）：三步递进——①BC两端业务完全分开，学生系统两套，互不干扰 ②有严格保密机制，合作方信息完全安全 ③正因为有C端，更懂一线销售怎么获客怎么签学生，这些经验反过来赋能B端合作方，帮你们实现增量，合作共赢`;

// Coze Bot API配置管理
function getStudioConfig() {
    try {
        const saved = localStorage.getItem('studio_api_config');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { cozeToken: '', botId: '', planBotId: '' };
}

function saveStudioSettings() {
    const config = {
        cozeToken: document.getElementById('studioCozeToken').value.trim(),
        botId: document.getElementById('studioBotId').value.trim(),
        planBotId: document.getElementById('studioPlanBotId').value.trim()
    };
    localStorage.setItem('studio_api_config', JSON.stringify(config));
    closeStudioSettings();
    alert('设置已保存');
}

function openStudioSettings() {
    const config = getStudioConfig();
    const modal = document.getElementById('studioSettingsModal');
    document.getElementById('studioCozeToken').value = config.cozeToken || '';
    document.getElementById('studioBotId').value = config.botId || '';
    document.getElementById('studioPlanBotId').value = config.planBotId || '';
    modal.style.display = 'flex';
}

function closeStudioSettings() {
    document.getElementById('studioSettingsModal').style.display = 'none';
}

// 上传文件处理
let studioUploadedFiles = []; // {name, type, content (text/base64)}

async function handleStudioUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    
    for (const file of fileList) {
        try {
            const result = await processUploadFile(file);
            studioUploadedFiles.push(result);
        } catch(err) {
            console.error('文件处理失败:', file.name, err);
        }
    }
    renderStudioFileList();
}

async function processUploadFile(file) {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);
    const isDocx = /\.docx$/i.test(file.name);
    const isDoc = /\.doc$/i.test(file.name);
    const isTxt = /\.(txt|csv|md)$/i.test(file.name);

    if (isImage) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, type: 'image', content: reader.result });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } else if (isPdf) {
        await ensureLib('pdfjs');
        const buf = await readFileAsArrayBuffer(file);
        const typedArray = new Uint8Array(buf);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return { name: file.name, type: 'text', content: text.trim() };
    } else if (isDocx) {
        await ensureLib('mammoth');
        const buf = await readFileAsArrayBuffer(file);
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        return { name: file.name, type: 'text', content: result.value };
    } else if (isTxt) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, type: 'text', content: reader.result });
            reader.onerror = reject;
            reader.readAsText(file);
        });
    } else {
        return { name: file.name, type: 'unsupported', content: '' };
    }
}

function renderStudioFileList() {
    const list = document.getElementById('scFileList');
    if (!list) return;
    if (studioUploadedFiles.length === 0) {
        list.innerHTML = '';
        return;
    }
    list.innerHTML = studioUploadedFiles.map((f, i) => 
        '<div class="sc-file-item">' +
            '<i class="fas ' + (f.type === 'image' ? 'fa-image' : f.type === 'text' ? 'fa-file-alt' : 'fa-file') + '"></i>' +
            '<span class="sc-file-name">' + f.name + '</span>' +
            '<span class="sc-file-remove" onclick="removeStudioFile(' + i + ')"><i class="fas fa-times"></i></span>' +
        '</div>'
    ).join('');
}

function removeStudioFile(index) {
    studioUploadedFiles.splice(index, 1);
    renderStudioFileList();
}

// 拖拽上传
function setupStudioDragUpload() {
    const zone = document.getElementById('scUploadZone');
    if (!zone) return;
    
    // 点击上传区域触发文件选择
    zone.addEventListener('click', function(e) {
        if (e.target.id !== 'scFileInput') {
            document.getElementById('scFileInput').click();
        }
    });
    
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('sc-upload-dragover');
    });
    zone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('sc-upload-dragover');
    });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('sc-upload-dragover');
        if (e.dataTransfer.files.length > 0) {
            handleStudioUpload(e.dataTransfer.files);
        }
    });
}

// 构建用户消息（从studio表单）
function buildStudioMessage() {
    const textFiles = studioUploadedFiles.filter(f => f.type === 'text' && f.content);
    const imageFiles = studioUploadedFiles.filter(f => f.type === 'image' && f.content);
    
    let fileText = '';
    if (textFiles.length > 0) {
        fileText = textFiles.map(f => {
            const truncated = f.content.length > 3000 ? f.content.substring(0, 3000) + '...(内容过长已截断)' : f.content;
            return '【' + f.name + '】\n' + truncated;
        }).join('\n\n');
    }
    
    return { text: fileText, images: imageFiles };
}

// 流式调用Coze Bot API
async function streamCozeResponse(config, userMessage, outputArea) {
    const response = await fetch('https://api.coze.cn/v3/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.cozeToken
        },
        body: JSON.stringify({
            bot_id: config.botId,
            user_id: 'studio_user_' + Math.random().toString(36).substring(2, 8),
            stream: true,
            auto_save_history: false,
            additional_messages: [
                {
                    role: 'user',
                    content: userMessage,
                    content_type: 'text'
                }
            ]
        })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error('Coze API返回错误 (' + response.status + '): ' + errText.substring(0, 300));
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let firstChunk = true;  // 跟踪是否收到第一个内容片段
    
    // 显示加载动画（持续到收到第一个字符）
    outputArea.innerHTML = '<div class="studio-loading" id="studioLoadingIndicator"><div class="studio-dots"><span></span><span></span><span></span></div><p>AI正在思考话术方案，通常需要5-10秒...</p></div><div class="studio-stream-output" id="studioStreamOutput" style="display:none"></div>';
    const streamEl = document.getElementById('studioStreamOutput');
    const loadingEl = document.getElementById('studioLoadingIndicator');
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // 解析SSE事件类型
            if (trimmed.startsWith('event:')) {
                currentEvent = trimmed.slice(6).trim();
                continue;
            }
            
            // 只处理delta事件（流式文本片段）
            if (trimmed.startsWith('data:') && currentEvent === 'conversation.message.delta') {
                const data = trimmed.slice(5).trim();
                try {
                    const json = JSON.parse(data);
                    // Coze返回的delta消息，type=answer的是主回复
                    if (json.type === 'answer' && json.content) {
                        fullText += json.content;
                        // 收到第一个字符时隐藏loading，显示流式输出
                        if (firstChunk) {
                            if (loadingEl) loadingEl.style.display = 'none';
                            streamEl.style.display = '';
                            firstChunk = false;
                        }
                        renderStudioStream(fullText, streamEl);
                    }
                } catch(e) {
                    // 忽略解析错误
                }
            }
        }
    }
    
    // 流式结束，最终渲染（带复制按钮）
    renderStudioFinal(fullText, outputArea);
}

// 流式渲染（简单文本+打字机效果）
function renderStudioStream(text, el) {
    const html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/【([^】]+)】/g, '<strong class="sc-step-title">【$1】</strong>')
        .replace(/📊/g, '<span class="sc-emoji">📊</span>')
        .replace(/🧠/g, '<span class="sc-emoji">🧠</span>')
        .replace(/💬/g, '<span class="sc-emoji">💬</span>')
        .replace(/⚠️/g, '<span class="sc-emoji">⚠️</span>');
    el.innerHTML = html + '<span class="studio-stream-cursor">▊</span>';
}

// 最终渲染（结构化展示+复制按钮）
function renderStudioFinal(text, outputArea) {
    // 将LLM输出分段
    const painMatch = text.match(/📊[\s\S]*?(?=🧠|💬|$)/);
    const frameworkMatch = text.match(/🧠[\s\S]*?(?=💬|⚠️|$)/);
    const scriptMatch = text.match(/💬[\s\S]*?(?=⚠️|$)/);
    const principleMatch = text.match(/⚠️[\s\S]*$/);
    
    // 过滤AI误输出的原则提醒部分（前端已常驻展示，不需要AI重复输出）
    const cleanText = text.replace(/⚠️[\s\S]*$/, '').trim();
    const painText = painMatch ? painMatch[0] : '';
    const frameText = frameworkMatch ? frameworkMatch[0] : '';
    const scriptText = scriptMatch ? scriptMatch[0] : '';
    
    // 提取话术步骤
    const stepRegex = /【([^】]+)】([\s\S]*?)(?=【|$)/g;
    const steps = [];
    let m;
    while ((m = stepRegex.exec(scriptText)) !== null) {
        steps.push({ title: m[1], content: m[2].trim() });
    }
    
    // 构建HTML
    let html = '';
    
    // 痛点分析
    if (painText) {
        const painItems = painText.replace(/📊\s*客户痛点分析\s*/, '').trim().split(/\n/).filter(l => l.trim());
        html += '<div class="sc-block sc-pain-block">';
        html += '<div class="sc-block-title"><span class="sc-emoji">📊</span> 客户痛点分析</div>';
        html += '<ul class="sc-pain-list">';
        painItems.forEach(item => {
            const clean = item.replace(/^[-•*]\s*/, '').replace(/^\d+[.、]\s*/, '').trim();
            if (clean) html += '<li>' + escapeHtml(clean) + '</li>';
        });
        html += '</ul></div>';
    }
    
    // 沟通框架
    if (frameText) {
        const frameContent = frameText.replace(/🧠\s*匹配沟通框架[：:]\s*/, '').trim();
        const frameName = frameContent.match(/[^\n]+/)?.[0] || '';
        const frameDesc = frameContent.replace(frameName, '').trim();
        html += '<div class="sc-block sc-framework-block">';
        html += '<div class="sc-block-title"><span class="sc-emoji">🧠</span> 匹配沟通框架</div>';
        html += '<div class="sc-framework-name">' + escapeHtml(frameName) + '</div>';
        if (frameDesc) html += '<div class="sc-framework-desc">' + escapeHtml(frameDesc) + '</div>';
        html += '</div>';
    }
    
    // 话术方案
    if (steps.length > 0) {
        html += '<div class="sc-block sc-scripts-block">';
        html += '<div class="sc-block-title"><span class="sc-emoji">💬</span> 话术方案</div>';
        steps.forEach((step, idx) => {
            const copyId = 'sc-copy-' + Date.now() + '-' + idx;
            html += '<div class="sc-script-step">';
            html += '<div class="sc-step-header">';
            html += '<span class="sc-step-num">' + (idx + 1) + '</span>';
            html += '<span class="sc-step-title">' + escapeHtml(step.title) + '</span>';
            html += '<button class="studio-copy-btn" onclick="copyStudioScript(\'' + copyId + '\', this)"><i class="fas fa-copy"></i> 复制</button>';
            html += '</div>';
            html += '<div class="sc-step-content" id="' + copyId + '">' + escapeHtml(step.content).replace(/\n/g, '<br>') + '</div>';
            html += '</div>';
        });
        html += '</div>';
    } else if (scriptText) {
        html += '<div class="sc-block sc-scripts-block">';
        html += '<div class="sc-block-title"><span class="sc-emoji">💬</span> 话术方案</div>';
        const copyId = 'sc-copy-' + Date.now();
        html += '<div class="sc-script-step">';
        html += '<div class="sc-step-header">';
        html += '<button class="studio-copy-btn" onclick="copyStudioScript(\'' + copyId + '\', this)"><i class="fas fa-copy"></i> 复制</button>';
        html += '</div>';
        html += '<div class="sc-step-content" id="' + copyId + '">' + escapeHtml(scriptText.replace(/💬\s*话术方案\s*/, '').trim()).replace(/\n/g, '<br>') + '</div>';
        html += '</div></div>';
    }
    
    
    // 兜底：如果fullText有内容但解析不到emoji标记段落，直接原文展示
    if (!painText && !frameText && !scriptText && text.trim()) {
        html = '<div class="sc-block sc-scripts-block">'
             + '<div class="sc-block-title"><span class="sc-emoji">💬</span> 话术方案</div>'
             + '<div class="sc-script-step"><div class="sc-step-content">' 
             + escapeHtml(text).replace(/\n/g, '<br>') 
             + '</div></div></div>'
             + html;
    }
    
    // 空内容提示
    if (!text.trim() && !painText && !frameText && !scriptText) {
        html = '<div class="studio-error"><i class="fas fa-exclamation-circle"></i> 生成内容为空，请检查：1) Coze Token和Bot ID是否正确 2) Bot是否已发布 3) Bot是否配了系统Prompt</div>';
    }
    
    outputArea.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function copyStudioScript(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> 复制'; }, 1500);
    });
}




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

function renderTimeline(data) {
    const container = document.getElementById('competitorTimeline');
    if (!container) return;
    container.innerHTML = '';
    
    const items = data || competitorTimeline;
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:32px;">暂无竞品动态</div>';
        return;
    }
    
    items.forEach(item => {
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

// 从 Supabase 加载竞品动态，失败则用本地兜底数据
async function loadCompetitorNews() {
    if (!supabaseClient) {
        renderTimeline(competitorTimelineFallback);
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from('competitor_news')
            .select('*')
            .order('date', { ascending: false })
            .limit(30);
        if (error) throw error;
        if (data && data.length > 0) {
            const now = new Date();
            // 只展示7天内的动态
            const recentItems = data.filter(row => {
                const diffMs = now - new Date(row.date);
                return diffMs <= 7 * 24 * 60 * 60 * 1000;
            });
            if (recentItems.length === 0) {
                renderTimeline(competitorTimelineFallback);
                return;
            }
            const items = recentItems.map(row => {
                const rowDate = new Date(row.date);
                const diffDays = Math.floor((now - rowDate) / (1000 * 60 * 60 * 24));
                let dateLabel;
                if (diffDays === 0) dateLabel = '今天';
                else if (diffDays === 1) dateLabel = '昨天';
                else if (diffDays <= 3) dateLabel = `${diffDays}天前`;
                else dateLabel = '本周';
                return {
                    date: dateLabel,
                    tag: row.tag || '动态',
                    content: row.content,
                    source: row.source,
                    link: row.link || '#'
                };
            });
            competitorTimeline = items;
            renderTimeline(items);
        } else {
            renderTimeline(competitorTimelineFallback);
        }
    } catch (e) {
        console.warn('加载竞品动态失败，使用本地数据:', e);
        renderTimeline(competitorTimelineFallback);
    }
}

// 分享链接生成
function generateShareLink(type) {
    if (type === 'competitors') {
        // 竞品情报站：生成竞品信息收集链接
        generateCollectLink();
    } else {
        // 其他板块：生成查看型分享链接
        const shareUrl = window.location.href.split('#')[0].split('?')[0] + '?share=' + type;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('分享链接已复制到剪贴板！\n\n链接：' + shareUrl);
            });
        } else {
            prompt('请复制以下分享链接：', shareUrl);
        }
    }
}

// 生成竞品信息收集链接（写入share_links表，link_type='collect'）
async function generateCollectLink() {
    if (!supabaseClient) {
        alert('数据库未连接，无法生成收集链接');
        return;
    }
    
    // 生成8位随机token
    const token = 'cl-' + Math.random().toString(36).substring(2, 10);
    
    try {
        const { data, error } = await supabaseClient
            .from('share_links')
            .insert([{
                token: token,
                title: '竞品信息收集',
                sections: ['competitors'],
                is_active: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        const collectUrl = window.location.href.split('#')[0].split('?')[0] + '?collect=' + token;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(collectUrl).then(() => {
                alert('竞品信息收集链接已复制到剪贴板！\n\n他人可通过此链接提交竞品信息，提交后需在后台审核。\n\n链接：' + collectUrl);
            });
        } else {
            prompt('请复制以下竞品信息收集链接：', collectUrl);
        }
    } catch(err) {
        console.error('生成收集链接失败:', err);
        alert('生成收集链接失败：' + (err.message || '未知错误'));
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
                    radar: { brand: 7, price: 7, service: 7, channel: 7, product: 7, tech: 7 },
                    // attachments stored in source field for now
                    source: collectFiles.length > 0 ? (source ? source + ' | 附件: ' + collectFiles.map(f=>f.name).join(', ') : '附件: ' + collectFiles.map(f=>f.name).join(', ')) : source
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
        let 整理结果;
        if (isCollectMode) {
            // 收集模式：简洁结果
            整理结果 = `✅ 感谢您的反馈！`;
        } else {
            整理结果 = `【竞品信息整理结果】

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
        }
        
        document.getElementById('整理结果Box').textContent = 整理结果;
        // 收集模式下隐藏底部提示
        if (isCollectMode) {
            const resultTip = document.querySelector('#feedbackResult .result-tip');
            if (resultTip) resultTip.style.display = 'none';
        }
    } else {
        document.getElementById('整理结果Box').textContent = `提交失败：${errorMsg}\n\n请稍后重试或联系管理员。`;
    }
}

// 收集模式文件处理
let collectFiles = [];

function handleCollectFiles(files) {
    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            alert(`文件 ${file.name} 超过10MB限制，请压缩后上传`);
            continue;
        }
        collectFiles.push(file);
    }
    renderCollectFileList();
}

function removeCollectFile(index) {
    collectFiles.splice(index, 1);
    renderCollectFileList();
}

function renderCollectFileList() {
    const container = document.getElementById('collectFileList');
    if (!container) return;
    
    if (collectFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = collectFiles.map((f, i) => {
        const icon = f.type.startsWith('image/') ? 'fa-image' : 
                     f.type === 'application/pdf' ? 'fa-file-pdf' : 
                     f.type.includes('word') ? 'fa-file-word' : 'fa-file';
        const size = (f.size / 1024).toFixed(0);
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F3F4F6;">
            <i class="fas ${icon}" style="color:#6B7280;"></i>
            <span style="flex:1;font-size:0.85rem;">${f.name}</span>
            <span style="color:#9CA3AF;font-size:0.8rem;">${size}KB</span>
            <button type="button" onclick="removeCollectFile(${i})" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:0.85rem;">✕</button>
        </div>`;
    }).join('');
}

// 将文件转为Base64（用于存储到Supabase）
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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






// 获取胜任力配置文本（后台硬编码，前端不展示）
function getCompetencyPromptText() {
    return `- 沟通能力5级（设计策略）（预见到他人的需要和关注点，根据不同对象采取相应的沟通策略。对不同对象和情境所要求的沟通方式有系统和深入的认识，并能自如地运用和进行灵活调整。）
- 成就动机5级（挑战目标）（为自己制定具有挑战性的目标并采取具体行动去实现目标，如同类人员中的优秀标准。）
- 客户导向5级（重视长远利益）（担任客户的顾问角色，针对客户的需求、问题提出自己独立的观点，并采取行动解决问题。为客户寻找长期利益，提供增值服务。）
- 学习能力5级（提炼升华）（从经历的偶发体验或事件中，亲自总结出解决问题的方法并加以运用。）`;
}

// 九型人格沟通策略映射
const enneagramStrategies = {
    '1号完美型': '用数据、标准和合规性打动；强调我司27年行业规范、佣金透明安全',
    '2号助人型': '强调合作共赢、助力对方学生成长；突出服务口碑和陪伴感',
    '3号成就型': '用结果说话——成功案例、签约数据、效率提升；突出"签约更多学生"',
    '4号独特型': '强调我司差异化优势——英国前100有代理的院校覆盖、到账实时结算+可垫付、AI辅助关键节点提醒和常规答复',
    '5号理智型': '提供详实信息、院校名单、佣金结构；给足思考空间，不急于逼单',
    '6号忠诚型': '强调安全感和稳定性——27年历史、佣金安全保障、长期合作案例',
    '7号活跃型': '用新鲜感吸引——AI辅助提效、关键节点不遗漏；保持节奏轻快有趣',
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

async function generateScript() {
    const config = getStudioConfig();
    
    // 如果没配置Coze，走原有模板逻辑
    if (!config.cozeToken || !config.botId) {
        generateScriptTemplate();
        return;
    }
    
    // Coze Bot API路径
    const myRole = document.getElementById('myRole').value.trim();
    const companyInfo = document.getElementById('myCompanyInfo')?.value.trim() || '';
    const clientLevel = document.getElementById('clientLevel').value;
    const clientIdentity = document.getElementById('clientIdentity').value;
    const reachStage = document.getElementById('clientReachStage').value;
    const clientBackground = document.getElementById('clientBackground').value.trim();
    const clientNeeds = document.getElementById('clientNeeds').value.trim();
    
    if (!reachStage) { alert('请选择触达阶段'); return; }
    
    const outputArea = document.getElementById('generatedContent');
    const actionsArea = document.getElementById('scriptActions');
    
    // 构建用户消息（将系统Prompt拼入，确保Bot端无论是否配Prompt都能输出正确格式）
    const { text: fileText, images: fileImages } = buildStudioMessage();
    let competencyText = getCompetencyPromptText();
    // 后台追加九型3号定位
    const enneagram3Profile = '九型定位：3号·成就者——高情商的沟通、谈判专家。该角色具备强烈的目标导向和成就驱动力，善于高效沟通和谈判，能根据不同对象灵活调整沟通策略，为客户创造长期价值。';
    let userContent = `[系统指令]\n${STUDIO_SYSTEM_PROMPT}\n\n[用户输入]\n我方角色：${myRole}\n\n[角色画像]\n${enneagram3Profile}\n\n[胜任力画像]\n${competencyText}\n`;
    if (companyInfo) userContent += `我司情况：${companyInfo}\n`;
    if (clientLevel) userContent += `客户层级：${clientLevel}\n`;
    if (clientIdentity) userContent += `客户身份：${clientIdentity}\n`;
    userContent += `沟通阶段：${reachStage}\n`;
    if (clientBackground) userContent += `客户背景信息：${clientBackground}\n`;
    if (clientNeeds) userContent += `客户需求描述：${clientNeeds}\n`;
    if (fileText) userContent += `\n上传文件内容：\n${fileText}\n`;
    
    // 图片转为文字描述附加（Coze API v3 additional_messages仅支持文本）
    if (fileImages.length > 0) {
        userContent += `\n[提示：用户上传了${fileImages.length}张图片，但当前仅支持文本输入，请基于以上文字信息生成话术]\n`;
    }
    
    // 显示加载状态
    outputArea.innerHTML = '<div class="studio-loading"><div class="studio-dots"><span></span><span></span><span></span></div><p>正在生成话术方案...</p></div>';
    actionsArea.style.display = 'none';
    
    try {
        await streamCozeResponse(config, userContent, outputArea);
        actionsArea.style.display = 'flex';
    } catch(err) {
        outputArea.innerHTML = '<div class="studio-error"><i class="fas fa-exclamation-circle"></i> 生成失败：' + err.message + '</div>';
    }
}

function generateScriptTemplate() {
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
            opening = `${identityLabel}您好，我是${myRole}。今天不打长电话，就想问一句——贵司英国方向的佣金，现在多久结一次？我们这边到账实时结算，不少合作方之前都是季度甚至半年才拿到钱，换过来之后现金流松了不少。`;
        } else if (isSales) {
            opening = `${identityLabel}好，我是${myRole}。知道你们一线最在意什么——院校要多、佣金要稳、出了问题有人兜。英国方向我们前100有代理的院校基本覆盖了，佣金到账实时结算不拖欠，周末节假日也能找到人。`;
        } else if (isWailian) {
            opening = `${identityLabel}好，我是${myRole}。今天想跟您聊聊英国方向的院校资源和合作模式——KCL、曼大、华威、格拉斯哥这些我们都有代理，佣金政策也刚更新了。`;
        } else if (isHouqi) {
            opening = `${identityLabel}您好，我是${myRole}。想了解一下贵司英国方向后期的case对接还顺畅吗？不少后期老师反馈合作方回复慢、周末找不到人，我们人工为主、AI辅助提醒关键节点，基本当天响应。`;
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
        opening = `${identityLabel}，根据咱们前几次沟通，我对贵司的需求已经很清楚了。现在想确认一下合作方向——佣金到账实时结算、服务2小时响应、院校前100基本覆盖，这些您都OK的话，咱们就可以推进下一步了。`;
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
        'A级（头部企业）': '头部机构以院校互补为核心钩子，不推佣金和服务快',
        'B级（大型企业）': '需判断是转型公司还是留学公司：转型公司推一站式建英爱业务（定校+培训+院校活动），留学公司推院校互补+院校活动',
        'C级（中型企业）': '首句抛佣金到账实时结算直击现金流→帮获客(业务培训)→定校避坑，3行等回复',
        'D级（小型企业）': '佣金实时结算杀伤力最大，小机构也能享大机构服务，不提AI',
        'E级（个人工作室）': '一站式托管+佣金实时结算+合作模式灵活',
        'F级（个人代理）': '佣金实时结算是唯一核心钩子，流程极简'
    };
    if (clientNeeds) {
        const needsStr = clientNeeds.substring(0, 40);
        if (/佣金|结算|垫付|打款|费用/.test(needsStr)) {
            discovery = `关于您提到的"${needsStr}"——这确实是很多${identityLabel}最关心的事。我们这边佣金到账实时结算，不拖欠，而且部分情况可以垫付。${levelTips[clientLevel] || ''}。具体方案是这样的——`;
        } else if (/服务|响应|回复|周末|专业|效率/.test(needsStr)) {
            discovery = `关于您提到的"${needsStr}"——这是合作体验的核心。我们承诺工作日2小时内响应，周末节假日也能找到人，AI自动提醒关键节点、高频常规问题秒答复。${levelTips[clientLevel] || ''}。`;
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
        valueProp = `从决策角度看，跟我们合作就三件事：\n1️⃣ 【佣金安全】27年专注英国，佣金到账实时结算不拖欠，部分可垫付，合作方零资金风险\n2️⃣ 【院校覆盖广】英国前100有开放代理的院校基本能做（KCL、曼大、华威、格拉斯哥、利兹、南安普顿、谢菲、杜伦、诺丁汉等），爱尔兰TCD也有佣金，扩大可签约院校池\n3️⃣ 【服务省心】人工为主，AI辅助关键节点提醒和常规答复，工作日2小时响应，周末也有人，让您用更少精力签更多学生`;
    } else if (clientIdentity === '影响者' || isWailian) {
        valueProp = `从渠道合作角度，我想跟您分享几个核心点：\n• 院校资源：英国前100有开放代理的都能做，KCL、曼大、华威、格拉斯哥、利兹这些主力院校全覆盖，爱尔兰TCD也有佣金\n• 佣金结算：到账实时结算，透明安全，不占您资金\n• 操作流程：简洁高效，佣金明细每笔清楚\n很多合作方外联反馈，跟我们对接后英国方向资源补充明显，签约转化也提了。`;
    } else if (isHouqi) {
        valueProp = `从后期操作体验来说，我们围绕"省心"来设计：\n• 响应速度：工作日2小时内回复，周末和节假日也能找到人\n• 进度透明：AI自动提醒关键节点、高频常规问题秒答复，不用反复催问\n• 专业度：27年专注英国，各种case都处理过，疑难杂症也有经验\n• 紧急通道：突发情况直接打电话，24小时有人接`;
    } else if (isSales) {
        valueProp = `从销售签约角度，我们帮您解决三个核心问题：\n• 院校要多——英国前100有代理的基本能做，学生想申的院校我们有，签约成功率自然高\n• 佣金要稳——到账实时结算不拖欠，安全有保障\n• 出了问题有人兜——人工为主，AI辅助关键节点提醒和常规答复，周末节假日也能找到人，不会让您在学生面前掉链子`;
    } else {
        valueProp = `简单说三个核心优势：\n1️⃣ 佣金安全——到账实时结算不拖欠，部分可垫付\n2️⃣ 服务省心——工作日2小时响应，周末也有人\n3️⃣ 院校覆盖广——英国前100有代理的基本能做，爱尔兰TCD也有佣金`;
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
        lscpa = `${lLabel}："有稳定合作方，说明合作得不错才会一直做，对吧？"\n\n${sLabel}："找个靠谱的合作方不容易，稳定合作省很多沟通成本，换我我也不会随便换。"\n\n${cLabel}："我不是来抢人的，就想做个行业交流——您和现有合作方，主要看中的是哪块？佣金结算快？服务响应好？还是院校覆盖广？"\n\n${pLabel}："那还挺契合的，我们主做英国前100有代理的院校（KCL、曼大、华威、格拉斯哥等），佣金到账实时结算、部分可垫付——很多有稳定合作方的伙伴都是和我们搭着做，不要求替换，只是多一个备选。"\n\n${aLabel}："我把核心优势和院校清单发您一份，您空的时候看看，下周三下午我再跟您轻聊5分钟，同步下行业最新资源，您看可以吗？"`;
    } else if (objectionType === 'commission') {
        // 佣金异议："你们佣金不够高/结算不够快"
        lscpa = `${lLabel}："佣金确实是合作的核心，您比这个很正常。"\n\n${sLabel}："这一行佣金高低直接挂钩收益，谁都想拿更好的条件，换我我也得算清楚。"\n\n${cLabel}："您说的佣金顾虑，主要是比例不够高，还是结算周期太长、资金压太多？这两块解决思路不一样。"\n\n${pLabel}："我们差异化在这：第一，到账实时结算，很多同行季度甚至半年才打款，等于您白垫几个月；第二，部分可以垫付，行业里不多见；第三，签约效率高，同样时间多出几单，总账算下来更划算。"\n\n${aLabel}："我发一份佣金政策对比表给您，您跟现在条件比比看。下周二我再跟您简单聊聊，行吗？"`;
    } else if (objectionType === 'service') {
        // 服务异议："不确定你们服务行不行/响应快不快"
        lscpa = `${lLabel}："服务质量决定了合作能走多远，您有这个顾虑说明对学生负责。"\n\n${sLabel}："我听到不少老师吐槽过合作方前期说得好、签约后人就找不着了，这种体验太坑了。"\n\n${cLabel}："您之前遇到的问题，主要是响应慢、周末找不到人，还是申请过程沟通不透明？知道具体哪块不放心我才好对症说。"\n\n${pLabel}："这几个点我们正好都解决了——工作日2小时响应，周末节假日有人；AI自动提醒关键节点（材料截止、offer回复等），常规问题秒答复，不用催；紧急情况24小时电话直达。27年专注英国，各种case都处理过。"\n\n${aLabel}："您先推1-2个学生试试，感受下响应速度和专业度，体验不好随时停，零风险。您看这周能安排吗？"`;
    } else if (objectionType === 'coverage') {
        // 院校覆盖异议："你们能做哪些院校？够不够？"
        lscpa = `${lLabel}："院校资源是合作的地基，这块不够，别的都白搭。"\n\n${sLabel}："学生想申的院校做不了，等于白流失客户，这谁遇到都头疼。"\n\n${cLabel}："您目前最需要补充的是哪块？是有几个特定学校想做但现有合作方覆盖不了，还是整体英国方向的院校池想扩大？"\n\n${pLabel}："英国前100有开放代理的院校基本能做——KCL、曼大、布里斯托、华威、格拉斯哥、利兹、南安普顿、杜伦、诺丁汉是主力，爱尔兰TCD也有佣金。有特定院校想做告诉我，我去确认能不能加进来，院校池一直在扩展。"\n\n${aLabel}："我发一份最新院校清单和佣金表，您对照看看有没有缺口。有特别想加的也告诉我，查完给您反馈，可以吗？"`;
    } else if (objectionType === 'timing') {
        // 时机异议："不急/明年再说/今年肯定换不了"
        lscpa = `${lLabel}："目前确实没有紧迫的切换需求，这很正常。"\n\n${sLabel}："合作这种事得看时机，不是随便就能动的，我理解。"\n\n${cLabel}："想确认一下，是今年确实没计划了，还是想多了解几个选项备着？"\n\n${pLabel}："即使本年度暂无计划，可以先建立联系。不少合作方一开始只是了解着，等有需求时发现正好能满足，直接就启动了，不用从头筛选。您不需要做任何承诺。"\n\n${aLabel}："我把院校清单和佣金政策发您存着。另外想确认——如果下一年度贵司有补充或更换合作方的需求，咱们是否有优先洽谈的机会？到时候不用再重新找，您看可以吗？"`;
    } else {
        // 通用异议处理模板
        lscpa = `${lLabel}："您有顾虑是正常的，能说出来反而好沟通。"\n\n${sLabel}："选合作方确实要慎重，毕竟涉及到学生和佣金的事。"\n\n${cLabel}："方便说说您最担心的是哪方面吗？佣金安全、服务响应，还是院校覆盖？这样我可以有针对性地给您方案。"\n\n${pLabel}："不管您担心的是哪块，我们的核心承诺是：佣金到账实时结算不拖欠、服务2小时响应周末也有人、英国前100有代理的基本能做。具体顾虑我可以逐个给您解答。"\n\n${aLabel}："我先把核心优势资料发您看看，有问题随时问我，咱们不着急，您先了解着，您看可以吗？"`;
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
    const outputArea = document.getElementById('generatedContent');
    const content = outputArea.innerHTML;  // 存HTML保留结构
    const textContent = outputArea.textContent;
    if (!textContent || textContent.trim().length < 10) {
        alert('没有可收藏的话术内容');
        return;
    }
    
    // 从左侧配置区获取场景信息作为标题
    const myRole = document.getElementById('myRole')?.value.trim() || '话术';
    const clientLevel = document.getElementById('clientLevel')?.value || '';
    const reachStage = document.getElementById('clientReachStage')?.value || '';
    const clientBackground = document.getElementById('clientBackground')?.value.trim() || '';
    
    const title = `${myRole} → ${clientLevel}${reachStage ? '·' + reachStage : ''}`;
    const scene = clientBackground ? clientBackground.substring(0, 50) : '';
    
    // 读取已有收藏
    let favorites = [];
    try {
        const saved = localStorage.getItem('studio_favorites');
        if (saved) favorites = JSON.parse(saved);
    } catch(e) {}
    
    // 添加新收藏
    const newFav = {
        id: Date.now(),
        title: title,
        scene: scene,
        content: content.trim(),
        contentText: textContent.trim(),
        category: 'ai_generated',
        createdAt: new Date().toLocaleString('zh-CN')
    };
    favorites.unshift(newFav);
    
    localStorage.setItem('studio_favorites', JSON.stringify(favorites));
    
    // 更新按钮状态
    const btn = event.target.closest('button');
    if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> 已收藏';
        btn.disabled = true;
        btn.style.color = '#10b981';
        btn.style.borderColor = '#a7f3d0';
        setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    }
}

function clearGeneratedScript() {
    const outputArea = document.getElementById('generatedContent');
    const actionsArea = document.getElementById('scriptActions');
    outputArea.innerHTML = '<div class="placeholder-text"><i class="fas fa-comment-dots"></i><p>填写客户信息，点击"一键生成话术"获取定制化话术</p></div>';
    actionsArea.style.display = 'none';
}

// 获取收藏列表
function getStudioFavorites() {
    try {
        const saved = localStorage.getItem('studio_favorites');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
}

// 删除收藏
function deleteFavorite(id) {
    let favorites = getStudioFavorites();
    favorites = favorites.filter(f => f.id !== id);
    localStorage.setItem('studio_favorites', JSON.stringify(favorites));
    renderScripts(); // 重新渲染话术库
}

// ==================== 话术库功能 ====================

function renderScripts(category = 'all') {
    const container = document.getElementById('scriptCards');
    container.innerHTML = '';
    
    // 合并内置话术和AI生成收藏
    const favorites = getStudioFavorites();
    const favScripts = favorites.map(f => ({
        ...f,
        rating: 0,
        type: 'AI生成',
        isFavorite: true
    }));
    const allScripts = [...favScripts, ...scripts];
    
    let filtered = allScripts;
    if (category !== 'all') {
        filtered = allScripts.filter(s => s.category === category);
    }
    
    const searchTerm = document.getElementById('scriptSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(searchTerm) ||
            s.content.toLowerCase().includes(searchTerm) ||
            (s.scene || '').toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i>暂无话术</div>';
        return;
    }
    
    filtered.forEach(script => {
        const card = document.createElement('div');
        card.className = 'script-card' + (script.isFavorite ? ' script-card-ai' : '');
        card.id = `script-${script.id}`;
        
        let stars = '';
        for (let i = 0; i < (script.rating || 0); i++) stars += '★';
        
        const isFav = script.isFavorite;
        const deleteAction = isFav 
            ? `<button class="script-action-btn script-action-btn-danger" title="删除" onclick="deleteFavorite(${script.id})"><i class="fas fa-trash"></i></button>`
            : `<button class="script-action-btn" title="编辑" onclick="openEditScript(${script.id})"><i class="fas fa-pen"></i></button><button class="script-action-btn script-action-btn-danger" title="删除" onclick="deleteScript(${script.id})"><i class="fas fa-trash"></i></button>`;
        const tagLabel = isFav ? '🤖 AI生成' : (categoryNames[script.category] || script.category);
        const timeLabel = isFav && script.createdAt ? `<span style="font-size:11px;color:#999;margin-left:8px;">${script.createdAt}</span>` : '';
        
        card.innerHTML = `
            <div class="script-card-header">
                <div>
                    <div class="script-card-title">${isFav ? '🤖 ' : ''}${script.title}${timeLabel}</div>
                    <div class="script-card-scene">${script.scene || ''}</div>
                </div>
                <div class="script-card-actions-top">
                    <div class="script-rating">${stars}</div>
                    ${deleteAction}
                </div>
            </div>
            <div class="script-card-content">${isFav ? script.content : script.content.replace(/\n/g, '<br>')}</div>
            <div class="script-card-footer">
                <span class="script-type-tag">${tagLabel}</span>
                <div class="script-card-footer-actions">
                    <button class="btn btn-sm btn-outline" onclick="copyScriptContent(${script.id})"><i class="fas fa-copy"></i> 复制</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function copyScriptContent(id) {
    // 先在内置话术中找，再在收藏中找
    let script = scripts.find(s => s.id === id);
    let copyText = script ? script.content : '';
    
    if (!script) {
        const fav = getStudioFavorites().find(f => f.id === id);
        if (fav) copyText = fav.contentText || fav.content;
    }
    
    if (copyText) {
        navigator.clipboard.writeText(copyText).then(() => {
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

// 工具筛选状态
let currentTagFilter = 'all';
let currentSearchQuery = '';

function filterTools() {
    const input = document.getElementById('toolSearchInput');
    const clearBtn = document.getElementById('toolSearchClear');
    currentSearchQuery = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', currentSearchQuery.length > 0);
    applyFilters();
}

function clearToolSearch() {
    const input = document.getElementById('toolSearchInput');
    input.value = '';
    currentSearchQuery = '';
    document.getElementById('toolSearchClear').classList.remove('visible');
    applyFilters();
}

function filterByTag(el) {
    document.querySelectorAll('.tools-tag-filter').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    currentTagFilter = el.dataset.filter;
    applyFilters();
}

function applyFilters() {
    const cards = document.querySelectorAll('#toolsGrid .tool-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const tag = card.dataset.tag || '';
        const keywords = (card.dataset.keywords || '').toLowerCase();
        const title = (card.querySelector('h4')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
        const fullText = title + ' ' + desc + ' ' + keywords;
        
        const tagMatch = currentTagFilter === 'all' || tag === currentTagFilter;
        const searchMatch = !currentSearchQuery || fullText.includes(currentSearchQuery);
        
        if (tagMatch && searchMatch) {
            card.classList.remove('hidden-filter');
            visibleCount++;
        } else {
            card.classList.add('hidden-filter');
        }
    });

    // 无结果提示
    const grid = document.getElementById('toolsGrid');
    let emptyTip = grid.querySelector('.tools-empty');
    if (visibleCount === 0) {
        if (!emptyTip) {
            emptyTip = document.createElement('div');
            emptyTip.className = 'tools-empty';
            emptyTip.innerHTML = '<i class="fas fa-search"></i><p>没有找到匹配的工具，试试其他关键词</p>';
            grid.appendChild(emptyTip);
        }
    } else if (emptyTip) {
        emptyTip.remove();
    }
}

function openTool(toolId) {
    const modal = document.getElementById('toolModal');
    const body = document.getElementById('toolModalBody');
    
    const tool = toolContents[toolId];
    
    // 从localStorage读取自定义内容（如有）
    const savedContent = localStorage.getItem('tool_' + toolId);
    // 如果savedContent是旧纯文本（不以<开头），显示时用新的结构化HTML，编辑时用rawText
    const isSavedHtml = savedContent && savedContent.trim().startsWith('<');
    const currentContent = isSavedHtml ? savedContent : tool.content;
    const currentRawText = savedContent || tool.rawText || tool.content;
    
    const toolTag = tool.tag || '';
    body.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="toggleToolEdit('${toolId}')" id="toolEditBtn">
                <i class="fas fa-edit"></i> 编辑
            </button>
            <div class="tool-export-dropdown" style="position:relative;display:inline-block;">
                <button class="btn btn-outline btn-sm" onclick="toggleExportMenu()">
                    <i class="fas fa-file-export"></i> 导出
                </button>
                <div class="export-menu" id="exportMenu" style="display:none;position:absolute;top:100%;left:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:100;min-width:140px;margin-top:4px;">
                    <div class="export-menu-item" onclick="exportTool('${toolId}','word')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.875rem;color:#374151;border-bottom:1px solid #f3f4f6;">
                        <i class="fas fa-file-word" style="color:#2b579a"></i> Word
                    </div>
                    <div class="export-menu-item" onclick="exportTool('${toolId}','pdf')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.875rem;color:#374151;border-bottom:1px solid #f3f4f6;">
                        <i class="fas fa-file-pdf" style="color:#e74c3c"></i> PDF
                    </div>
                    <div class="export-menu-item" onclick="exportTool('${toolId}','jpg')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.875rem;color:#374151;border-bottom:1px solid #f3f4f6;">
                        <i class="fas fa-file-image" style="color:#e67e22"></i> JPG
                    </div>
                    <div class="export-menu-item" onclick="exportTool('${toolId}','png')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.875rem;color:#374151;">
                        <i class="fas fa-file-image" style="color:#27ae60"></i> PNG
                    </div>
                </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('toolContentArea').innerText).then(() => { const b=document.getElementById('toolCopyBtn'); b.innerHTML='<i class=\\'fas fa-check\\'></i> 已复制'; setTimeout(()=>b.innerHTML='<i class=\\'fas fa-copy\\'></i> 复制',1500); })" id="toolCopyBtn">
                <i class="fas fa-copy"></i> 复制
            </button>
        </div>
        <!-- 附件区域 -->
        <div class="st-attachment-section" id="stAttachmentSection">
            <div class="st-attachment-header" onclick="toggleAttachmentPanel()">
                <span class="st-attachment-toggle"><i class="fas fa-paperclip"></i> 附件 <span id="stAttachmentCount" class="st-attachment-count">0</span></span>
                <i class="fas fa-chevron-down st-attachment-arrow" id="stAttachmentArrow"></i>
            </div>
            <div class="st-attachment-panel" id="stAttachmentPanel" style="display:none;">
                <div class="st-attachment-upload st-attachment-upload-btn" id="stUploadArea" onclick="document.getElementById('stFileInput').click()">
                    <input type="file" id="stFileInput" style="display:none;" multiple accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar" onchange="handleToolFileUpload('${toolId}', this.files)">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <span>点击或拖拽文件上传</span>
                    <span class="st-upload-hint">支持图片/PDF/Office等格式，单文件最大10MB</span>
                </div>
                <div class="st-attachment-list" id="stAttachmentList">
                    <div class="st-attachment-empty"><i class="fas fa-inbox"></i> 暂无附件</div>
                </div>
            </div>
        </div>
        <div id="toolContentArea" class="st-tool-container" data-tool-id="${toolId}">${currentContent}</div>
        <div id="toolEditArea" style="display:none;">
            <textarea id="toolEditTextarea" style="width:100%;min-height:400px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:.875rem;line-height:1.6;font-family:inherit;resize:vertical;white-space:pre-wrap;">${currentRawText}</textarea>
            <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
                <button class="btn btn-outline btn-sm" onclick="cancelToolEdit('${toolId}')">取消</button>
                <button class="btn btn-primary btn-sm" onclick="saveToolEdit('${toolId}')"><i class="fas fa-save"></i> 保存</button>
                <button class="btn btn-outline btn-sm" style="color:#ef4444;border-color:#fecaca;" onclick="resetToolEdit('${toolId}')"><i class="fas fa-undo"></i> 恢复默认</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // 加载附件列表
    loadToolFiles(toolId);
    
    // 设置拖拽上传
    setupDragUpload(toolId);
    
    // 分享模式下隐藏上传和删除
    if (isShareMode) {
        const uploadArea = document.getElementById('stUploadArea');
        if (uploadArea) uploadArea.style.display = 'none';
    }
}

// 切换编辑模式
function toggleToolEdit(toolId) {
    const contentArea = document.getElementById('toolContentArea');
    const editArea = document.getElementById('toolEditArea');
    const editBtn = document.getElementById('toolEditBtn');
    
    if (editArea.style.display === 'none') {
        contentArea.style.display = 'none';
        editArea.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-eye"></i> 预览';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-outline');
        document.getElementById('toolEditTextarea').focus();
    } else {
        // 预览：把textarea内容临时显示
        const textarea = document.getElementById('toolEditTextarea');
        // If the textarea content looks like HTML (starts with <), render as HTML; otherwise as text
        const text = textarea.value;
        if (text.trim().startsWith('<')) {
            contentArea.innerHTML = text;
        } else {
            contentArea.textContent = text;
        }
        contentArea.style.display = 'block';
        editArea.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
        editBtn.classList.remove('btn-outline');
        editBtn.classList.add('btn-primary');
    }
}

function cancelToolEdit(toolId) {
    const contentArea = document.getElementById('toolContentArea');
    const editArea = document.getElementById('toolEditArea');
    const editBtn = document.getElementById('toolEditBtn');
    contentArea.style.display = 'block';
    editArea.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
    editBtn.classList.remove('btn-outline');
    editBtn.classList.add('btn-primary');
}

function saveToolEdit(toolId) {
    const textarea = document.getElementById('toolEditTextarea');
    const newContent = textarea.value;
    localStorage.setItem('tool_' + toolId, newContent);
    
    const contentArea = document.getElementById('toolContentArea');
    // If saved content looks like HTML, render as HTML
    if (newContent.trim().startsWith('<')) {
        contentArea.innerHTML = newContent;
    } else {
        contentArea.textContent = newContent;
    }
    
    cancelToolEdit(toolId);
    
    // 保存成功提示
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;z-index:10000;font-size:.875rem;box-shadow:0 4px 12px rgba(0,0,0,.2);';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> 已保存';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function resetToolEdit(toolId) {
    if (!confirm('确定恢复为默认内容？您的自定义修改将丢失。')) return;
    localStorage.removeItem('tool_' + toolId);
    const tool = toolContents[toolId];
    const contentArea = document.getElementById('toolContentArea');
    const textarea = document.getElementById('toolEditTextarea');
    contentArea.innerHTML = tool.content;
    textarea.value = tool.rawText || tool.content;
    cancelToolEdit(toolId);
}

// 导出菜单切换
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// 点击其他区域关闭导出菜单
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.tool-export-dropdown');
    const menu = document.getElementById('exportMenu');
    if (menu && dropdown && !dropdown.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// 导出功能
async function exportTool(toolId, format) {
    const menu = document.getElementById('exportMenu');
    if (menu) menu.style.display = 'none';
    
    const tool = toolContents[toolId];
    const savedContent = localStorage.getItem('tool_' + toolId);
    const isSavedHtml = savedContent && savedContent.trim().startsWith('<');
    const content = isSavedHtml ? savedContent : tool.content;
    const isHtmlContent = content.trim().startsWith('<');
    const rawForExport = savedContent || tool.rawText || tool.content;
    
    // 创建用于导出的临时DOM
    const exportDiv = document.createElement('div');
    exportDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:#fff;padding:48px;font-family:"Microsoft YaHei","PingFang SC",sans-serif;';
    
    if (isHtmlContent) {
        exportDiv.innerHTML = `
            <div style="border-bottom:3px solid #4a7fc4;padding-bottom:16px;margin-bottom:24px;">
                <h1 style="font-size:24px;color:#2d3748;margin:0;">${tool.title}</h1>
            </div>
            <div style="font-size:14px;line-height:1.8;color:#374151;">${content}</div>
            <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:12px;font-size:11px;color:#9ca3af;text-align:right;">
                以上信息仅供参考，具体请以官方信息为准。
            </div>`;
    } else {
        exportDiv.innerHTML = `
            <div style="border-bottom:3px solid #3b5998;padding-bottom:16px;margin-bottom:24px;">
                <h1 style="font-size:24px;color:#1f2937;margin:0;">${tool.title}</h1>
            </div>
            <div style="font-size:14px;line-height:1.8;color:#374151;white-space:pre-wrap;">${content}</div>
            <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:12px;font-size:11px;color:#9ca3af;text-align:right;">
                以上信息仅供参考，具体请以官方信息为准。
            </div>`;
    }
    document.body.appendChild(exportDiv);

    try {
        if (format === 'word') {
            exportAsWord(tool.title, exportDiv.innerHTML);
        } else if (format === 'pdf') {
            await exportAsImage(exportDiv, tool.title, 'pdf');
        } else {
            await exportAsImage(exportDiv, tool.title, format);
        }
    } catch (err) {
        console.error('导出失败:', err);
        alert('导出失败，请重试');
    } finally {
        document.body.removeChild(exportDiv);
    }
}

// 导出为Word
function exportAsWord(title, htmlContent) {
    // For HTML content (from structured tools), use directly; for plain text, convert newlines
    let formattedContent;
    if (htmlContent.includes('st-card') || htmlContent.includes('st-tool-container')) {
        // Already HTML, use as-is
        formattedContent = htmlContent;
    } else {
        // Plain text: convert newlines to <br>
        formattedContent = htmlContent.replace(/\n/g, '<br>');
    }
    const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>${title}</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
        <style>
            body { font-family: "Microsoft YaHei","PingFang SC",sans-serif; font-size: 14px; line-height: 2; color: #374151; padding: 0; margin: 0; }
            h1 { font-size: 22px; color: #1f2937; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid #3b5998; }
            br { display: block; margin: 0; line-height: 1; }
            div { margin: 0; padding: 0; }
            .st-card { border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; overflow: hidden; }
            .st-card-header { background: linear-gradient(90deg, #4a7fc4, #6b9ce0); padding: 8px 16px; color: #fff; font-weight: 600; }
            .st-card-body { padding: 16px; }
            .st-hint-bar { padding: 8px 12px; border-radius: 8px; margin: 6px 0; font-size: 13px; }
            .st-hint-bar.st-tip { background: #eef8f0; color: #2d6a3f; }
            .st-hint-bar.st-warn { background: #fef6e6; color: #92610a; }
            .st-hint-bar.st-info { background: #eef4fb; color: #2d5f8a; }
            .st-timeline { padding-left: 20px; }
            .st-tl-label { font-weight: 700; color: #2d3748; }
            .st-tl-desc { color: #64748b; font-size: 13px; }
            .st-checklist li { padding: 4px 0; list-style: none; }
            .st-checklist-icon { display: inline-block; width: 14px; height: 14px; border: 1px solid #cbd5e1; border-radius: 3px; margin-right: 8px; vertical-align: middle; }
            .st-section-title { font-weight: 700; color: #2d3748; margin: 12px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .st-info-grid { display: table; width: 100%; }
            .st-info-grid-item { display: table-cell; width: 50%; padding: 8px; text-align: center; background: #f7f9fc; border: 1px solid #f0f4fa; }
            .st-igi-label { font-size: 12px; color: #94a3b8; }
            .st-igi-value { font-size: 16px; color: #4a7fc4; font-weight: 700; }
            .st-tag-list { margin: 8px 0; }
            .st-tag-item { display: inline-block; background: #f0f4fa; color: #4a7fc4; border-radius: 12px; padding: 4px 12px; margin: 3px; font-size: 13px; }
            .st-flow { text-align: center; margin: 8px 0; }
            .st-flow-step { display: inline-block; background: #4a7fc4; color: #fff; border-radius: 6px; padding: 6px 14px; margin: 3px; font-size: 13px; font-weight: 600; }
            .st-flow-arrow { color: #a8c8f0; margin: 0 4px; }
            .st-compare-table { width: 100%; border-collapse: collapse; }
            .st-compare-table th { background: #4a7fc4; color: #fff; padding: 8px 12px; text-align: left; }
            .st-compare-table td { padding: 6px 12px; border-bottom: 1px solid #f0f4fa; }
            .st-tool-header { text-align: center; padding: 16px 0; }
            .st-tool-header h1 { font-size: 22px; color: #2d3748; border: none; padding: 0; margin: 8px 0; }
            .st-tool-header-icon { display: inline-block; }
            .st-tag { display: inline-block; background: #4a7fc4; color: #fff; padding: 2px 12px; border-radius: 12px; font-size: 12px; }
            .st-tool-footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 12px 0; }
            .st-bullet-list { list-style: none; padding: 0; }
            .st-bullet-list li { padding: 2px 0; }
            .st-bullet-list li::before { content: '•'; color: #4a7fc4; font-weight: bold; margin-right: 6px; }
            a { color: #4a7fc4; }
        </style></head>
        <body>${formattedContent}</body></html>`;
    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = title + '.doc';
    a.click();
    URL.revokeObjectURL(url);
}

// 导出为图片或PDF
async function exportAsImage(element, title, format) {
    // 动态加载html2canvas
    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
    }
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    
    if (format === 'pdf') {
        // 动态加载jsPDF
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
            document.head.appendChild(script);
            await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
        }
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save(title + '.pdf');
    } else {
        const a = document.createElement('a');
        if (format === 'jpg') {
            a.href = canvas.toDataURL('image/jpeg', 0.95);
            a.download = title + '.jpg';
        } else {
            a.href = canvas.toDataURL('image/png');
            a.download = title + '.png';
        }
        a.click();
    }
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
            <div class="enneagram-desc">${type.cardDesc || type.subtitle}</div>
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

// 当前是否处于分享模式
let isShareMode = false;
let isCollectMode = false; // 是否为竞品收集模式
let shareConfig = null; // 当前分享配置

function checkShareMode() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 检查 ?collect=token 竞品信息收集模式
    const collectToken = urlParams.get('collect');
    if (collectToken) {
        document.documentElement.classList.add('share-loading');
        loadCollectConfig(collectToken);
        return;
    }
    
    // 检查 URL 参数 ?share=token
    const shareToken = urlParams.get('share');
    
    if (shareToken) {
        // 立即隐藏所有内容，防止闪烁
        document.documentElement.classList.add('share-loading');
        // 基于 token 的分享模式
        loadShareConfig(shareToken);
        return;
    }
    
    // 兼容旧的 hash 分享模式
    const hash = window.location.hash;
    
    if (hash === '#share-competitors') {
        // 竞品分享模式（旧版兼容）
        isShareMode = true;
        shareConfig = { sections: ['competitors'] };
        if (sessionStorage.getItem('salesEmpowerment_shareVerified') === 'true') {
            activateShareMode(shareConfig);
        } else {
            document.documentElement.classList.remove('not-logged-in');
            _pendingShareConfig = shareConfig;
            document.getElementById('sharePasswordGate').style.display = 'flex';
            document.getElementById('sharePasswordInput').focus();
        }
    } else if (hash === '#share-enneagram-test') {
        // 九型测试分享模式（旧版兼容）
        isShareMode = true;
        shareConfig = { sections: ['enneagram'] };
        if (sessionStorage.getItem('salesEmpowerment_shareVerified') === 'true') {
            activateShareMode(shareConfig);
            showEnneaTab('test');
        } else {
            document.documentElement.classList.remove('not-logged-in');
            _pendingShareConfig = shareConfig;
            _pendingShowEnnea = true;
            document.getElementById('sharePasswordGate').style.display = 'flex';
            document.getElementById('sharePasswordInput').focus();
        }
    } else if (hash === '#admin') {
        // 管理后台模式
        enableAdminMode();
    }
}

// 加载竞品信息收集链接配置
async function loadCollectConfig(token) {
    if (!supabaseClient) {
        document.documentElement.classList.remove('share-loading');
        showShareInvalid('数据库未连接，无法验证收集链接');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('share_links')
            .select('*')
            .eq('token', token)
            .single();
        
        if (error || !data) {
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该收集链接不存在', '请确认链接是否正确，或联系分享者获取新的链接。');
            return;
        }
        
        if (!data.is_active) {
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该收集链接已被禁用', '请联系分享者了解详情。');
            return;
        }
        
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该收集链接已过期', '请联系分享者获取新的链接。');
            return;
        }
        
        // 有效收集链接，激活收集模式
        isShareMode = true;
        isCollectMode = true;
        shareConfig = data;
        activateCollectMode(data);
        
    } catch(err) {
        console.error('加载收集链接配置失败:', err);
        document.documentElement.classList.remove('share-loading');
        showShareInvalid('验证收集链接时出错', err.message);
    }
}

// 激活竞品信息收集模式
function activateCollectMode(data) {
    // 隐藏侧边栏、顶部导航、header、主状态栏
    document.getElementById('shareHeader').style.display = 'none';
    document.querySelector('.top-bar').style.display = 'none';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('mainContent').classList.add('share-mode');
    
    // 隐藏所有导航项
    document.querySelectorAll('.nav-item').forEach(item => {
        item.style.display = 'none';
    });
    
    // 隐藏后台管理入口
    const adminNavItem = document.getElementById('adminNavItem');
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // 切换到竞品情报站页面
    switchPage('competitors');
    
    // 隐藏竞品表格和筛选器，只显示收集表单
    setTimeout(() => {
        const filtersBar = document.getElementById('competitorFilters');
        if (filtersBar) filtersBar.style.display = 'none';
        
        // 隐藏竞品总览卡片
        const compCards = document.querySelectorAll('#page-competitors > .card');
        compCards.forEach(card => {
            if (card.id !== 'competitorFeedbackForm' && card.id !== 'feedbackResult') {
                card.style.display = 'none';
            }
        });
        
        // 隐藏竞品动态时间线
        const timelineSection = document.querySelector('#page-competitors .timeline-container');
        if (timelineSection) timelineSection.parentElement.style.display = 'none';
        
        // 收集模式下不显示说明卡片
        
        // 显示收集表单
        const feedbackForm = document.getElementById('competitorFeedbackForm');
        if (feedbackForm) feedbackForm.style.display = 'block';
        
        // 更新表单标题
        const formTitle = feedbackForm.querySelector('h3');
        if (formTitle) formTitle.innerHTML = '<i class="fas fa-pen-fancy"></i> 提交竞品信息';
        const formHint = feedbackForm.querySelector('.hint');
        if (formHint) formHint.textContent = '请填写您了解到的竞品信息，提交后将由管理员审核。您也可以上传相关资料截图。';
        
        // 显示文件上传区域
        const uploadArea = document.getElementById('collectFileUpload');
        if (uploadArea) uploadArea.style.display = 'block';
        
        // 隐藏竞品弹窗相关的查看按钮
        const modalTriggers = document.querySelectorAll('#page-competitors [onclick*="openCompetitor"]');
        modalTriggers.forEach(el => el.style.display = 'none');
    }, 100);
    
    // 移除加载遮罩
    document.documentElement.classList.remove('share-loading');
    document.documentElement.classList.remove('not-logged-in');
}

// 从 Supabase 加载分享配置
async function loadShareConfig(token) {
    if (!supabaseClient) {
        document.documentElement.classList.remove('share-loading');
        showShareInvalid('数据库未连接，无法验证分享链接');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('share_links')
            .select('*')
            .eq('token', token)
            .single();
        
        if (error || !data) {
            // 兼容旧版 ?share=competitors / ?share=enneagram 等板块名格式
            const sectionMap = {
                'competitors': ['competitors'],
                'enneagram': ['enneagram'],
                'tools': ['tools'],
                'ai-studio': ['ai-studio'],
                'ai-studio:craft': ['ai-studio:craft'],
                'ai-studio:library': ['ai-studio:library'],
                'enneagram:types': ['enneagram:types'],
                'enneagram:test': ['enneagram:test'],
                'enneagram:team': ['enneagram:team']
            };
            if (sectionMap[token]) {
                isShareMode = true;
                shareConfig = { sections: sectionMap[token] };
                if (sessionStorage.getItem('salesEmpowerment_shareVerified') === 'true') {
                    activateShareMode(shareConfig);
                } else {
                    document.documentElement.classList.remove('share-loading');
                    document.documentElement.classList.remove('not-logged-in');
                    _pendingShareConfig = shareConfig;
                    document.getElementById('sharePasswordGate').style.display = 'flex';
                    document.getElementById('sharePasswordInput').focus();
                }
                return;
            }
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该分享链接不存在', '请确认链接是否正确，或联系分享者获取新的链接。');
            return;
        }
        
        // 检查是否启用
        if (!data.is_active) {
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该分享链接已被禁用', '请联系分享者了解详情。');
            return;
        }
        
        // 检查是否过期
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            document.documentElement.classList.remove('share-loading');
            showShareInvalid('该分享链接已过期', '链接已于 ' + new Date(data.expires_at).toLocaleString('zh-CN') + ' 过期，请联系分享者获取新的链接。');
            return;
        }
        
        // 有效链接，检查分享密码
        isShareMode = true;
        shareConfig = data;
        
        // 检查是否已通过分享密码验证
        if (sessionStorage.getItem('salesEmpowerment_shareVerified') === 'true') {
            activateShareMode(data);
        } else {
            // 需要输入密码，先移除加载遮罩，显示密码界面
            document.documentElement.classList.remove('share-loading');
            document.documentElement.classList.remove('not-logged-in');
            _pendingShareConfig = data;
            document.getElementById('sharePasswordGate').style.display = 'flex';
            document.getElementById('sharePasswordInput').focus();
        }
        
    } catch(err) {
        console.error('加载分享配置失败:', err);
        document.documentElement.classList.remove('share-loading');
        showShareInvalid('验证分享链接时出错', err.message);
    }
}

// 激活分享模式（密码验证通过后调用）
function activateShareMode(data) {
    document.getElementById('shareHeader').style.display = 'flex';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('mainContent').classList.add('share-mode');
    
    // 如果分享链接包含AI话术工坊且有Coze配置，自动注入
    if (data.studio_bot_id && data.studio_coze_token) {
        const currentConfig = getStudioConfig();
        // 仅在本地没有配置时使用分享链接的配置（避免覆盖管理员自己的）
        if (!currentConfig.cozeToken || !currentConfig.botId) {
            localStorage.setItem('studio_api_config', JSON.stringify({
                cozeToken: data.studio_coze_token,
                botId: data.studio_bot_id
            }));
        }
    }
    
    applyShareMode(data);
    
    // 验证完成，移除加载遮罩和登录门禁，显示内容
    document.documentElement.classList.remove('share-loading');
    document.documentElement.classList.remove('not-logged-in');
}

// 显示分享无效提示
function showShareInvalid(title, msg) {
    document.getElementById('shareInvalidTitle').textContent = title || '分享链接无效';
    document.getElementById('shareInvalidMsg').textContent = msg || '该分享链接不存在或已失效，请联系分享者获取新的链接。';
    document.getElementById('shareInvalidModal').classList.add('active');
    // 隐藏主内容区
    document.getElementById('mainContent').style.opacity = '0.3';
    document.getElementById('mainContent').style.pointerEvents = 'none';
}

// 根据分享配置隐藏/显示元素
function applyShareMode(config) {
    const sections = config.sections || [];
    
    // 判断AI话术工坊的子板块可见性
    const hasFullStudio = sections.includes('ai-studio');
    const hasStudioCraft = sections.includes('ai-studio:craft');
    const hasStudioLibrary = sections.includes('ai-studio:library');
    const showStudioTab = hasFullStudio || hasStudioCraft;    // 显示AI话术工坊tab
    const showLibraryTab = hasFullStudio || hasStudioLibrary;  // 显示话术库tab
    const hasAnyStudio = hasFullStudio || hasStudioCraft || hasStudioLibrary;
    
    // 构建导航可见板块列表（将子板块映射回父板块用于导航）
    const navSections = [];
    const seen = new Set();
    for (const s of sections) {
        const navPage = s.startsWith('ai-studio') ? 'ai-studio' : (s.startsWith('enneagram') ? 'enneagram' : s);
        if (!seen.has(navPage)) {
            navSections.push(navPage);
            seen.add(navPage);
        }
    }
    
    // 隐藏后台管理入口（分享模式不显示管理后台）
    const adminNavItem = document.getElementById('adminNavItem');
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // 隐藏头像菜单中的后台管理
    const avatarMenu = document.getElementById('avatarMenu');
    if (avatarMenu) avatarMenu.style.display = 'none';
    const avatarBtn = document.getElementById('avatarBtn');
    if (avatarBtn) avatarBtn.style.display = 'none';
    
    // 隐藏顶部导航中的后台管理
    const goAdminItem = document.querySelector('.avatar-menu-item[onclick="goAdmin()"]');
    if (goAdminItem) goAdminItem.style.display = 'none';
    
    // 只显示被允许的板块导航项
    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.dataset.page;
        if (page === 'admin') {
            item.style.display = 'none'; // 分享模式始终隐藏管理后台
        } else if (navSections.includes(page)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // 如果有多个板块，显示侧边栏；如果只有一个板块，隐藏侧边栏
    if (navSections.length > 1) {
        document.getElementById('sidebar').style.display = 'block';
    }
    
    // 切换到第一个允许的板块
    if (navSections.length > 0) {
        switchPage(navSections[0]);
    }
    
    // ===== AI话术工坊子板块Tab控制 =====
    if (hasAnyStudio) {
        const studioTabBtn = document.querySelector('.module-tabs .tab-btn[onclick*="showStudioTab(\'studio\')"]');
        const libraryTabBtn = document.querySelector('.module-tabs .tab-btn[onclick*="showStudioTab(\'library\')"]');
        
        if (studioTabBtn) studioTabBtn.style.display = showStudioTab ? '' : 'none';
        if (libraryTabBtn) libraryTabBtn.style.display = showLibraryTab ? '' : 'none';
        
        // 如果话术工坊tab不可见但话术库可见，自动切换到话术库tab
        if (!showStudioTab && showLibraryTab) {
            const studioTabContent = document.getElementById('studio-tab');
            const libraryTabContent = document.getElementById('library-tab');
            if (studioTabBtn) studioTabBtn.classList.remove('active');
            if (libraryTabBtn) libraryTabBtn.classList.add('active');
            if (studioTabContent) studioTabContent.classList.remove('active');
            if (libraryTabContent) libraryTabContent.classList.add('active');
        }
    }
    
    // ===== 各板块的特殊处理 =====
    
    // 竞品情报站：隐藏提交表单、编辑/删除按钮、新增/导出按钮
    if (sections.includes('competitors')) {
        // 隐藏筛选器中的分享按钮
        const shareBtn = document.getElementById('shareCompetitorBtn');
        if (shareBtn) shareBtn.style.display = 'none';
        // 隐藏新增/导出按钮
        const cardActions = document.querySelector('#page-competitors .card-actions');
        if (cardActions) cardActions.style.display = 'none';
        // 隐藏反馈表单
        const feedbackForm = document.getElementById('competitorFeedbackForm');
        if (feedbackForm) feedbackForm.style.display = 'none';
        // 隐藏提交结果
        const feedbackResult = document.getElementById('feedbackResult');
        if (feedbackResult) feedbackResult.style.display = 'none';
        // 竞品表格中的操作列会在渲染时通过CSS隐藏
    }
    
    // AI话术工坊：根据子板块权限控制生成按钮
    if (hasAnyStudio) {
        // 隐藏新增话术按钮
        const addScriptBtn = document.querySelector('#page-ai-studio .filters-bar .btn-primary');
        if (addScriptBtn) addScriptBtn.style.display = 'none';
        // 有生成权限时显示生成按钮，无生成权限时隐藏
        const generateBtn = document.getElementById('generateScript');
        if (generateBtn) generateBtn.style.display = showStudioTab ? '' : 'none';
        // 话术卡片中的编辑/删除按钮通过CSS隐藏
    }
    
    // 销售工具箱：隐藏编辑和导出按钮，隐藏附件上传/删除
    if (sections.includes('tools')) {
        // 工具详情弹窗中的编辑/导出按钮通过CSS隐藏
        // 附件区域的上传/删除按钮在 openTool 中根据 isShareMode 动态处理
    }
    
    // ===== 九型人格子板块Tab控制 =====
    const hasFullEnneagram = sections.includes('enneagram');
    const hasEnneaTypes = hasFullEnneagram || sections.includes('enneagram:types');
    const hasEnneaTest = hasFullEnneagram || sections.includes('enneagram:test');
    const hasEnneaTeam = hasFullEnneagram || sections.includes('enneagram:team');
    const hasAnyEnneagram = hasFullEnneagram || sections.includes('enneagram:types') || sections.includes('enneagram:test') || sections.includes('enneagram:team');
    
    if (hasAnyEnneagram) {
        const enneaTabBtns = document.querySelectorAll('#page-enneagram .tab-btn');
        enneaTabBtns.forEach(btn => {
            const onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes("showEnneaTab('types')")) btn.style.display = hasEnneaTypes ? '' : 'none';
            if (onclick.includes("showEnneaTab('test')")) btn.style.display = hasEnneaTest ? '' : 'none';
            if (onclick.includes("showEnneaTab('team')")) btn.style.display = hasEnneaTeam ? '' : 'none';
        });
        // 同步隐藏对应的内容区域
        const enneaTypesContent = document.getElementById('ennea-types');
        const enneaTestContent = document.getElementById('ennea-test');
        const enneaTeamContent = document.getElementById('ennea-team');
        if (enneaTypesContent) enneaTypesContent.style.display = hasEnneaTypes ? '' : 'none';
        if (enneaTestContent) enneaTestContent.style.display = hasEnneaTest ? '' : 'none';
        if (enneaTeamContent) enneaTeamContent.style.display = hasEnneaTeam ? '' : 'none';
        // 如果默认tab被隐藏，自动切换到第一个可见tab
        const activeTab = document.querySelector('#page-enneagram .tab-btn.active');
        if (activeTab && activeTab.style.display === 'none') {
            const firstVisible = document.querySelector('#page-enneagram .tab-btn:not([style*="display: none"])');
            if (firstVisible) firstVisible.click();
        }
    }
    
    // 九型人格：隐藏测试保存功能
    if (hasAnyEnneagram) {
        // 测试保存按钮通过CSS隐藏
    }
    
    // 方案生成：分享模式下只读
    if (sections.includes('plan-generator')) {
        // 院校数据库已移除，无需额外隐藏操作
    }
}

function exitShareMode() {
    // 清除URL参数，回到首页
    const url = new URL(window.location);
    url.searchParams.delete('share');
    window.location.href = url.pathname;
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
            if (page === 'admin') {
                enableAdminMode();
            } else {
                switchPage(page);
            }
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
    loadCompetitorNews();
    renderRadarChart();
    renderScripts();
    renderEnneagramCards();
    
    // 初始化工具附件 Storage Bucket
    initToolFilesBucket();
    
    // 初始化AI话术工坊拖拽上传
    setupStudioDragUpload();
    
    // 阻止全局拖拽的默认行为
    document.addEventListener('dragover', function(e) { e.preventDefault(); });
    document.addEventListener('drop', function(e) { e.preventDefault(); });
    
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
    
    // 切换到admin页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const adminPage = document.getElementById('page-admin');
    if (adminPage) adminPage.classList.add('active');
    if (navItem) navItem.classList.add('active');
    
    // 重置管理页面显示状态
    const loginCard = document.getElementById('adminLoginCard');
    const adminPanel = document.getElementById('adminPanel');
    
    // 检查是否已登录管理后台
    if (localStorage.getItem('salesEmpowerment_admin') === 'true') {
        if (loginCard) loginCard.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        isAdminMode = true;
        loadAllSubmissions();
    } else {
        // 未登录：显示登录卡片，隐藏管理面板
        if (loginCard) loginCard.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
    }
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
    // 不立即加载分享链接，等切换到分享管理 tab 时再加载
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

// ==================== 管理面板 Tab 切换 ====================

function switchAdminSection(sectionName) {
    // 切换 tab 按钮状态
    document.querySelectorAll('.admin-section-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === sectionName);
    });
    
    // 切换内容区
    document.querySelectorAll('.admin-section-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (sectionName === 'competitor-mgmt') {
        document.getElementById('adminSectionCompetitorMgmt').classList.add('active');
    } else if (sectionName === 'share-mgmt') {
        document.getElementById('adminSectionShareMgmt').classList.add('active');
        loadShareLinks();
    }
}

// ==================== 分享链接管理 ====================

// 板块名称映射
const SECTION_NAMES = {
    'competitors': '竞品情报站',
    'ai-studio': 'AI话术工坊',
    'ai-studio:craft': 'AI话术工坊-生成',
    'ai-studio:library': 'AI话术工坊-话术库',
    'tools': '销售工具箱',
    'enneagram': '九型人格',
    'plan-generator': '方案生成'
};

// 获取板块标签显示名（合并子板块显示）
function getSectionDisplayName(section) {
    if (section === 'ai-studio') return 'AI话术工坊（全部）';
    if (section === 'ai-studio:craft') return 'AI话术工坊-生成';
    if (section === 'ai-studio:library') return 'AI话术工坊-话术库';
    if (section === 'enneagram:types') return '九型人格-详解';
    if (section === 'enneagram:test') return '九型人格-测试';
    if (section === 'enneagram:team') return '九型人格-团队';
    return SECTION_NAMES[section] || section;
}

// 获取板块标签列表（处理子板块合并显示）
function getSectionDisplayTags(sections) {
    const tags = [];
    const hasCraft = sections.includes('ai-studio:craft');
    const hasLibrary = sections.includes('ai-studio:library');
    const hasFullStudio = sections.includes('ai-studio');
    
    for (const s of sections) {
        if (s === 'ai-studio:craft' || s === 'ai-studio:library') continue; // 跳过，后面统一处理
        if (s === 'ai-studio') {
            tags.push({ key: s, name: 'AI话术工坊（全部）' });
        } else {
            tags.push({ key: s, name: getSectionDisplayName(s) });
        }
    }
    // 处理子板块合并
    if (!hasFullStudio) {
        if (hasCraft && hasLibrary) {
            tags.push({ key: 'ai-studio:craft+library', name: 'AI话术工坊（全部）' });
        } else if (hasCraft) {
            tags.push({ key: 'ai-studio:craft', name: 'AI话术工坊-生成' });
        } else if (hasLibrary) {
            tags.push({ key: 'ai-studio:library', name: 'AI话术工坊-话术库' });
        
        // 九型人格子板块标签
        const hasEnneaTypes = sections.includes('enneagram:types');
        const hasEnneaTest = sections.includes('enneagram:test');
        const hasEnneaTeam = sections.includes('enneagram:team');
        if (hasEnneaTypes && hasEnneaTest && hasEnneaTeam) {
            // Don't add individual tags, will be handled as full enneagram below
        } else {
            if (hasEnneaTypes) tags.push({ key: 'enneagram:types', name: '九型人格-详解' });
            if (hasEnneaTest) tags.push({ key: 'enneagram:test', name: '九型人格-测试' });
            if (hasEnneaTeam) tags.push({ key: 'enneagram:team', name: '九型人格-团队' });
        }
        }
    }
    return tags;
}

// 当前编辑的分享链接ID（null表示创建模式）
let _editingShareLinkId = null;

// AI话术工坊子板块展开/折叠
function toggleStudioSubOptions() {
    const aiStudioChecked = document.querySelector('input[name="shareSection"][value="ai-studio"]').checked;
    const subOptions = document.getElementById('studioSubOptions');
    if (aiStudioChecked) {
        subOptions.style.display = 'block';
        // 默认两个都勾选
        document.querySelectorAll('input[name="shareSubStudio"]').forEach(cb => cb.checked = true);
    } else {
        subOptions.style.display = 'none';
    }
}

function toggleEnneagramSubOptions() {
    const enneagramChecked = document.querySelector('input[name="shareSection"][value="enneagram"]').checked;
    const subOptions = document.getElementById('enneagramSubOptions');
    if (enneagramChecked) {
        subOptions.style.display = 'block';
        // 默认三个都勾选
        document.querySelectorAll('input[name="shareSubEnneagram"]').forEach(cb => cb.checked = true);
    } else {
        subOptions.style.display = 'none';
    }
}

// 生成8位随机 token
function generateToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    let token = '';
    for (let i = 0; i < 8; i++) {
        token += chars[array[i] % chars.length];
    }
    return token;
}

// 加载分享链接列表
async function loadShareLinks() {
    if (!supabaseClient) {
        document.getElementById('shareLinksList').innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 数据库未连接，请先完成 Supabase 配置</p>';
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('share_links')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderShareLinks(data || []);
    } catch(err) {
        console.error('加载分享链接失败:', err);
        if (err.message && err.message.includes('does not exist')) {
            document.getElementById('shareLinksList').innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> share_links 表不存在，请先在 Supabase Dashboard 执行 supabase_share_links.sql 建表</p>';
        } else {
            document.getElementById('shareLinksList').innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 加载失败: ' + err.message + '</p>';
        }
    }
}

// 渲染分享链接列表
function renderShareLinks(links) {
    const container = document.getElementById('shareLinksList');
    
    if (links.length === 0) {
        container.innerHTML = '<p class="hint" style="text-align:center;padding:40px 0;">暂无分享链接，点击上方"创建分享链接"开始</p>';
        return;
    }
    
    container.innerHTML = links.map(link => {
        const sectionTags = getSectionDisplayTags(link.sections || []).map(t =>
            `<span class="share-section-tag">${t.name}</span>`
        ).join('');
        
        const statusBadge = link.is_active
            ? '<span class="admin-status approved"><i class="fas fa-check-circle"></i> 启用中</span>'
            : '<span class="admin-status rejected"><i class="fas fa-times-circle"></i> 已禁用</span>';
        
        const expireInfo = link.expires_at
            ? `<span style="font-size:0.8rem;color:${new Date(link.expires_at) < new Date() ? '#EF4444' : '#6B7280'}"><i class="fas fa-clock"></i> ${new Date(link.expires_at) < new Date() ? '已过期' : '过期于'} ${new Date(link.expires_at).toLocaleString('zh-CN')}</span>`
            : '<span style="font-size:0.8rem;color:#10B981"><i class="fas fa-infinity"></i> 永久有效</span>';
        
        // 区分收集链接和查看链接
        const isCollect = link.token && link.token.startsWith('cl-');
        const linkTypeLabel = isCollect 
            ? '<span style="background:#8B5CF6;color:white;padding:2px 8px;border-radius:4px;font-size:0.75rem;margin-left:6px;"><i class="fas fa-pen"></i> 收集</span>'
            : '<span style="background:#3B82F6;color:white;padding:2px 8px;border-radius:4px;font-size:0.75rem;margin-left:6px;"><i class="fas fa-eye"></i> 查看</span>';
        const shareUrl = isCollect 
            ? `https://fancy0214.github.io/sales-empowerment-v2/?collect=${link.token}`
            : `https://fancy0214.github.io/sales-empowerment-v2/?share=${link.token}`;
        
        const dateStr = link.created_at ? new Date(link.created_at).toLocaleString('zh-CN') : '';
        
        return `
            <div class="share-link-card ${link.is_active ? '' : 'disabled'}">
                <div class="share-link-card-header">
                    <div>
                        <strong style="font-size:1.05rem;">${link.title || '未命名分享'}</strong>
                        ${linkTypeLabel}
                        ${statusBadge}
                    </div>
                    <div class="share-link-card-meta">
                        ${dateStr ? `<span><i class="fas fa-calendar"></i> ${dateStr}</span>` : ''}
                        ${expireInfo}
                    </div>
                </div>
                <div class="share-link-card-body">
                    <div class="share-link-sections">${sectionTags}</div>
                    <div class="share-link-url">
                        <code>${shareUrl}</code>
                        <button class="btn btn-sm btn-outline" onclick="copyShareLink('${link.token}')">
                            <i class="fas fa-copy"></i> 复制
                        </button>
                    </div>
                </div>
                <div class="share-link-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="openEditShareLink('${link.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-sm ${link.is_active ? 'btn-outline' : ''}" style="${link.is_active ? '' : 'background:#10B981;color:white;'}" onclick="toggleShareLink('${link.id}', ${!link.is_active})">
                        <i class="fas fa-${link.is_active ? 'ban' : 'check'}"></i> ${link.is_active ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-sm" style="background:#EF4444;color:white;" onclick="deleteShareLink('${link.id}')">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 打开创建分享链接弹窗
function openCreateShareLink() {
    _editingShareLinkId = null;
    document.getElementById('shareLinkTitle').value = '';
    document.getElementById('shareLinkExpires').value = '';
    document.querySelectorAll('input[name="shareSection"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="shareSubStudio"]').forEach(cb => cb.checked = false);
    const enneagramSubOptions = document.getElementById('enneagramSubOptions');
    if (enneagramSubOptions) enneagramSubOptions.style.display = 'none';
    document.querySelectorAll('input[name="shareSubEnneagram"]').forEach(cb => cb.checked = false);
    document.getElementById('studioSubOptions').style.display = 'none';
    // 更新弹窗标题和按钮
    document.querySelector('#createShareLinkModal h2').innerHTML = '<i class="fas fa-share-alt"></i> 创建分享链接';
    document.querySelector('#createShareLinkModal .btn-primary').innerHTML = '<i class="fas fa-link"></i> 创建链接';
    document.getElementById('createShareLinkModal').classList.add('active');
}

// 打开编辑分享链接弹窗
function openEditShareLink(id) {
    if (!supabaseClient) return;
    
    // 从当前加载的链接列表中找到对应链接
    const linkCards = document.querySelectorAll('.share-link-card');
    // 通过 Supabase 重新查询单条记录
    supabaseClient
        .from('share_links')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
            if (error || !data) {
                alert('获取分享链接信息失败');
                return;
            }
            
            _editingShareLinkId = id;
            document.getElementById('shareLinkTitle').value = data.title || '';
            document.getElementById('shareLinkExpires').value = data.expires_at ? data.expires_at.slice(0, 16) : '';
            
            // 处理板块勾选
            const sections = data.sections || [];
            document.querySelectorAll('input[name="shareSection"]').forEach(cb => {
                cb.checked = sections.includes(cb.value);
            });
            
            // 处理AI话术工坊子板块
            const hasFullStudio = sections.includes('ai-studio');
            const hasCraft = sections.includes('ai-studio:craft');
            const hasLibrary = sections.includes('ai-studio:library');
            
            const subOptions = document.getElementById('studioSubOptions');
            const aiStudioCheckbox = document.querySelector('input[name="shareSection"][value="ai-studio"]');
            
            if (hasFullStudio || hasCraft || hasLibrary) {
                aiStudioCheckbox.checked = true;
                subOptions.style.display = 'block';
                document.querySelector('input[name="shareSubStudio"][value="craft"]').checked = hasFullStudio || hasCraft;
                document.querySelector('input[name="shareSubStudio"][value="library"]').checked = hasFullStudio || hasLibrary;
            } else {
                subOptions.style.display = 'none';
                document.querySelectorAll('input[name="shareSubStudio"]').forEach(cb => cb.checked = false);
            }
            
            // 处理九型人格子板块
            const hasFullEnneagram = sections.includes('enneagram');
            const hasTypes = sections.includes('enneagram:types');
            const hasTest = sections.includes('enneagram:test');
            const hasTeam = sections.includes('enneagram:team');
            
            const enneagramSubOptions = document.getElementById('enneagramSubOptions');
            const enneagramCheckbox = document.querySelector('input[name="shareSection"][value="enneagram"]');
            
            if (hasFullEnneagram || hasTypes || hasTest || hasTeam) {
                enneagramCheckbox.checked = true;
                enneagramSubOptions.style.display = 'block';
                document.querySelector('input[name="shareSubEnneagram"][value="types"]').checked = hasFullEnneagram || hasTypes;
                document.querySelector('input[name="shareSubEnneagram"][value="test"]').checked = hasFullEnneagram || hasTest;
                document.querySelector('input[name="shareSubEnneagram"][value="team"]').checked = hasFullEnneagram || hasTeam;
            } else {
                enneagramSubOptions.style.display = 'none';
                document.querySelectorAll('input[name="shareSubEnneagram"]').forEach(cb => cb.checked = false);
            }
            
            // 更新弹窗标题和按钮
            document.querySelector('#createShareLinkModal h2').innerHTML = '<i class="fas fa-edit"></i> 编辑分享链接';
            document.querySelector('#createShareLinkModal .btn-primary').innerHTML = '<i class="fas fa-save"></i> 保存修改';
            document.getElementById('createShareLinkModal').classList.add('active');
        });
}

// 创建/编辑分享链接
async function createShareLink(event) {
    event.preventDefault();
    
    if (!supabaseClient) {
        alert('数据库未连接，请先完成 Supabase 配置');
        return;
    }
    
    const title = document.getElementById('shareLinkTitle').value.trim();
    const sections = [];
    const aiStudioChecked = document.querySelector('input[name="shareSection"][value="ai-studio"]').checked;
    
    // 收集非AI话术工坊、非九型人格的板块（这俩有子板块逻辑单独处理）
    document.querySelectorAll('input[name="shareSection"]:checked').forEach(cb => {
        if (cb.value !== 'ai-studio' && cb.value !== 'enneagram') {
            sections.push(cb.value);
        }
    });
    
    // 处理AI话术工坊子板块
    if (aiStudioChecked) {
        const subCraft = document.querySelector('input[name="shareSubStudio"][value="craft"]').checked;
        const subLibrary = document.querySelector('input[name="shareSubStudio"][value="library"]').checked;
        
        if (!subCraft && !subLibrary) {
            alert('AI话术工坊至少需要选择一个子板块');
            return;
        }
        
        if (subCraft && subLibrary) {
            sections.push('ai-studio');
        } else if (subCraft) {
            sections.push('ai-studio:craft');
        } else {
            sections.push('ai-studio:library');
        }
    }
    
    // 处理九型人格子板块
    const enneagramChecked = document.querySelector('input[name="shareSection"][value="enneagram"]').checked;
    if (enneagramChecked) {
        const subTypes = document.querySelector('input[name="shareSubEnneagram"][value="types"]').checked;
        const subTest = document.querySelector('input[name="shareSubEnneagram"][value="test"]').checked;
        const subTeam = document.querySelector('input[name="shareSubEnneagram"][value="team"]').checked;
        
        if (!subTypes && !subTest && !subTeam) {
            alert('九型人格至少需要选择一个子板块');
            return;
        }
        
        if (subTypes && subTest && subTeam) {
            sections.push('enneagram');
        } else {
            if (subTypes) sections.push('enneagram:types');
            if (subTest) sections.push('enneagram:test');
            if (subTeam) sections.push('enneagram:team');
        }
    }
    
    if (sections.length === 0) {
        alert('请至少选择一个要分享的板块');
        return;
    }
    
    const expiresAt = document.getElementById('shareLinkExpires').value || null;
    
    // 编辑模式
    if (_editingShareLinkId) {
        try {
            const updateData = {
                title: title || '未命名分享',
                sections: sections,
                expires_at: expiresAt
            };
            // 如果包含AI话术工坊，存入当前Coze配置
            const hasAnyStudio = sections.some(s => s.startsWith('ai-studio'));
            if (hasAnyStudio) {
                const studioConfig = getStudioConfig();
                if (studioConfig.botId) updateData.studio_bot_id = studioConfig.botId;
                if (studioConfig.cozeToken) updateData.studio_coze_token = studioConfig.cozeToken;
            }
            
            const { error } = await supabaseClient
                .from('share_links')
                .update(updateData)
                .eq('id', _editingShareLinkId);
            
            if (error) throw error;
            
            _editingShareLinkId = null;
            closeModal('createShareLinkModal');
            await loadShareLinks();
            alert('分享链接已更新！');
        } catch(err) {
            console.error('更新分享链接失败:', err);
            alert('更新失败: ' + err.message);
        }
        return;
    }
    
    // 创建模式
    // 生成唯一 token
    const token = generateToken();
    
    try {
        // 如果包含AI话术工坊，存入当前Coze配置
        const insertData = {
            token: token,
            title: title || '未命名分享',
            sections: sections,
            is_active: true,
            expires_at: expiresAt
        };
        const hasAnyStudio = sections.some(s => s.startsWith('ai-studio'));
        if (hasAnyStudio) {
            const studioConfig = getStudioConfig();
            if (studioConfig.botId) insertData.studio_bot_id = studioConfig.botId;
            if (studioConfig.cozeToken) insertData.studio_coze_token = studioConfig.cozeToken;
        }
        
        const { data, error } = await supabaseClient
            .from('share_links')
            .insert([insertData])
            .select();
        
        if (error) throw error;
        
        closeModal('createShareLinkModal');
        await loadShareLinks();
        
        // 自动复制新链接
        const shareUrl = `https://fancy0214.github.io/sales-empowerment-v2/?share=${token}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('分享链接已创建并复制到剪贴板！\n\n链接：' + shareUrl);
            });
        } else {
            prompt('分享链接已创建！请复制以下链接：', shareUrl);
        }
        
    } catch(err) {
        console.error('创建分享链接失败:', err);
        if (err.message && err.message.includes('does not exist')) {
            alert('share_links 表不存在，请先在 Supabase Dashboard 执行 supabase_share_links.sql 建表');
        } else {
            alert('创建失败: ' + err.message);
        }
    }
}

// 启用/禁用分享链接
async function toggleShareLink(id, isActive) {
    if (!supabaseClient) return;
    
    const action = isActive ? '启用' : '禁用';
    if (!confirm(`确定要${action}该分享链接吗？`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('share_links')
            .update({ is_active: isActive })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadShareLinks();
    } catch(err) {
        alert('操作失败: ' + err.message);
    }
}

// 删除分享链接
async function deleteShareLink(id) {
    if (!supabaseClient) return;
    if (!confirm('确定要删除该分享链接吗？此操作不可撤销。')) return;
    
    try {
        const { error } = await supabaseClient
            .from('share_links')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadShareLinks();
    } catch(err) {
        alert('删除失败: ' + err.message);
    }
}

// 复制分享链接
function copyShareLink(token) {
    const isCollect = token.startsWith('cl-');
    const param = isCollect ? 'collect' : 'share';
    const shareUrl = `https://fancy0214.github.io/sales-empowerment-v2/?${param}=${token}`;
    const tip = isCollect ? '竞品信息收集链接已复制到剪贴板！\n\n他人可通过此链接提交竞品信息。\n\n链接：' : '分享链接已复制到剪贴板！\n\n链接：';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(tip + shareUrl);
        });
    } else {
        prompt('请复制以下链接：', shareUrl);
    }
}

// ==================== 工具附件功能 ====================

const TOOL_FILES_BUCKET = 'tool-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip', '.rar'];

// 初始化 Storage Bucket
async function initToolFilesBucket() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.storage.listBuckets();
        if (error) throw error;
        const exists = data && data.some(b => b.name === TOOL_FILES_BUCKET);
        if (!exists) {
            const { error: createError } = await supabaseClient.storage.createBucket(TOOL_FILES_BUCKET, {
                public: true,
                fileSizeLimit: MAX_FILE_SIZE
            });
            if (createError) {
                console.warn('创建 Storage Bucket 失败（可能已存在）:', createError.message);
            } else {
                console.log('Storage Bucket 创建成功:', TOOL_FILES_BUCKET);
            }
        }
    } catch (e) {
        console.warn('初始化 Storage Bucket 失败:', e.message);
    }
}

// 确保数据库表存在
async function ensureToolFilesTable() {
    // 表的创建需要在 Supabase Dashboard 执行 SQL，这里只做检测
    if (!supabaseClient) return false;
    try {
        const { data, error } = await supabaseClient
            .from('tool_files')
            .select('id')
            .limit(1);
        if (error) {
            console.warn('tool_files 表可能不存在，需要在 Supabase Dashboard 建表');
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// 切换附件面板展开/收起
function toggleAttachmentPanel() {
    const panel = document.getElementById('stAttachmentPanel');
    const arrow = document.getElementById('stAttachmentArrow');
    if (!panel) return;
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
        panel.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}

// 加载工具附件列表
async function loadToolFiles(toolId) {
    const listEl = document.getElementById('stAttachmentList');
    const countEl = document.getElementById('stAttachmentCount');
    if (!listEl || !supabaseClient) {
        if (listEl) listEl.innerHTML = '<div class="st-attachment-empty"><i class="fas fa-inbox"></i> 暂无附件</div>';
        if (countEl) countEl.textContent = '0';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('tool_files')
            .select('*')
            .eq('tool_id', toolId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const files = data || [];
        if (countEl) countEl.textContent = files.length;

        if (files.length === 0) {
            listEl.innerHTML = '<div class="st-attachment-empty"><i class="fas fa-inbox"></i> 暂无附件</div>';
            return;
        }

        listEl.innerHTML = files.map(file => {
            const fileIcon = getFileIcon(file.file_type || file.file_name);
            const fileSize = formatFileSize(file.file_size);
            const dateStr = file.created_at ? new Date(file.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
            const downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${TOOL_FILES_BUCKET}/${file.file_path}`;
            const isShare = isShareMode;
            // 转义特殊字符，防止 HTML/JS 注入
            const escName = (file.file_name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
            const escPath = (file.file_path || '').replace(/'/g, "\\'");
            const escDownloadUrl = downloadUrl.replace(/'/g, "\\'");
            return `
                <div class="st-attachment-item" data-file-id="${file.id}">
                    <div class="st-attachment-info">
                        <span class="st-attachment-icon"><i class="fas ${fileIcon}"></i></span>
                        <div class="st-attachment-meta">
                            <span class="st-attachment-name" title="${escName}">${escName}</span>
                            <span class="st-attachment-detail">${fileSize} · ${dateStr}</span>
                        </div>
                    </div>
                    <div class="st-attachment-actions">
                        <button class="st-attachment-btn st-btn-download" onclick="downloadToolFile('${escDownloadUrl}', '${escName}')" title="下载">
                            <i class="fas fa-download"></i>
                        </button>
                        ${!isShare ? `<button class="st-attachment-btn st-btn-delete" onclick="deleteToolFile('${file.id}', '${escPath}', '${toolId}')" title="删除">
                            <i class="fas fa-trash-alt"></i>
                        </button>` : ''}
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('加载附件列表失败:', err);
        if (err.message && err.message.includes('does not exist')) {
            listEl.innerHTML = '<div class="st-attachment-empty"><i class="fas fa-info-circle" style="color:#F59E0B"></i> 附件功能尚未初始化，请联系管理员执行建表SQL</div>';
        } else {
            listEl.innerHTML = '<div class="st-attachment-empty"><i class="fas fa-exclamation-circle" style="color:#EF4444"></i> 加载失败</div>';
        }
    }
}

// 处理文件上传
async function handleToolFileUpload(toolId, files) {
    if (!supabaseClient || !files || files.length === 0) return;

    for (const file of files) {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            alert(`文件 "${file.name}" 超过10MB限制，请压缩后重试`);
            continue;
        }

        // 检查文件格式
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            alert(`文件 "${file.name}" 格式不支持，请上传常见文档/图片格式`);
            continue;
        }

        // 显示上传中状态
        const listEl = document.getElementById('stAttachmentList');
        const emptyEl = listEl.querySelector('.st-attachment-empty');
        if (emptyEl) emptyEl.remove();

        const uploadingItem = document.createElement('div');
        uploadingItem.className = 'st-attachment-item st-uploading';
        uploadingItem.innerHTML = `
            <div class="st-attachment-info">
                <span class="st-attachment-icon"><i class="fas fa-spinner fa-spin"></i></span>
                <div class="st-attachment-meta">
                    <span class="st-attachment-name">${file.name}</span>
                    <span class="st-attachment-detail">上传中...</span>
                </div>
            </div>
            <div class="st-upload-progress"><div class="st-upload-progress-bar"></div></div>`;
        listEl.insertBefore(uploadingItem, listEl.firstChild);

        try {
            // 生成文件路径（Storage路径只允许ASCII字符，中文会被编码）
            const timestamp = Date.now();
            const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : '';
            const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
            // 用时间戳作为路径中的文件名主体，避免中文路径导致Storage报错
            const storageName = timestamp + '_' + Math.random().toString(36).substring(2, 8) + ext;
            const filePath = `${toolId}/${storageName}`;

            // 上传到 Storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from(TOOL_FILES_BUCKET)
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // 写入数据库元数据
            const { error: dbError } = await supabaseClient
                .from('tool_files')
                .insert([{
                    tool_id: toolId,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    file_type: file.type || ext
                }]);

            if (dbError) {
                // 数据库写入失败，尝试删除已上传的文件
                try { await supabaseClient.storage.from(TOOL_FILES_BUCKET).remove([filePath]); } catch(e) {}
                throw dbError;
            }

            // 上传成功，移除上传中项并刷新列表
            uploadingItem.remove();
            await loadToolFiles(toolId);
        } catch (err) {
            console.error('文件上传失败:', err);
            const errMsg = (err.message && err.message.includes('does not exist')) 
                ? '附件功能未初始化，请联系管理员' 
                : (err.message || '未知错误');
            uploadingItem.innerHTML = `
                <div class="st-attachment-info">
                    <span class="st-attachment-icon"><i class="fas fa-exclamation-circle" style="color:#EF4444"></i></span>
                    <div class="st-attachment-meta">
                        <span class="st-attachment-name">${file.name}</span>
                        <span class="st-attachment-detail" style="color:#EF4444">上传失败: ${errMsg}</span>
                    </div>
                </div>`;
            setTimeout(() => uploadingItem.remove(), 4000);
        }
    }

    // 重置 file input 以便重复选择同一文件
    const fileInput = document.getElementById('stFileInput');
    if (fileInput) fileInput.value = '';
}

// 设置拖拽上传
function setupDragUpload(toolId) {
    const uploadArea = document.getElementById('stUploadArea');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('st-drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('st-drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('st-drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleToolFileUpload(toolId, files);
        }
    });
}

// 下载文件（通过blob保持原始文件名，避免跨域导致download属性失效）
async function downloadToolFile(url, fileName) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('下载失败');
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        // fetch失败时回退到直接打开
        console.warn('Blob下载失败，回退直接打开:', e);
        window.open(url, '_blank');
    }
}

// 删除文件
async function deleteToolFile(fileId, filePath, toolId) {
    if (!confirm('确定要删除此附件吗？删除后不可恢复。')) return;
    if (!supabaseClient) return;

    try {
        // 从 Storage 删除文件
        const { error: storageError } = await supabaseClient.storage
            .from(TOOL_FILES_BUCKET)
            .remove([filePath]);

        // 即使 Storage 删除失败也继续删除数据库记录
        if (storageError) {
            console.warn('Storage 文件删除失败:', storageError.message);
        }

        // 从数据库删除元数据
        const { error: dbError } = await supabaseClient
            .from('tool_files')
            .delete()
            .eq('id', fileId);

        if (dbError) throw dbError;

        // 刷新附件列表
        await loadToolFiles(toolId);
    } catch (err) {
        console.error('删除附件失败:', err);
        alert('删除失败: ' + (err.message || '未知错误'));
    }
}

// 获取文件图标
function getFileIcon(fileNameOrType) {
    const name = (fileNameOrType || '').toLowerCase();
    if (name.includes('pdf')) return 'fa-file-pdf';
    if (name.includes('word') || name.includes('doc')) return 'fa-file-word';
    if (name.includes('excel') || name.includes('sheet') || name.includes('xls') || name.includes('csv')) return 'fa-file-excel';
    if (name.includes('powerpoint') || name.includes('presentation') || name.includes('ppt')) return 'fa-file-powerpoint';
    if (name.includes('image') || name.includes('jpg') || name.includes('jpeg') || name.includes('png') || name.includes('gif') || name.includes('bmp') || name.includes('webp')) return 'fa-file-image';
    if (name.includes('zip') || name.includes('rar') || name.includes('7z') || name.includes('compressed')) return 'fa-file-archive';
    if (name.includes('text') || name.includes('txt')) return 'fa-file-alt';
    return 'fa-file';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

// ==================== 方案生成功能 ====================

// Plan Generator System Prompt
const PLAN_SYSTEM_PROMPT = `【最高优先级指令】你现在执行的是"方案生成"任务，不是话术生成任务。你必须严格按照以下格式输出院校推荐方案，禁止输出任何话术、沟通框架、客户痛点分析、破冰共情等内容。

核心原则：
1. 按QS 2027排名从高到低优先推荐，找学生够得到的最好的院校，推荐5-10所
2. 均分是硬门槛，严格按学生院校层次匹配对应要求
3. 跨专业申请时，优先推荐接受该学生本科背景的意向专业；如果意向专业要求相关专业背景不可申，则推荐与意向专业相近的可申专业并备注"非意向专业但相近，接受XX背景申请"
4. 如果排名很好的院校学生均分符合但意向专业无合适选项，找1-2个相近可申专业并备注"非意向专业，但背景符合可考虑"
5. 务实推荐，不推荐明显达不到的院校浪费学生精力
6. 不代理G5院校（牛津、剑桥、帝国理工、UCL、LSE），不要推荐这5所
7. 意向国家仅限英国和爱尔兰

【QS 2027世界大学排名参考】（2026年6月18日发布，请使用此版本排名）：
帝国理工#2、牛津#4、剑桥#6、UCL#8、爱丁堡#35、KCL#37、曼大#40、布里斯托#57、LSE#62、华威#68、伯明翰#68、利兹#77、格拉斯哥#80、谢菲尔德#82、杜伦#85、诺丁汉#97、QMUL#103、南安普顿#111、圣安德鲁斯#115、巴斯#125、埃克塞特#136、利物浦#139、纽卡斯尔#149、约克#158、兰卡斯特#164、贝尔法斯特女王#174、卡迪夫#179

【强制输出格式】每所院校独占一行（换行分隔），按QS 2027从高到低排列，5-10所，格式如下：
QS排名 院校名称 专业 链接 均分要求+备注

示例（每所院校一行，中间用换行隔开）：
QS57 布里斯托大学 Film and Television MA https://www.bristol.ac.uk/study/postgraduate/2026/arts/ma-film-television/ 80%+，接受广泛背景，商科可申
QS68 伯明翰大学 Creative Industries and Cultural Policy MA https://www.birmingham.ac.uk/postgraduate/courses/taught/creative-industries-cultural-policy.aspx 80%+，接受商科背景，偏向文化产业方向

【专业链接要求】链接必须是该专业在大学官网的真实页面URL，不要编造链接。正确获取方式：进入大学官网→找到Postgraduate taught courses/Masters programmes板块→搜索相关专业→点进专业页面获取URL。如果不确定真实链接，链接位置写"请前往官网查询"。

【绝对禁止】：
- 禁止输出"客户痛点分析"、"匹配沟通框架"、"话术方案"、"破冰与共情"等话术内容
- 禁止输出分析过程，只要最终的推荐列表
- 禁止输出markdown标题、加粗等格式，纯文本列表即可
- 禁止使用旧版QS排名，必须使用上面提供的QS 2027排名`;

// 方案生成参考资料（从plan-reference-data.json按需加载）
let _planRefData = null;

async function loadPlanRefData() {
    if (_planRefData) return _planRefData;
    try {
        const resp = await fetch('plan-reference-data.json');
        if (!resp.ok) throw new Error('加载失败');
        _planRefData = await resp.json();
        console.log('方案参考资料已加载，共', Object.keys(_planRefData).length, '所院校');
        return _planRefData;
    } catch (e) {
        console.warn('方案参考资料加载失败:', e);
        return null;
    }
}

// 将院校子表数据转为可读文本（用于注入prompt）
function uniSheetToText(uniName, rows) {
    if (!rows || rows.length === 0) return '';
    return rows.map(row => row.filter(c => c).join(' | ')).join('\n');
}


// ===== Tab切换 =====
function showPlanTab(tab) {
    // 仅保留方案生成Tab，院校数据库已移除
    document.querySelectorAll('#page-plan-generator .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#page-plan-generator .plan-content').forEach(el => el.classList.remove('active'));
    
    document.querySelector('#page-plan-generator .tab-btn').classList.add('active');
    document.getElementById('plan-generate').classList.add('active');
}

// ===== 多选下拉 =====
function toggleMultiSelect(selectId) {
    const dropdown = document.querySelector(`#${selectId} .plan-multi-select-dropdown`);
    const isOpen = dropdown.style.display === 'block';
    // 先关闭所有
    document.querySelectorAll('.plan-multi-select-dropdown').forEach(d => d.style.display = 'none');
    if (!isOpen) dropdown.style.display = 'block';
}

function updateMultiSelectText(selectId, textId) {
    const checkboxes = document.querySelectorAll(`#${selectId} .plan-multi-option input[type="checkbox"]`);
    const selected = [];
    checkboxes.forEach(cb => { if (cb.checked) selected.push(cb.value); });
    const textEl = document.getElementById(textId);
    if (selected.length === 0) {
        textEl.textContent = '请选择国家';
        textEl.classList.remove('has-value');
    } else {
        textEl.textContent = selected.join('、');
        textEl.classList.add('has-value');
    }
}

// 点击外部关闭多选下拉
document.addEventListener('click', function(e) {
    if (!e.target.closest('.plan-multi-select')) {
        document.querySelectorAll('.plan-multi-select-dropdown').forEach(d => d.style.display = 'none');
    }
});

// ===== 本科院校搜索 =====
const UNIVERSITY_LIST = [
    // 985院校
    {name:'北京大学',level:'985'},{name:'清华大学',level:'985'},{name:'中国人民大学',level:'985'},
    {name:'北京师范大学',level:'985'},{name:'北京航空航天大学',level:'985'},{name:'北京理工大学',level:'985'},
    {name:'中国农业大学',level:'985'},{name:'中央民族大学',level:'985'},{name:'南开大学',level:'985'},
    {name:'天津大学',level:'985'},{name:'大连理工大学',level:'985'},{name:'东北大学',level:'985'},
    {name:'吉林大学',level:'985'},{name:'哈尔滨工业大学',level:'985'},{name:'复旦大学',level:'985'},
    {name:'上海交通大学',level:'985'},{name:'同济大学',level:'985'},{name:'华东师范大学',level:'985'},
    {name:'南京大学',level:'985'},{name:'东南大学',level:'985'},{name:'浙江大学',level:'985'},
    {name:'中国科学技术大学',level:'985'},{name:'厦门大学',level:'985'},{name:'山东大学',level:'985'},
    {name:'武汉大学',level:'985'},{name:'华中科技大学',level:'985'},{name:'湖南大学',level:'985'},
    {name:'中南大学',level:'985'},{name:'中山大学',level:'985'},{name:'华南理工大学',level:'985'},
    {name:'四川大学',level:'985'},{name:'重庆大学',level:'985'},{name:'电子科技大学',level:'985'},
    {name:'西安交通大学',level:'985'},{name:'西北工业大学',level:'985'},{name:'西北农林科技大学',level:'985'},
    {name:'兰州大学',level:'985'},{name:'国防科技大学',level:'985'},{name:'中国海洋大学',level:'985'},
    // 211（非985）
    {name:'北京交通大学',level:'211'},{name:'北京工业大学',level:'211'},{name:'北京科技大学',level:'211'},
    {name:'北京化工大学',level:'211'},{name:'北京邮电大学',level:'211'},{name:'北京林业大学',level:'211'},
    {name:'北京中医药大学',level:'211'},{name:'北京外国语大学',level:'211'},{name:'中国传媒大学',level:'211'},
    {name:'中央财经大学',level:'211'},{name:'对外经济贸易大学',level:'211'},{name:'北京体育大学',level:'211'},
    {name:'中央音乐学院',level:'211'},{name:'中国政法大学',level:'211'},{name:'华北电力大学',level:'211'},
    {name:'天津医科大学',level:'211'},{name:'河北工业大学',level:'211'},{name:'太原理工大学',level:'211'},
    {name:'内蒙古大学',level:'211'},{name:'辽宁大学',level:'211'},{name:'大连海事大学',level:'211'},
    {name:'延边大学',level:'211'},{name:'东北师范大学',level:'211'},{name:'东北农业大学',level:'211'},
    {name:'东北林业大学',level:'211'},{name:'哈尔滨工程大学',level:'211'},{name:'上海大学',level:'211'},
    {name:'苏州大学',level:'211'},{name:'南京航空航天大学',level:'211'},{name:'南京理工大学',level:'211'},
    {name:'中国矿业大学',level:'211'},{name:'南京邮电大学',level:'211'},{name:'河海大学',level:'211'},
    {name:'江南大学',level:'211'},{name:'南京农业大学',level:'211'},{name:'中国药科大学',level:'211'},
    {name:'南京师范大学',level:'211'},{name:'安徽大学',level:'211'},{name:'合肥工业大学',level:'211'},
    {name:'福州大学',level:'211'},{name:'南昌大学',level:'211'},{name:'中国石油大学',level:'211'},
    {name:'郑州大学',level:'211'},{name:'中国地质大学',level:'211'},{name:'武汉理工大学',level:'211'},
    {name:'华中农业大学',level:'211'},{name:'华中师范大学',level:'211'},{name:'中南财经政法大学',level:'211'},
    {name:'湖南师范大学',level:'211'},{name:'暨南大学',level:'211'},{name:'华南师范大学',level:'211'},
    {name:'海南大学',level:'211'},{name:'广西大学',level:'211'},{name:'西南交通大学',level:'211'},
    {name:'西南大学',level:'211'},{name:'西南财经大学',level:'211'},{name:'贵州大学',level:'211'},
    {name:'云南大学',level:'211'},{name:'西藏大学',level:'211'},{name:'西北大学',level:'211'},
    {name:'西安电子科技大学',level:'211'},{name:'长安大学',level:'211'},{name:'陕西师范大学',level:'211'},
    {name:'青海大学',level:'211'},{name:'宁夏大学',level:'211'},{name:'新疆大学',level:'211'},{name:'石河子大学',level:'211'},
    {name:'第二军医大学',level:'211'},{name:'第四军医大学',level:'211'},
    // 双一流（非985/211）
    {name:'中国科学院大学',level:'双一流'},{name:'上海科技大学',level:'双一流'},{name:'南方科技大学',level:'双一流'},
    {name:'首都师范大学',level:'双一流'},{name:'外交学院',level:'双一流'},{name:'中国人民公安大学',level:'双一流'},
    {name:'中央美术学院',level:'双一流'},{name:'中央戏剧学院',level:'双一流'},{name:'中国音乐学院',level:'双一流'},
    {name:'天津工业大学',level:'双一流'},{name:'天津中医药大学',level:'双一流'},{name:'上海海洋大学',level:'双一流'},
    {name:'上海中医药大学',level:'双一流'},{name:'上海体育大学',level:'双一流'},{name:'上海音乐学院',level:'双一流'},
    {name:'南京医科大学',level:'双一流'},{name:'南京林业大学',level:'双一流'},{name:'南京信息工程大学',level:'双一流'},
    {name:'南京中医药大学',level:'双一流'},{name:'中国美术学院',level:'双一流'},{name:'河南大学',level:'双一流'},
    {name:'广州医科大学',level:'双一流'},{name:'广州中医药大学',level:'双一流'},{name:'华南农业大学',level:'双一流'},
    {name:'湘潭大学',level:'双一流'},{name:'山西大学',level:'双一流'},
    // 常见普通本科
    {name:'深圳大学',level:'普通本科'},{name:'浙江工业大学',level:'普通本科'},{name:'杭州电子科技大学',level:'普通本科'},
    {name:'广东工业大学',level:'普通本科'},{name:'广东外语外贸大学',level:'普通本科'},{name:'广州大学',level:'普通本科'},
    {name:'南方医科大学',level:'普通本科'},{name:'汕头大学',level:'普通本科'},{name:'深圳技术大学',level:'普通本科'},
    {name:'浙江工商大学',level:'普通本科'},{name:'浙江理工大学',level:'普通本科'},{name:'宁波大学',level:'普通本科'},
    {name:'温州大学',level:'普通本科'},{name:'温州医科大学',level:'普通本科'},{name:'杭州师范大学',level:'普通本科'},
    {name:'浙江师范大学',level:'普通本科'},{name:'中国计量大学',level:'普通本科'},{name:'浙江财经大学',level:'普通本科'},
    {name:'北京工商大学',level:'普通本科'},{name:'首都经济贸易大学',level:'普通本科'},{name:'北京语言大学',level:'普通本科'},
    {name:'北京建筑大学',level:'普通本科'},{name:'北京信息科技大学',level:'普通本科'},{name:'北京第二外国语学院',level:'普通本科'},
    {name:'天津师范大学',level:'普通本科'},{name:'天津财经大学',level:'普通本科'},{name:'天津外国语大学',level:'普通本科'},
    {name:'天津理工大学',level:'普通本科'},{name:'河北大学',level:'普通本科'},{name:'山东师范大学',level:'普通本科'},
    {name:'青岛大学',level:'普通本科'},{name:'济南大学',level:'普通本科'},{name:'山东科技大学',level:'普通本科'},
    {name:'山东财经大学',level:'普通本科'},{name:'烟台大学',level:'普通本科'},{name:'河南财经政法大学',level:'普通本科'},
    {name:'郑州轻工业大学',level:'普通本科'},{name:'湖北大学',level:'普通本科'},{name:'武汉科技大学',level:'普通本科'},
    {name:'湖北工业大学',level:'普通本科'},{name:'武汉工程大学',level:'普通本科'},{name:'中南民族大学',level:'普通本科'},
    {name:'长沙理工大学',level:'普通本科'},{name:'湖南科技大学',level:'普通本科'},{name:'福建师范大学',level:'普通本科'},
    {name:'福州大学至诚学院',level:'独立学院'},{name:'厦门大学嘉庚学院',level:'独立学院'},
    {name:'四川师范大学',level:'普通本科'},{name:'成都理工大学',level:'普通本科'},{name:'西南石油大学',level:'普通本科'},
    {name:'成都信息工程大学',level:'普通本科'},{name:'西华大学',level:'普通本科'},{name:'重庆邮电大学',level:'普通本科'},
    {name:'重庆师范大学',level:'普通本科'},{name:'重庆交通大学',level:'普通本科'},{name:'西安建筑科技大学',level:'普通本科'},
    {name:'西安理工大学',level:'普通本科'},{name:'西安科技大学',level:'普通本科'},{name:'西安外国语大学',level:'普通本科'},
    {name:'陕西科技大学',level:'普通本科'},{name:'兰州理工大学',level:'普通本科'},{name:'兰州交通大学',level:'普通本科'},
    {name:'东北财经大学',level:'普通本科'},{name:'辽宁师范大学',level:'普通本科'},{name:'沈阳工业大学',level:'普通本科'},
    {name:'沈阳建筑大学',level:'普通本科'},{name:'大连大学',level:'普通本科'},{name:'大连交通大学',level:'普通本科'},
    {name:'长春理工大学',level:'普通本科'},{name:'吉林农业大学',level:'普通本科'},{name:'哈尔滨理工大学',level:'普通本科'},
    {name:'黑龙江大学',level:'普通本科'},{name:'哈尔滨商业大学',level:'普通本科'},{name:'南昌航空大学',level:'普通本科'},
    {name:'江西财经大学',level:'普通本科'},{name:'江西师范大学',level:'普通本科'},{name:'华东交通大学',level:'普通本科'},
    {name:'广西师范大学',level:'普通本科'},{name:'桂林电子科技大学',level:'普通本科'},{name:'昆明理工大学',level:'普通本科'},
    {name:'云南师范大学',level:'普通本科'},{name:'贵州师范大学',level:'普通本科'},{name:'贵州财经大学',level:'普通本科'},
    {name:'新疆师范大学',level:'普通本科'},{name:'新疆农业大学',level:'普通本科'},{name:'内蒙古师范大学',level:'普通本科'},
    {name:'内蒙古工业大学',level:'普通本科'},{name:'宁夏医科大学',level:'普通本科'},{name:'青海师范大学',level:'普通本科'},
    // 独立学院（常见）
    {name:'浙江大学城市学院',level:'独立学院'},{name:'浙江大学宁波理工学院',level:'独立学院'},
    {name:'中山大学南方学院',level:'独立学院'},{name:'广东外语外贸大学南国商学院',level:'独立学院'},
    {name:'四川大学锦城学院',level:'独立学院'},{name:'四川大学锦江学院',level:'独立学院'},
    {name:'电子科技大学中山学院',level:'独立学院'},{name:'重庆大学城市科技学院',level:'独立学院'},
    {name:'西南财经大学天府学院',level:'独立学院'},{name:'成都理工大学工程技术学院',level:'独立学院'},
    {name:'武汉科技大学城市学院',level:'独立学院'},{name:'湖北大学知行学院',level:'独立学院'},
    {name:'南京大学金陵学院',level:'独立学院'},{name:'东南大学成贤学院',level:'独立学院'},
    {name:'中国传媒大学南广学院',level:'独立学院'},{name:'北京理工大学珠海学院',level:'独立学院'},
    {name:'吉林大学珠海学院',level:'独立学院'},{name:'北京师范大学珠海分校',level:'独立学院'},
    {name:'北京师范大学-香港浸会大学联合国际学院',level:'独立学院'},
    // 海外本科
    {name:'海外本科',level:'海外本科'},
];

function searchUniversity(keyword) {
    const dropdown = document.getElementById('planUniDropdown');
    const levelTag = document.getElementById('planUniLevelTag');
    const levelInput = document.getElementById('planUniLevel');
    
    // 清空之前的选中状态
    levelInput.value = '';
    levelTag.style.display = 'none';
    
    if (!keyword || keyword.trim().length < 1) {
        dropdown.style.display = 'none';
        return;
    }
    
    const kw = keyword.trim().toLowerCase();
    const matches = UNIVERSITY_LIST.filter(u => 
        u.name.toLowerCase().includes(kw) || u.level.includes(kw)
    ).slice(0, 20);
    
    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="plan-uni-no-result">未找到该院校，可手动选择层次</div>';
        dropdown.style.display = 'block';
        // 显示手动选择
        dropdown.innerHTML += '<div class="plan-uni-manual">' +
            '<label><input type="radio" name="manualLevel" value="985" onchange="setManualLevel(\'985\')"> 985</label>' +
            '<label><input type="radio" name="manualLevel" value="211" onchange="setManualLevel(\'211\')"> 211</label>' +
            '<label><input type="radio" name="manualLevel" value="双一流" onchange="setManualLevel(\'双一流\')"> 双一流</label>' +
            '<label><input type="radio" name="manualLevel" value="普通本科" onchange="setManualLevel(\'普通本科\')"> 普通本科</label>' +
            '<label><input type="radio" name="manualLevel" value="独立学院" onchange="setManualLevel(\'独立学院\')"> 独立学院</label>' +
            '<label><input type="radio" name="manualLevel" value="海外本科" onchange="setManualLevel(\'海外本科\')"> 海外本科</label>' +
            '</div>';
    } else {
        dropdown.innerHTML = matches.map(u => 
            `<div class="plan-uni-item" onclick="selectUniversity('${u.name}','${u.level}')">
                <span class="plan-uni-name">${u.name}</span>
                <span class="plan-uni-badge plan-uni-badge-${u.level === '985' ? '985' : u.level === '211' ? '211' : u.level === '双一流' ? 'syl' : u.level === '海外本科' ? 'overseas' : 'normal'}">${u.level}</span>
            </div>`
        ).join('');
        dropdown.style.display = 'block';
    }
}

function selectUniversity(name, level) {
    document.getElementById('planUniInput').value = name;
    document.getElementById('planUniLevel').value = level;
    document.getElementById('planUniDropdown').style.display = 'none';
    
    const tag = document.getElementById('planUniLevelTag');
    document.getElementById('planUniLevelText').textContent = level;
    tag.style.display = 'inline-flex';
}

function setManualLevel(level) {
    document.getElementById('planUniLevel').value = level;
    const tag = document.getElementById('planUniLevelTag');
    document.getElementById('planUniLevelText').textContent = level;
    tag.style.display = 'inline-flex';
}

// 点击外部关闭院校搜索下拉
document.addEventListener('click', function(e) {
    if (!e.target.closest('#planUniSearchWrap')) {
        const dropdown = document.getElementById('planUniDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// ===== 方案生成 =====
async function generatePlan() {
    // 收集表单数据
    const countryCheckboxes = document.querySelectorAll('#planCountrySelect .plan-multi-option input:checked');
    const countries = Array.from(countryCheckboxes).map(cb => cb.value);
    const degree = document.getElementById('planDegree').value;
    const major = document.getElementById('planMajor').value;
    const targetMajor = document.getElementById('planTargetMajor').value;
    const uniName = document.getElementById('planUniInput').value.trim();
    const uniLevel = document.getElementById('planUniLevel').value;
    const gpa = document.getElementById('planGPA').value;
    
    // 验证必填
    if (countries.length === 0) { alert('请选择意向国家'); return; }
    if (!degree) { alert('请选择学历层次'); return; }
    if (!major) { alert('请选择本科专业'); return; }
    if (!targetMajor) { alert('请选择意向专业'); return; }
    if (!uniName) { alert('请输入本科院校'); return; }
    if (!uniLevel) { alert('请选择或确认本科院校层次'); return; }
    
    // 检查Coze配置（方案专用Bot优先，无则回退话术Bot）
    const config = getStudioConfig();
    const planBotId = config.planBotId || config.botId;
    if (!config.cozeToken || !planBotId) {
        document.getElementById('planResultArea').innerHTML = `
            <div class="plan-error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>未配置AI接口</h3>
                <p>请先在「AI话术工坊」中配置Coze Bot API，或联系管理员获取配置。</p>
            </div>`;
        return;
    }
    
    // 显示Loading
    const resultArea = document.getElementById('planResultArea');
    const btn = document.getElementById('planGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    
    resultArea.innerHTML = '<div class="studio-loading"><div class="studio-dots"><span></span><span></span><span></span></div><p>AI正在加载院校资料并生成方案，通常需要10-20秒...</p></div><div class="studio-stream-output" id="planStreamOutput" style="display:none"></div>';
    
    try {
        // 构建用户消息
        const isCrossMajor = major !== targetMajor;
        let userMsg = `学生背景信息：
- 意向国家：${countries.join('、')}
- 学历层次：${degree}
- 本科专业：${major}
- 意向专业：${targetMajor}${isCrossMajor ? '（跨专业申请）' : '（本专业申请）'}
- 本科院校：${uniName}（${uniLevel}）
- 均分/GPA：${gpa || '未提供'}`;

        if (isCrossMajor) {
            userMsg += `\n\n重要：该学生为跨专业申请，本科是${major}，想申${targetMajor}方向。请只推荐接受${major}背景学生申请的${targetMajor}相关专业，不要推荐要求${targetMajor}本科背景的专业。`;
        }

        // 注入参考资料：从JSON按条件筛选相关院校
        const refData = await loadPlanRefData();
        if (refData) {
            let refText = '';
            const uniNames = Object.keys(refData);
            for (const uni of uniNames) {
                const sheetText = uniSheetToText(uni, refData[uni]);
                if (sheetText) {
                    refText += `\n【${uni}】\n${sheetText}\n`;
                }
            }
            if (refText.length > 80000) {
                refText = refText.substring(0, 80000) + '\n...(更多院校数据已省略)';
            }
            userMsg += '\n\n以下是英国/爱尔兰院校录取要求参考资料，请结合这些数据和学生背景进行推荐：\n' + refText;
        } else {
            userMsg += '\n\n注意：院校参考资料加载失败，请根据你的专业知识推荐。';
        }

        // 调用Coze API（使用方案专用Bot ID）
        await streamPlanCozeResponse(config, planBotId, PLAN_SYSTEM_PROMPT, userMsg, resultArea);

    } catch (err) {
        console.error('方案生成失败:', err);
        resultArea.innerHTML = `<div class="studio-error"><i class="fas fa-exclamation-triangle"></i> 方案生成失败：${err.message || '未知错误'}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> 生成方案';
    }
}

// 方案生成专用流式响应（指令嵌入用户消息，因Coze API不支持system角色）
async function streamPlanCozeResponse(config, botId, systemPrompt, userMessage, outputArea) {
    // Coze API additional_messages不支持role=system，将指令嵌入用户消息
    const combinedMessage = systemPrompt + '\n\n---\n\n' + userMessage;
    
    const response = await fetch('https://api.coze.cn/v3/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.cozeToken
        },
        body: JSON.stringify({
            bot_id: botId,
            user_id: 'plan_user_' + Math.random().toString(36).substring(2, 8),
            stream: true,
            auto_save_history: false,
            additional_messages: [
                {
                    role: 'user',
                    content: combinedMessage,
                    content_type: 'text'
                }
            ]
        })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error('Coze API返回错误 (' + response.status + '): ' + errText.substring(0, 300));
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let firstChunk = true;
    
    outputArea.innerHTML = '<div class="studio-loading" id="planLoadingIndicator"><div class="studio-dots"><span></span><span></span><span></span></div><p>AI正在生成院校推荐方案...</p></div><div class="studio-stream-output" id="planStreamOutput" style="display:none"></div>';
    const streamEl = document.getElementById('planStreamOutput');
    const loadingEl = document.getElementById('planLoadingIndicator');
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('event:')) {
                currentEvent = trimmed.slice(6).trim();
                continue;
            }
            
            if (trimmed.startsWith('data:') && currentEvent === 'conversation.message.delta') {
                const data = trimmed.slice(5).trim();
                try {
                    const json = JSON.parse(data);
                    if (json.type === 'answer' && json.content) {
                        fullText += json.content;
                        if (firstChunk) {
                            if (loadingEl) loadingEl.style.display = 'none';
                            streamEl.style.display = '';
                            firstChunk = false;
                        }
                        // 实时渲染
                        const html = fullText
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n/g, '<br>')
                            .replace(/📊/g, '<span class="sc-emoji">📊</span>')
                            .replace(/💡/g, '<span class="sc-emoji">💡</span>')
                            .replace(/⚠️/g, '<span class="sc-emoji">⚠️</span>');
                        streamEl.innerHTML = html + '<span class="studio-stream-cursor">▊</span>';
                    }
                } catch(e) {}
            }
        }
    }
    
    // 最终渲染
    renderPlanFinal(fullText, outputArea);
}

// 方案最终渲染（带复制按钮）
function renderPlanFinal(text, outputArea) {
    // 将markdown表格转换为HTML
    let html = text;
    
    // 处理表格
    const tableRegex = /\|(.+)\|\n\|[\s\-:|]+\|\n((?:\|.+\|\n?)*)/g;
    html = html.replace(tableRegex, function(match, headerRow, bodyRows) {
        const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
        let tableHtml = '<table class="plan-result-table"><thead><tr>';
        headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
        tableHtml += '</tr></thead><tbody>';
        
        const rows = bodyRows.trim().split('\n');
        rows.forEach(row => {
            const cells = row.split('|').map(c => c.trim()).filter(c => c);
            if (cells.length > 0) {
                tableHtml += '<tr>';
                cells.forEach(c => {
                    // 将链接转为可点击
                    const linkMatch = c.match(/https?:\/\/[^\s)]+/);
                    if (linkMatch) {
                        c = c.replace(linkMatch[0], `<a href="${linkMatch[0]}" target="_blank" rel="noopener">查看</a>`);
                    }
                    tableHtml += `<td>${c}</td>`;
                });
                tableHtml += '</tr>';
            }
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
    });
    
    // 处理非表格文本
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/📊/g, '<span class="sc-emoji">📊</span>')
        .replace(/💡/g, '<span class="sc-emoji">💡</span>')
        .replace(/⚠️/g, '<span class="sc-emoji">⚠️</span>');
    
    // 修复表格HTML中的转义（表格已单独处理）
    // 重新解析：先提取表格，再处理其他文本
    
    // 简化方案：整体渲染后再添加复制按钮
    outputArea.innerHTML = `
        <div class="plan-result-content">
            <div class="plan-result-header">
                <h3><i class="fas fa-chart-line"></i> 推荐方案</h3>
                <button class="btn btn-outline btn-sm" onclick="copyPlanResult()"><i class="fas fa-copy"></i> 复制方案</button>
            </div>
            <div class="plan-result-body" id="planResultBody"></div>
        </div>`;
    
    // 重新处理完整文本渲染
    renderPlanContent(text, document.getElementById('planResultBody'));
}

function renderPlanContent(text, container) {
    // 分段处理：表格部分和非表格部分
    const parts = [];
    const lines = text.split('\n');
    let inTable = false;
    let tableLines = [];
    let textLines = [];
    
    for (const line of lines) {
        const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
        const isSeparator = /^\|[\s\-:|]+\|$/.test(line.trim());
        
        if (isTableLine) {
            if (!inTable) {
                // 保存之前的文本
                if (textLines.length > 0) {
                    parts.push({ type: 'text', content: textLines.join('\n') });
                    textLines = [];
                }
                inTable = true;
            }
            if (!isSeparator) {
                tableLines.push(line);
            }
        } else {
            if (inTable) {
                // 保存表格
                parts.push({ type: 'table', content: tableLines.join('\n') });
                tableLines = [];
                inTable = false;
            }
            textLines.push(line);
        }
    }
    
    // 处理剩余
    if (inTable && tableLines.length > 0) {
        parts.push({ type: 'table', content: tableLines.join('\n') });
    }
    if (textLines.length > 0) {
        parts.push({ type: 'text', content: textLines.join('\n') });
    }
    
    // 渲染
    let html = '';
    for (const part of parts) {
        if (part.type === 'table') {
            html += renderPlanTable(part.content);
        } else {
            html += renderPlanText(part.content);
        }
    }
    container.innerHTML = html;
}

function renderPlanTable(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return '';
    
    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
    let html = '<div class="plan-table-wrap"><table class="plan-result-table"><thead><tr>';
    headers.forEach(h => { html += `<th>${escapeHtml(h)}</th>`; });
    html += '</tr></thead><tbody>';
    
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
        if (cells.length === 0) continue;
        html += '<tr>';
        cells.forEach(c => {
            const linkMatch = c.match(/https?:\/\/[^\s)]+/);
            if (linkMatch) {
                c = c.replace(linkMatch[0], `<a href="${escapeHtml(linkMatch[0])}" target="_blank" rel="noopener">🔗查看</a>`);
            }
            html += `<td>${c}</td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
}

function renderPlanText(text) {
    let html = escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/📊/g, '📊')
        .replace(/💡/g, '💡')
        .replace(/⚠️/g, '⚠️');
    return `<div class="plan-text-block">${html}</div>`;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 复制方案为纯文本
function copyPlanResult() {
    const resultBody = document.getElementById('planResultBody');
    if (!resultBody) return;
    
    // 从结果区域提取纯文本
    let text = resultBody.innerText || resultBody.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#page-plan-generator .plan-result-header .btn');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('方案已复制到剪贴板');
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// 读取文件为base64 Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

