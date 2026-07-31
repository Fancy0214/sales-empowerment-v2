-- ================================================
-- 业务数据管理中心 - Supabase 表结构
-- 销售赋能平台 V2
-- ================================================

-- 业务数据表（机构数据管理）
CREATE TABLE IF NOT EXISTS institution_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT,           -- 机构名称
  grade_level TEXT,                -- 级别: A+/B/C/D/E/F
  sales_person TEXT,               -- 销售负责人(脱敏代号)
  sales_person_real TEXT,          -- 销售真实姓名(仅管理员可见)
  market_source_primary TEXT,      -- 市场来源一级
  contract_status TEXT,            -- 合作状态: 合作中/尚未合作/已作废
  contract_date DATE,              -- 签约日期
  production_status TEXT,          -- 出产状态: 已出产/未出产
  production_date DATE,            -- 出产日期
  data_category TEXT,              -- 数据分类: 存量/增量
  data_year TEXT,                  -- 数据年度: 8.31前存量/当年度
  city TEXT,                       -- 城市
  province TEXT,                   -- 省份
  channel_provider TEXT,           -- 渠道供给人(脱敏代号)
  channel_provider_real TEXT,      -- 渠道供给人真实姓名(仅管理员可见)
  notes TEXT,                      -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE institution_data ENABLE ROW LEVEL SECURITY;

-- 允许公开读写（内部管理工具，无敏感外部暴露）
DROP POLICY IF EXISTS "Allow all access to institution_data" ON institution_data;
CREATE POLICY "Allow all access to institution_data" ON institution_data
    FOR ALL USING (true) WITH CHECK (true);

-- 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_institution_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_data_updated_at ON institution_data;
CREATE TRIGGER trigger_institution_data_updated_at
    BEFORE UPDATE ON institution_data
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_data_updated_at();

-- ================================================
-- 月度快照表 - 月度扎帐机制
-- ================================================
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_month TEXT NOT NULL,
  dimension_type TEXT NOT NULL,
  dimension_value TEXT NOT NULL,
  cumulative_data INT DEFAULT 0,
  cumulative_signed INT DEFAULT 0,
  cumulative_produced INT DEFAULT 0,
  month_new_data INT DEFAULT 0,
  month_new_signed INT DEFAULT 0,
  month_new_produced INT DEFAULT 0,
  sign_rate DECIMAL(5,2),
  production_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_month, dimension_type, dimension_value)
);

-- 启用 RLS
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to monthly_snapshots" ON monthly_snapshots;
CREATE POLICY "Allow all access to monthly_snapshots" ON monthly_snapshots
    FOR ALL USING (true) WITH CHECK (true);
