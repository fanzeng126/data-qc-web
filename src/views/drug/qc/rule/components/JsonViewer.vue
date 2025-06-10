<template>
  <div class="json-viewer">
    <!-- JSON内容展示区域 -->
    <div class="json-content" v-if="formattedData">
      <JsonNode
        :data="formattedData"
        :key-name="rootKeyName"
        :level="0"
        :is-root="true"
        @copy="handleCopy"
      />
    </div>

    <!-- 空数据提示 -->
    <div class="empty-data" v-else-if="!loading">
      <el-icon class="empty-icon"><Document /></el-icon>
      <div class="empty-text">暂无数据</div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-if="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>解析数据中...</span>
    </div>

    <!-- 错误状态 -->
    <div class="error-state" v-if="error">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <div class="error-message">{{ error }}</div>
      <el-button size="small" @click="retry">重新解析</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Loading, WarningFilled } from '@element-plus/icons-vue'
import JsonNode from './JsonNode.vue'

interface Props {
  data: any // 要显示的JSON数据
  rootKeyName?: string // 根节点名称
  maxDepth?: number // 最大展开深度
  showCopyButton?: boolean // 是否显示复制按钮
}

const props = withDefaults(defineProps<Props>(), {
  rootKeyName: 'root',
  maxDepth: 10,
  showCopyButton: true
})

// ========================= 响应式数据 =========================

const loading = ref(false)
const error = ref<string>('')

// ========================= 计算属性 =========================

/**
 * 格式化后的数据
 * 这是组件的核心逻辑，负责将各种类型的数据统一处理成可展示的格式
 */
const formattedData = computed(() => {
  if (!props.data) return null

  try {
    // 如果传入的是字符串，尝试解析为JSON
    if (typeof props.data === 'string') {
      return JSON.parse(props.data)
    }

    // 如果已经是对象，直接返回
    return props.data
  } catch (e) {
    error.value = '无法解析JSON数据：格式不正确'
    return null
  }
})

// ========================= 监听器 =========================

// 监听数据变化，重置错误状态
watch(
  () => props.data,
  () => {
    error.value = ''
  },
  { immediate: true }
)

// ========================= 业务方法 =========================

/**
 * 处理复制操作
 * 提供便捷的数据复制功能，就像给用户提供一键保存的功能
 */
const handleCopy = async (data: any, path: string) => {
  try {
    const text = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制 ${path} 的内容到剪贴板`)
  } catch (e) {
    // 降级处理：如果现代API不可用，使用传统方法
    fallbackCopy(JSON.stringify(data, null, 2))
    ElMessage.success(`已复制 ${path} 的内容到剪贴板`)
  }
}

/**
 * 降级复制方法
 * 兼容不支持现代剪贴板API的浏览器
 */
const fallbackCopy = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } catch (e) {
    console.warn('复制失败:', e)
  }

  document.body.removeChild(textArea)
}

/**
 * 重试解析
 * 当数据解析出错时，提供重新尝试的机会
 */
const retry = () => {
  error.value = ''
  loading.value = true

  // 模拟重新解析的过程
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>

// JsonNode组件将作为单独的组件文件创建

<style lang="scss" scoped>
.json-viewer {
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: #fafbfc;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;

  .json-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
  }

  .empty-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #8e8e93;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 14px;
    }
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    color: #007aff;

    .is-loading {
      animation: spin 1s linear infinite;
    }
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;

    .error-icon {
      font-size: 48px;
      color: #ff3b30;
      margin-bottom: 12px;
    }

    .error-message {
      color: #d70015;
      margin-bottom: 16px;
      font-size: 14px;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* JsonNode组件样式 */
.json-node {
  position: relative;

  .node-line {
    display: flex;
    align-items: center;
    min-height: 24px;
    padding: 2px 0;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(0, 122, 255, 0.1);

      .copy-button {
        opacity: 1;
      }
    }

    .node-indent {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .indent-space {
      width: 20px;
      height: 1px;
    }

    .expand-button {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.2s ease;
      color: #8e8e93;

      &:hover {
        background-color: rgba(0, 122, 255, 0.2);
        color: #007aff;
      }

      &.expanded {
        transform: rotate(90deg);
      }
    }

    .node-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .node-key {
        color: #af52de;
        font-weight: 500;

        &.array-index {
          color: #8e8e93;
          font-style: italic;
        }
      }

      .colon {
        color: #8e8e93;
      }

      .json-value {
        &.json-string {
          color: #007aff;
        }

        &.json-number {
          color: #ff9500;
        }

        &.json-boolean {
          color: #34c759;
          font-weight: 500;
        }

        &.json-null,
        &.json-undefined {
          color: #8e8e93;
          font-style: italic;
        }
      }

      .data-summary {
        color: #8e8e93;
        font-style: italic;
        margin-left: 8px;
      }

      .type-icon {
        color: #8e8e93;
        font-size: 12px;
      }
    }

    .copy-button {
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #8e8e93;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background-color: rgba(0, 122, 255, 0.2);
        color: #007aff;
      }
    }
  }

  .node-children {
    margin-left: 20px;
    border-left: 1px solid #e1e5e9;
    padding-left: 8px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -1px;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }

    &:hover::before {
      background-color: rgba(0, 122, 255, 0.3);
    }
  }

  // 展开/折叠动画
  .collapse-transition {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .collapse-enter-from,
  .collapse-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .collapse-enter-to,
  .collapse-leave-from {
    opacity: 1;
    max-height: 500px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-viewer {
    font-size: 12px;

    .json-content {
      padding: 12px;
      max-height: 300px;
    }

    .json-node {
      .node-line {
        .node-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }

      .node-children {
        margin-left: 16px;
      }
    }
  }
}

/* 暗黑模式适配 */
.dark .json-viewer {
  background-color: #1c1c1e;
  border-color: #38383a;
  color: #ffffff;

  .json-node {
    .node-line:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .node-content {
      .node-key {
        color: #bf5af2;
      }

      .json-value {
        &.json-string {
          color: #64d2ff;
        }

        &.json-number {
          color: #ffcc02;
        }

        &.json-boolean {
          color: #30d158;
        }
      }
    }

    .node-children {
      border-left-color: #38383a;

      &:hover::before {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .empty-data,
  .loading-state,
  .error-state {
    color: #8e8e93;
  }
}

/* 滚动条样式 */
.json-content::-webkit-scrollbar {
  width: 6px;
}

.json-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.json-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
