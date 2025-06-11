<template>
  <div class="json-viewer">
    <!-- JSON内容展示区域 -->
    <div class="json-content" v-if="displayData">
      <JsonNode
        :data="displayData"
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
    <div class="error-state" v-if="parseError">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <div class="error-message">{{ parseError }}</div>
      <el-button size="small" @click="retry">重新解析</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
const parseError = ref<string>('')
const displayData = ref<any>(null)

// ========================= 监听器 =========================

// 监听数据变化，重新解析
watch(
  () => props.data,
  (newData) => {
    parseError.value = ''
    parseData(newData)
  },
  { immediate: true }
)

// ========================= 方法 =========================

/**
 * 解析数据
 * 将这个逻辑从computed移到方法中，避免副作用
 */
function parseData(data: any) {
  try {
    displayData.value = null

    if (!data) {
      return
    }

    // 如果传入的是字符串，尝试解析为JSON
    if (typeof data === 'string') {
      displayData.value = JSON.parse(data)
    } else {
      // 如果已经是对象，直接使用
      displayData.value = data
    }
  } catch (e) {
    parseError.value = '无法解析JSON数据：格式不正确'
    displayData.value = null
  }
}

/**
 * 处理复制操作
 * 提供便捷的数据复制功能
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
  parseError.value = ''
  loading.value = true

  // 模拟重新解析的过程
  setTimeout(() => {
    loading.value = false
    parseData(props.data)
  }, 500)
}
</script>

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

/* 响应式设计 */
@media (max-width: 768px) {
  .json-viewer {
    font-size: 12px;

    .json-content {
      padding: 12px;
      max-height: 300px;
    }
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
