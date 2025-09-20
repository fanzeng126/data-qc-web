<template>
  <div class="step-content">
    <!-- 文件要求说明 -->
    <div class="requirements-section">
      <el-alert title="导入文件要求" type="info" :closable="false" class="requirements-alert">
        <template #default>
          <div class="requirements-content">
            <div class="requirements-header">
              <h3 class="requirements-title">压缩包必须包含以下5个Excel文件</h3>
              <p class="requirements-subtitle">请确保文件名称和内容格式完全符合要求</p>
            </div>

            <div class="file-list-container">
              <div class="file-grid">
                <div
                  v-for="(table, key) in tableDefinitions"
                  :key="key"
                  class="file-card"
                  @click="handlePreviewTemplate(table.id)"
                >
                  <div class="file-card-header">
                    <el-icon class="file-card-icon" :style="{ color: table.color }">
                      <Files />
                    </el-icon>
                    <div class="file-card-title">{{ table.fileName }}</div>
                  </div>
                  <div class="file-card-content">
                    <div class="file-card-name">
                      <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="table.type" />
                    </div>
                    <div class="file-card-stats">
                      <span class="field-count">{{ table.fieldCount }} 个字段</span>
                      <span class="required-fields">{{ table.requiredFieldsCount || 0 }} 个必填</span>
                      <span class="download-count">{{ table.downloadCount || 0 }} 次下载</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="requirements-tips">
              <div class="tip-item">
                <el-icon class="tip-icon success">
                  <CircleCheck />
                </el-icon>
                <span>文件格式：Excel (.xlsx) 文件，UTF-8编码</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon warning">
                  <Warning />
                </el-icon>
                <span>字段要求：必填字段不能为空，可选字段可为空</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon info">
                  <InfoFilled />
                </el-icon>
                <span>数据质量：建议数据完整性超过90%以获得最佳导入效果</span>
              </div>
            </div>

            <div class="prepare-actions">
              <el-button @click="handleDownloadTemplate">
                <el-icon><Download /></el-icon>
                下载标准模板压缩包
              </el-button>
              <el-button type="primary" @click="handleStartUpload">
                <el-icon><Upload /></el-icon>
                开始上传文件
              </el-button>
            </div>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Download,
  Upload,
  CircleCheck,
  Warning,
  InfoFilled,
  Files
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { DICT_TYPE } from '@/utils/dict'
import type { Step0Props, Step0Emits } from './types'

// 定义组件名称
defineOptions({ name: 'Step0Prepare' })

// Props
const props = defineProps<Step0Props>()

// Emits
const emit = defineEmits<Step0Emits>()

// 处理预览模板
const handlePreviewTemplate = (templateId: number) => {
  emit('preview-template', templateId)
}

// 处理下载模板
const handleDownloadTemplate = () => {
  emit('download-template')
}

// 处理开始上传
const handleStartUpload = () => {
  emit('start-upload')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* ============ 文件要求区域优化样式 ============ */
.requirements-section {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center; /* 让alert容器居中 */
}

.requirements-alert {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  overflow: hidden;
}

.requirements-content {
  text-align: center;
  padding: 20px;
  width: 100%;
  margin: 0 auto;
}

.requirements-header {
  margin-bottom: 32px;
}

.requirements-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.requirements-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.file-list-container {
  margin: 24px -20px; /* 使用负边距让滚动区域延伸到父容器边缘 */
  padding: 0 20px 8px 20px; /* 内边距保持内容位置 */
  overflow-x: auto; /* 横向滚动 */
  overflow-y: hidden; /* 隐藏纵向滚动条 */
}

.file-list-container::-webkit-scrollbar {
  height: 8px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.file-grid {
  display: flex; /* 改为flex布局以支持横向滚动 */
  gap: 16px;
  width: max-content; /* 让内容决定宽度 */
  min-width: 100%; /* 至少占满容器宽度 */
  padding: 0 16px; /* 左右留一点边距 */
}

.file-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  width: 240px; /* 缩短卡片宽度 */
  flex-shrink: 0; /* 防止卡片被压缩 */
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.file-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.file-card-content {
  text-align: left;
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
}

.file-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.field-count,
.required-fields,
.download-count {
  font-size: 11px;
  color: #666;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.required-fields {
  background: #fef0f0;
  color: #f56c6c;
}

.download-count {
  background: #e6f7ff;
  color: #1890ff;
}

.requirements-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  width: 100%;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tip-icon.success {
  color: #67c23a;
}

.tip-icon.warning {
  color: #e6a23c;
}

.tip-icon.info {
  color: #409eff;
}

.prepare-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prepare-actions {
    flex-direction: column;
  }

  .file-list-container {
    margin: 16px -16px; /* 负边距让滚动区域占满容器宽度 */
    padding: 0 16px 8px 16px;
  }

  .file-grid {
    padding: 0; /* 小屏幕下去掉额外的左右padding */
  }

  .file-card {
    width: 220px; /* 小屏幕下适当减小卡片宽度 */
  }
}

@media (min-width: 1200px) {
  .file-card {
    width: 260px; /* 大屏幕下增大卡片宽度 */
  }
}
</style>