<template>
  <div class="page-header">
    <div class="page-header-content">
      <!-- 左侧标题和描述 -->
      <div class="header-main">
        <div class="breadcrumb-wrapper" v-if="showBreadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbItems"
              :key="item.path"
              :to="item.path ? { path: item.path } : undefined"
            >
              <el-icon v-if="item.icon" class="breadcrumb-icon">
                <component :is="item.icon" />
              </el-icon>
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="title-section">
          <h1 class="page-title">
            <el-icon v-if="icon" class="title-icon">
              <component :is="icon" />
            </el-icon>
            {{ title }}
            <el-tag v-if="tag" :type="tagType" size="small" class="title-tag">
              {{ tag }}
            </el-tag>
          </h1>

          <p v-if="content" class="page-description">
            {{ content }}
          </p>

          <!-- 元数据信息 -->
          <div v-if="meta && meta.length > 0" class="meta-info">
            <span
              v-for="(item, index) in meta"
              :key="index"
              class="meta-item"
            >
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

    <!-- 标签页区域 -->
    <div v-if="tabs && tabs.length > 0" class="header-tabs">
      <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick"
        class="page-tabs"
      >
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

    <!-- 底部状态栏 -->
    <div v-if="showStatusBar" class="status-bar">
      <slot name="status">
        <div class="status-items">
          <span v-if="lastUpdateTime" class="status-item">
            <el-icon class="status-icon"><Clock /></el-icon>
            最后更新: {{ formatTime(lastUpdateTime) }}
          </span>
          <span v-if="onlineUsers" class="status-item">
            <el-icon class="status-icon"><User /></el-icon>
            在线用户: {{ onlineUsers }}
          </span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { Clock, User } from '@element-plus/icons-vue'

/** 组件名称定义 */
defineOptions({ name: 'PageHeader' })

/** 面包屑项接口 */
interface BreadcrumbItem {
  title: string
  path?: string
  icon?: any
}

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
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
  actions?: Action[]
  tabs?: Tab[]
  defaultTab?: string
  quickActions?: Action[]
  meta?: MetaItem[]
  showStatusBar?: boolean
  lastUpdateTime?: string | Date
  onlineUsers?: number
}

const props = withDefaults(defineProps<Props>(), {
  showBreadcrumb: false,
  showStatusBar: false
})

/** 组件事件 */
const emit = defineEmits<{
  'action-click': [action: Action]
  'tab-change': [tabKey: string]
}>()

// ========================= 响应式数据 =========================

const route = useRoute()
const slots = useSlots()
const activeTab = ref(props.defaultTab || (props.tabs?.[0]?.key))

// ========================= 计算属性 =========================

/** 是否有操作区域 */
const hasActions = computed(() => {
  return !!(slots.extra || (props.actions && props.actions.length > 0))
})

/** 自动生成面包屑 */
const breadcrumbItems = computed(() => {
  if (props.breadcrumbItems) {
    return props.breadcrumbItems
  }

  // 根据路由自动生成面包屑
  const items: BreadcrumbItem[] = []
  const pathSegments = route.path.split('/').filter(segment => segment)

  items.push({ title: '首页', path: '/' })

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // 简单的路径到标题映射
    const titleMap: Record<string, string> = {
      'drug': '药品管理',
      'import': '数据导入',
      'task': '任务管理',
      'batch': '批量导入',
      'monitor': '进度监控',
      'history': '导入历史'
    }

    const title = titleMap[segment] || segment

    items.push({
      title,
      path: index === pathSegments.length - 1 ? undefined : currentPath
    })
  })

  return items
})

// ========================= 方法 =========================

/** 处理操作按钮点击 */
const handleActionClick = (action: Action) => {
  if (action.handler) {
    action.handler()
  }
  emit('action-click', action)
}

/** 处理标签页点击 */
const handleTabClick = (tab: any) => {
  activeTab.value = tab.name
  emit('tab-change', tab.name)
}

/** 格式化时间 */
const formatTime = (time: string | Date) => {
  if (!time) return ''
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleString()
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

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 0 24px;
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

.title-tag {
  margin-left: 8px;
  vertical-align: middle;
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

/* 状态栏样式 */
.status-bar {
  background: #edf2f7;
  border-top: 1px solid #e2e8f0;
  padding: 8px 24px;
}

.status-items {
  display: flex;
  gap: 20px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}

.status-icon {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header-content {
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px 0 16px;
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

  .status-items {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .page-tabs {
    padding: 0 16px;
  }

  .quick-actions {
    padding: 12px 16px;
  }

  .status-bar {
    padding: 8px 16px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .page-header {
    background: #2d3748;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .page-title {
    color: #f7fafc;
  }

  .page-description {
    color: #a0aec0;
  }

  .meta-value {
    color: #e2e8f0;
  }

  .meta-label,
  .meta-icon {
    color: #a0aec0;
  }

  .header-tabs {
    background: #4a5568;
    border-top-color: #4a5568;
  }

  .quick-actions {
    background: #4a5568;
    border-top-color: #4a5568;
  }

  .quick-actions-label {
    color: #a0aec0;
  }

  .quick-action-btn:hover {
    background: #2d3748;
  }

  .status-bar {
    background: #4a5568;
    border-top-color: #4a5568;
  }

  .status-item {
    color: #a0aec0;
  }
}

/* 动画效果 */
.page-header {
  transition: all 0.3s ease;
}

.default-actions .el-button {
  transition: all 0.2s ease;
}

.quick-action-btn {
  transition: all 0.2s ease;
}

/* 自定义样式覆盖 */
:deep(.el-breadcrumb) {
  font-size: 14px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #4a5568;
  font-weight: 500;
}

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

/* 特殊效果 */
.page-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleShine 3s ease-in-out infinite;
}

@keyframes titleShine {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

/* 悬浮效果 */
.page-header:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
