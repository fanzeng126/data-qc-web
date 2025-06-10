<template>
  <div class="page-header">
    <div class="page-header-content">
      <!-- 返回按钮区域 -->
      <div v-if="showBackButton" class="back-button-section">
        <slot name="back-button">
          <el-button
            link
            @click="handleBackClick"
            class="default-back-button"
            :loading="backButtonLoading"
            :disabled="backButtonDisabled"
          >
            <el-icon>
              <ArrowLeft />
            </el-icon>
            {{ backButtonText }}
          </el-button>
        </slot>
      </div>

      <!-- 主要内容区域 -->
      <div class="header-main-section">
        <!-- 左侧标题和描述 -->
        <div class="header-main">
          <div class="title-section">
            <h1 class="page-title">
              <el-icon v-if="icon" class="title-icon">
                <component :is="icon" />
              </el-icon>
              <span class="title-text">{{ title }}</span>
              <el-tag v-if="tag" :type="tagType" size="small" class="title-tag">
                {{ tag }}
              </el-tag>
            </h1>

            <p v-if="content" class="page-description">
              {{ content }}
            </p>

            <!-- 元数据信息 -->
            <div v-if="meta && meta.length > 0" class="meta-info">
              <span v-for="(item, index) in meta" :key="index" class="meta-item">
                <el-icon v-if="item.icon" class="meta-icon">
                  <component :is="item.icon" />
                </el-icon>
                <span class="meta-label">{{ item.label }}:</span>
                <span class="meta-value">{{ item.value }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧操作区域 -->
        <div class="header-actions" v-if="hasActions">
          <slot name="extra">
            <div class="default-actions">
              <el-button
                v-for="action in actions"
                :key="action.key"
                :type="action.type || 'default'"
                :size="action.size || 'default'"
                :loading="action.loading"
                :disabled="action.disabled"
                @click="handleActionClick(action)"
              >
                <el-icon v-if="action.icon">
                  <component :is="action.icon" />
                </el-icon>
                {{ action.text }}
              </el-button>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 标签页区域 -->
    <div v-if="tabs && tabs.length > 0" class="header-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="page-tabs">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.key"
          :label="tab.label"
          :name="tab.key"
          :disabled="tab.disabled"
        >
          <template #label>
            <span class="tab-label">
              <el-icon v-if="tab.icon" class="tab-icon">
                <component :is="tab.icon" />
              </el-icon>
              {{ tab.label }}
              <el-badge
                v-if="tab.badge !== undefined"
                :value="tab.badge"
                :type="tab.badgeType || 'primary'"
                class="tab-badge"
              />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 快速操作区域 -->
    <div v-if="quickActions && quickActions.length > 0" class="quick-actions">
      <div class="quick-actions-content">
        <span class="quick-actions-label">快速操作:</span>
        <div class="quick-actions-list">
          <el-button
            v-for="action in quickActions"
            :key="action.key"
            :type="action.type || 'text'"
            :size="action.size || 'small'"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleActionClick(action)"
            class="quick-action-btn"
          >
            <el-icon v-if="action.icon">
              <component :is="action.icon" />
            </el-icon>
            {{ action.text }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

/** 组件名称定义 */
defineOptions({ name: 'PageHeader' })

/** 操作按钮接口 */
interface Action {
  key: string
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'large' | 'default' | 'small'
  icon?: any
  loading?: boolean
  disabled?: boolean
  handler?: () => void
}

/** 标签页接口 */
interface Tab {
  key: string
  label: string
  icon?: any
  disabled?: boolean
  badge?: number | string
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

/** 元数据接口 */
interface MetaItem {
  label: string
  value: string | number
  icon?: any
}

/** 组件属性 */
interface Props {
  title: string
  content?: string
  icon?: any
  tag?: string
  tagType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  actions?: Action[]
  tabs?: Tab[]
  defaultTab?: string
  quickActions?: Action[]
  meta?: MetaItem[]
  showBackButton?: boolean
  backButtonText?: string
  backButtonLoading?: boolean
  backButtonDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: false,
  backButtonText: '返回',
  backButtonLoading: false,
  backButtonDisabled: false
})

/** 组件事件 */
const emit = defineEmits<{
  'action-click': [action: Action]
  'tab-change': [tabKey: string]
  'back-click': []
}>()

// ========================= 响应式数据 =========================

const slots = useSlots()
const activeTab = ref(props.defaultTab || props.tabs?.[0]?.key)

// ========================= 计算属性 =========================

/** 是否有操作区域 */
const hasActions = computed(() => {
  return !!(slots.extra || (props.actions && props.actions.length > 0))
})

// ========================= 方法 =========================

/** 处理操作按钮点击 */
const handleActionClick = (action: Action) => {
  if (action.handler) {
    action.handler()
  }
  emit('action-click', action)
}

/** 处理标签页点击 - 修复参数访问问题 */
const handleTabClick = (tab: any) => {
  console.log('Tab click event data:', tab) // 调试日志

  // 修复：正确访问 tab 的 name 属性
  const tabKey = tab.props?.name || tab.name || tab.paneName

  console.log('Extracted tab key:', tabKey) // 调试日志

  if (tabKey) {
    activeTab.value = tabKey
    emit('tab-change', tabKey)
  } else {
    console.warn('Tab key not found in tab object:', tab)
  }
}

/** 处理返回按钮点击 */
const handleBackClick = () => {
  emit('back-click')
}
</script>

<style scoped>
.page-header {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  overflow: hidden;
}

/* 返回按钮区域样式 */
.back-button-section {
  padding: 16px 24px 0 24px;
}

.default-back-button {
  padding: 8px 16px;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s ease;
}

.default-back-button:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.default-back-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

/* 主要内容区域 */
.header-main-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 24px 24px 24px;
  min-height: 80px;
}

.header-main {
  flex: 1;
  min-width: 0;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.2;
}

.title-icon {
  font-size: 28px;
  color: #4299e1;
  flex-shrink: 0;
}

/* 修复：分离标题文本和tag，避免渐变背景影响tag显示 */
.title-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
  /* 移除闪烁动画 */
}

