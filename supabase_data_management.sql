-- ================================================
-- 数据管理专区 - Supabase 表结构
-- 销售赋能平台
-- ================================================

-- 团队成员表
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'sales',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 合作机构表
CREATE TABLE IF NOT EXISTS partner_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name TEXT NOT NULL,
    level TEXT CHECK (level IN ('A','B','C','D','E','F')),
    city TEXT,
    source_type TEXT DEFAULT 'direct' CHECK (source_type IN ('referral', 'direct')),
    referral_from TEXT,
    assigned_sales_id UUID REFERENCES team_members(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'lost')),
    signed_date DATE,
    contact_person TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月度业绩表
CREATE TABLE IF NOT EXISTS monthly_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES partner_agencies(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    output_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, year, month)
);

-- 锚点参数表
CREATE TABLE IF NOT EXISTS anchor_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('A','B','C','D','E','F')),
    avg_output DECIMAL(10,2),
    avg_application DECIMAL(10,2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(level)
);

-- ================================================
-- RLS 策略（内部管理工具，允许公开读写）
-- ================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_parameters ENABLE ROW LEVEL SECURITY;

-- team_members 策略
DROP POLICY IF EXISTS "Allow all access to team_members" ON team_members;
CREATE POLICY "Allow all access to team_members" ON team_members
    FOR ALL USING (true) WITH CHECK (true);

-- partner_agencies 策略
DROP POLICY IF EXISTS "Allow all access to partner_agencies" ON partner_agencies;
CREATE POLICY "Allow all access to partner_agencies" ON partner_agencies
    FOR ALL USING (true) WITH CHECK (true);

-- monthly_performance 策略
DROP POLICY IF EXISTS "Allow all access to monthly_performance" ON monthly_performance;
CREATE POLICY "Allow all access to monthly_performance" ON monthly_performance
    FOR ALL USING (true) WITH CHECK (true);

-- anchor_parameters 策略
DROP POLICY IF EXISTS "Allow all access to anchor_parameters" ON anchor_parameters;
CREATE POLICY "Allow all access to anchor_parameters" ON anchor_parameters
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- 初始化默认锚点参数（可根据实际业务调整）
-- ================================================
INSERT INTO anchor_parameters (level, avg_output, avg_application) VALUES
    ('A', 5.00, 3.00),
    ('B', 4.00, 2.50),
    ('C', 3.00, 2.00),
    ('D', 2.00, 1.50),
    ('E', 1.50, 1.00),
    ('F', 1.00, 0.50)
ON CONFLICT (level) DO NOTHING;
