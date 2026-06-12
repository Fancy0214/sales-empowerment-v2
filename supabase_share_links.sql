-- =====================================================
-- 分享链接表 - 在 Supabase Dashboard SQL Editor 中执行
-- =====================================================

CREATE TABLE IF NOT EXISTS share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    title TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 允许匿名通过 token 查询（分享页面需要）
CREATE POLICY "Allow anonymous select by token" ON share_links
    FOR SELECT USING (true);

-- 允许所有操作（使用 publishable key 场景）
CREATE POLICY "Allow all operations" ON share_links
    FOR ALL USING (true) WITH CHECK (true);
