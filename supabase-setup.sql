-- ============================================================
-- 销售赋能平台 - Supabase 建表 + RLS + 种子数据
-- 请在 Supabase Dashboard → SQL Editor 中执行此脚本
-- ============================================================

-- 1. 创建竞品提交表
CREATE TABLE IF NOT EXISTS competitor_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT,
    country TEXT DEFAULT '多国',
    coverage TEXT,
    product TEXT DEFAULT '多国',
    is_b2b BOOLEAN DEFAULT FALSE,
    strong_region TEXT,
    advantage TEXT,
    disadvantage TEXT,
    commission TEXT,
    service TEXT,
    score NUMERIC(3,1) DEFAULT 7.0,
    radar JSONB DEFAULT '{"brand":7,"price":7,"service":7,"channel":7,"product":7,"tech":7}',
    source TEXT,
    submitter TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE competitor_submissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS 策略
-- 任何人可插入（分享链接提交）
CREATE POLICY "Allow insert for all" ON competitor_submissions
    FOR INSERT WITH CHECK (true);

-- 任何人可读取已审核通过的记录（主页面展示）
CREATE POLICY "Allow read approved" ON competitor_submissions
    FOR SELECT USING (status = 'approved');

-- 允许更新（管理员审核/编辑操作）
CREATE POLICY "Allow update for all" ON competitor_submissions
    FOR UPDATE USING (true) WITH CHECK (true);

-- 允许删除（管理员删除操作）
CREATE POLICY "Allow delete for all" ON competitor_submissions
    FOR DELETE USING (true);

-- 4. 种子数据：4 家原始竞品（状态为 approved）
INSERT INTO competitor_submissions (name, full_name, country, coverage, product, is_b2b, strong_region, advantage, disadvantage, commission, service, score, radar, status) VALUES
('HTI', 'HTI 留学', '多国', '英国、美国、澳洲、加拿大、新西兰、欧洲、亚洲', '多国', false, '江浙沪', '前端BD满意度高，强建联型（每周/月当面拜访）；系统强大，offer接受、押金支付DDL有系统提醒可推送邮件至客户；市场活动7-8场/年，5-8个申请可换1个Trip名额', '后期服务一般，放假期间找不到人；价格竞争力偏弱', '每2个月打款一次；有强大系统支持，佣金展示、结算均可通过系统操作', '前端BD专业，日常维护到位；后期服务响应慢，假期无人值守', 7.0, '{"brand":7,"price":6,"service":8,"channel":7,"product":8,"tech":7}', 'approved'),
('加诚', '加诚博教 CACH', '北美', '美国、加拿大', '北美', false, '北京及华北地区', '实时返佣，有系统支持；客户反馈对接老师很负责、配合度好；Trip奖励丰富，15个申请兑1个Trip名额，学生付押金额外获200元出游基金，KPI院校押金500元/人', '国别覆盖有限，仅北美方向；市场活动支持相对一般', '实时返佣，有系统支持', '流程相对制式化，但配合度高、对接负责', 7.3, '{"brand":7,"price":8,"service":7,"channel":7,"product":7,"tech":7}', 'approved'),
('启德', '启德教育 EIC', '多国', '英国、美国、加拿大等多国', '多国', true, '华南、华中、西南', '英国院校代理资源全网最全，能代的都有代理；英国常申院校佣金按最高档90%起步；月度结算；除澳洲外其他国别服务都不错', '澳洲方向服务口碑一般；B2B模式可能影响合作方利益分配', '佣金高，英国常申院校佣金按最高档90%起步；资源全，英国代理院校大陆市场最全；每月月度结算一次', '除澳洲外其他国别服务口碑较好', 8.3, '{"brand":8,"price":8,"service":8,"channel":8,"product":9,"tech":8}', 'approved'),
('SIUK', 'SI-UK 留学', '英国', '英国、澳洲', '英国', false, '全国覆盖', '英国重点院校佣金有竞争力（伯明翰11%起、格拉11.5%、QMUL 12%起）；整体服务与行业水平持平', '华威、谢菲、GSA没有直代；国别覆盖有限，仅英澳方向', '英国重点院校：伯明翰11%起步，格拉11.5%，QMUL 12%起步；华威、谢菲、GSA没有直代', '整体服务与行业平均水平差不多', 7.5, '{"brand":7,"price":8,"service":7,"channel":7,"product":8,"tech":7}', 'approved');

-- 5. 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at ON competitor_submissions;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON competitor_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
