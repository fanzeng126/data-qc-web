<template>
  <div class="builder-config-container">
    <PageHeader
      title="构建器配置管理"
      content="管理质控规则构建器的数据源、函数库和操作符配置"
      tag="质控系统"
      tag-type="primary"
      :tabs="tabs"
      :default-tab="activeTab"
      @tab-change="handleTabChange"
    />

    <div class="tab-content">
      <!-- 优化：使用 v-show 替代 v-if，避免重复创建销毁组件 -->
      <!-- 使用 keep-alive 缓存组件状态 -->
      <keep-alive>
        <component :is="currentComponent" />
      </keep-alive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FolderOpened, Grid, Operation, Tools } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import DataSourceCategory from './components/DataSourceCategory.vue'
import TableMetadata from './components/TableMetadata.vue'
import FunctionLibrary from './components/FunctionLibrary.vue'
import OperatorConfig from './components/OperatorConfig.vue'

defineOptions({ name: 'BuilderConfig' })

// 当前激活的标签页
const activeTab = ref('datasource')

// 最佳实践：将组件配置定义为常量，避免响应式包装
const tabs = [
  {
    key: 'datasource',
    label: '数据源分类',
    icon: FolderOpened // 直接使用组件，不会被响应式包装
  },
  {
    key: 'table',
    label: '表元数据',
    icon: Grid
  },
  {
    key: 'function',
    label: '函数库',
    icon: Operation
  },
  {
    key: 'operator',
    label: '操作符',
    icon: Tools
  }
]

// 组件映射
const componentMap = {
  datasource: DataSourceCategory,
  table: TableMetadata,
  function: FunctionLibrary,
  operator: OperatorConfig
}

// 计算当前组件
const currentComponent = computed(() => {
  return componentMap[activeTab.value as keyof typeof componentMap]
})

// 处理标签页切换 - 移除不必要的 console.log
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  // 移除 console.log，生产环境不需要
}
</script>

<style scoped>
.builder-config-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.tab-content {
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .builder-config-container {
    min-height: calc(100vh - 60px);
  }
}

/* 添加组件切换的淡入淡出效果 */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
