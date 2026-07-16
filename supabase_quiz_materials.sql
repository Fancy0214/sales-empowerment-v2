-- ==================== 智能出题资料库 - Supabase 数据库建表 SQL ====================
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. 创建 quiz_materials 表
CREATE TABLE IF NOT EXISTS quiz_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'materials' CHECK (category IN ('materials', 'reference')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建索引，加速按分类查询
CREATE INDEX IF NOT EXISTS idx_quiz_materials_category ON quiz_materials(category);

-- 3. 设置 RLS 策略
ALTER TABLE quiz_materials ENABLE ROW LEVEL SECURITY;

-- 允许所有人查询（公开读取）
CREATE POLICY "quiz_materials_select_all" ON quiz_materials
    FOR SELECT
    USING (true);

-- 允许前端通过 publishable key 插入
CREATE POLICY "quiz_materials_insert_all" ON quiz_materials
    FOR INSERT
    WITH CHECK (true);

-- 允许前端通过 publishable key 更新
CREATE POLICY "quiz_materials_update_all" ON quiz_materials
    FOR UPDATE
    USING (true) WITH CHECK (true);

-- 允许前端通过 publishable key 删除
CREATE POLICY "quiz_materials_delete_all" ON quiz_materials
    FOR DELETE
    USING (true);
