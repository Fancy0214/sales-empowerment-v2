-- ==================== 竞品信息收集功能 - 数据库更新 ====================
-- 请在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. share_links 表新增 link_type 字段（区分查看型/收集型链接）
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'view';
-- 'view' = 查看型分享链接（现有功能）
-- 'collect' = 收集型链接（竞品信息收集）

-- 2. competitor_submissions 表新增 attachments 字段（收集提交的附件）
ALTER TABLE competitor_submissions ADD COLUMN IF NOT EXISTS attachments JSONB;

-- 3. 更新现有记录的 link_type 为 view（兼容旧数据）
UPDATE share_links SET link_type = 'view' WHERE link_type IS NULL;
