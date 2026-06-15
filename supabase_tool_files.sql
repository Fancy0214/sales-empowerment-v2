-- ==================== 工具附件功能 - Supabase 数据库建表 SQL ====================
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. 创建 tool_files 表
CREATE TABLE IF NOT EXISTS tool_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建索引，加速按 tool_id 查询
CREATE INDEX IF NOT EXISTS idx_tool_files_tool_id ON tool_files(tool_id);

-- 3. 设置 RLS 策略
ALTER TABLE tool_files ENABLE ROW LEVEL SECURITY;

-- 允许所有人查询（公开读取）
CREATE POLICY "tool_files_select_all" ON tool_files
    FOR SELECT
    USING (true);

-- 允许前端通过 publishable key 插入
CREATE POLICY "tool_files_insert_all" ON tool_files
    FOR INSERT
    WITH CHECK (true);

-- 允许前端通过 publishable key 删除
CREATE POLICY "tool_files_delete_all" ON tool_files
    FOR DELETE
    USING (true);

-- 4. 创建 Storage Bucket（如果代码自动创建失败，可在此手动执行）
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('tool-files', 'tool-files', true, 10485760)
-- ON CONFLICT (id) DO NOTHING;

-- 5. Storage 策略（允许上传和删除）
CREATE POLICY "tool_files_storage_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'tool-files');

CREATE POLICY "tool_files_storage_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tool-files');

CREATE POLICY "tool_files_storage_delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'tool-files');
