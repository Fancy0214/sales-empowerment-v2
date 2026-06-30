-- ==================== 分享链接功能 - Supabase 建表 SQL ====================
-- 请在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. 创建 share_links 表
CREATE TABLE IF NOT EXISTS share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    title TEXT DEFAULT '未命名分享',
    sections TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    studio_bot_id TEXT,
    studio_coze_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建索引，加速按 token 查询
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);

-- 3. 启用 RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
-- 允许所有人查询（分享链接验证需要）
CREATE POLICY "share_links_select_all" ON share_links
    FOR SELECT USING (true);

-- 允许插入（创建分享链接）
CREATE POLICY "share_links_insert_all" ON share_links
    FOR INSERT WITH CHECK (true);

-- 允许更新（编辑分享链接）
CREATE POLICY "share_links_update_all" ON share_links
    FOR UPDATE USING (true) WITH CHECK (true);

-- 允许删除（删除分享链接）
CREATE POLICY "share_links_delete_all" ON share_links
    FOR DELETE USING (true);

-- 5. 更新时间触发器
CREATE OR REPLACE FUNCTION update_share_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_share_links_updated_at ON share_links;
CREATE TRIGGER trigger_update_share_links_updated_at
    BEFORE UPDATE ON share_links
    FOR EACH ROW EXECUTE FUNCTION update_share_links_updated_at();