/* 修复：确保 title-tag 文字可见，使用更强的样式权重 */
.title-tag {
  margin-left: 8px;
  vertical-align: middle;
  /* 确保tag有正常的文字颜色，不受标题渐变影响 */
  background-color: var(--el-tag-bg-color) !important;
  color: var(--el-tag-text-color) !important;
  border: 1px solid var(--el-tag-border-color) !important;
}

/* 针对不同类型的tag确保文字可见 */
.title-tag.el-tag--primary {
  background-color: #409eff !important;
  color: #ffffff !important;
  border-color: #409eff !important;
}

.title-tag.el-tag--success {
  background-color: #67c23a !important;
  color: #ffffff !important;
  border-color: #67c23a !important;
}

.title-tag.el-tag--warning {
  background-color: #e6a23c !important;
  color: #ffffff !important;
  border-color: #e6a23c !important;
}

.title-tag.el-tag--danger {
  background-color: #f56c6c !important;
  color: #ffffff !important;
  border-color: #f56c6c !important;
}

.title-tag.el-tag--info {
  background-color: #909399 !important;
  color: #ffffff !important;
  border-color: #909399 !important;
}

.page-description {
  margin: 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  max-width: 600px;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #4a5568;
}

.meta-icon {
  font-size: 14px;
  color: #718096;
}

.meta-label {
  color: #718096;
}

.meta-value {
  font-weight: 500;
  color: #2d3748;
}

.header-actions {
  flex-shrink: 0;
  margin-left: 24px;
}

.default-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 标签页样式 */
.header-tabs {
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.page-tabs {
  padding: 0 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 14px;
}

.tab-badge {
  margin-left: 4px;
}

/* 快速操作样式 */
.quick-actions {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 12px 24px;
}

.quick-actions-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-actions-label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
  flex-shrink: 0;
}

.quick-actions-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-action-btn {
  border: none;
  background: transparent;
  padding: 4px 8px;
  height: auto;
  font-size: 12px;
}

.quick-action-btn:hover {
  background: #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .back-button-section {
    padding: 12px 16px 0 16px;
  }

  .header-main-section {
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 20px 16px;
  }

  .header-main {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    margin-left: 0;
  }

  .default-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .page-title {
    font-size: 20px;
  }

  .title-icon {
    font-size: 24px;
  }

  .meta-info {
    flex-direction: column;
    gap: 8px;
  }

  .quick-actions-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .quick-actions-list {
    width: 100%;
  }

  .page-tabs {
    padding: 0 16px;
  }

  .quick-actions {
    padding: 12px 16px;
  }
}

/* 动画效果 */
.page-header {
  transition: all 0.3s ease;
}

.default-actions .el-button,
.quick-action-btn,
.default-back-button {
  transition: all 0.2s ease;
}

/* 悬浮效果 */
.page-header:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 自定义样式覆盖 */
:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e2e8f0;
}

:deep(.el-tabs__active-bar) {
  background-color: #4299e1;
}

:deep(.el-tabs__item.is-active) {
  color: #4299e1;
  font-weight: 500;
}

:deep(.el-badge__content.is-fixed) {
  top: 8px;
  right: 12px;
}
</style>
