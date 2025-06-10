<template>
  <div class="task-log-viewer">
    <el-card class="log-card" shadow="never">
      <template #header>
        <div class="log-header">
          <div class="header-left">
            <el-icon class="header-icon"><DocumentCopy /></el-icon>
            <span class="header-title">执行日志</span>
            <el-tag v-if="logStats.totalLines > 0" type="info" size="small" class="log-count-tag">
              {{ logStats.totalLines }} 行
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button link size="small" @click="refreshLogs" :loading="refreshing">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button link size="small" @click="clearLogs" :disabled="!logs || logs.length === 0">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="exportLogs"
              :disabled="!logs || logs.length === 0"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
      </template>

      <!-- 工具栏 -->
      <div class="log-toolbar">
        <div class="toolbar-left">
          <!-- 修复：使用value而不是label -->
          <div class="filter-group">
            <el-radio-group v-model="selectedLogLevel" size="small" @change="handleLogLevelChange">
              <el-radio-button value="ALL">全部</el-radio-button>
              <el-radio-button value="INFO">信息</el-radio-button>
              <el-radio-button value="WARN">警告</el-radio-button>
              <el-radio-button value="ERROR">错误</el-radio-button>
              <el-radio-button value="DEBUG">调试</el-radio-button>
            </el-radio-group>
          </div>

          <div class="search-group">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索日志内容"
              size="small"
              clearable
              @input="handleSearch"
              style="width: 200px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="auto-refresh-group">
            <el-switch
              v-model="autoRefresh"
              size="small"
              active-text="自动刷新"
              @change="handleAutoRefreshChange"
            />
          </div>

          <div class="log-stats">
            <el-tag v-if="logStats.errorCount > 0" type="danger" size="small" class="stat-tag">
              错误: {{ logStats.errorCount }}
            </el-tag>
            <el-tag v-if="logStats.warnCount > 0" type="warning" size="small" class="stat-tag">
              警告: {{ logStats.warnCount }}
            </el-tag>
            <el-tag v-if="logStats.infoCount > 0" type="info" size="small" class="stat-tag">
              信息: {{ logStats.infoCount }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 修复：使用简单滚动容器，限制显示数量避免性能问题 -->
      <div class="log-content-area" v-loading="loading">
        <div v-if="!logs || logs.length === 0" class="empty-logs">
          <el-empty :image-size="80" description="暂无日志记录">
            <template #image>
              <el-icon class="empty-icon"><DocumentCopy /></el-icon>
            </template>
          </el-empty>
        </div>

        <div v-else class="log-container" ref="logContainer">
          <!-- 简化方案：直接使用div容器，限制显示数量 -->
          <div
            class="log-scroll-container"
            :style="{ height: logContainerHeight + 'px' }"
            @scroll="handleScroll"
            ref="scrollContainer"
          >
            <!-- 性能优化：只显示最新的N条日志，避免DOM节点过多 -->
            <div
              v-for="(item, index) in displayedLogs"
              :key="`${item?.timestamp || Date.now()}-${index}`"
              :class="[
                'log-line',
                `log-${(item?.level || 'info').toLowerCase()}`,
                {
                  highlighted: item?.highlighted
                }
              ]"
            >
              <div class="log-line-header">
                <span class="log-timestamp">{{ formatLogTime(item?.timestamp) }}</span>
                <el-tag :type="getLogLevelTagType(item?.level)" size="small" class="log-level-tag">
                  {{ item?.level || 'UNKNOWN' }}
                </el-tag>
                <span v-if="item?.source" class="log-source">{{ item.source }}</span>
              </div>
              <div class="log-message" v-html="highlightSearchKeyword(item?.message || '')"></div>
              <div v-if="item?.details" class="log-details">
                <el-collapse accordion>
                  <el-collapse-item title="详细信息" name="details">
                    <pre class="log-details-content">{{ formatLogDetails(item.details) }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
              <div v-if="item?.stackTrace" class="log-stack-trace">
                <el-collapse accordion>
                  <el-collapse-item title="错误堆栈" name="stack">
                    <pre class="log-stack-content">{{ item.stackTrace }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>

            <!-- 如果有更多日志未显示，显示提示 -->
            <div v-if="hasMoreLogs" class="more-logs-hint">
              <el-alert
                title="性能优化提示"
                :description="`为了保证页面流畅，当前只显示最新 ${maxDisplayLogs} 条日志。完整日志可通过导出功能获取。`"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <!-- 滚动到底部按钮 -->
          <el-button
            v-show="showScrollToBottom"
            class="scroll-to-bottom-btn"
            type="primary"
            size="small"
            circle
            @click="scrollToBottom"
          >
            <el-icon><ArrowDown /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 底部信息栏和导出对话框保持不变... -->
      <div class="log-footer">
        <div class="footer-left">
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
        <div class="footer-right">
          <span class="file-info" v-if="logFileInfo.size > 0">
            日志文件大小: {{ formatFileSize(logFileInfo.size) }}
          </span>
          <span class="update-time"> 最后更新: {{ formatTime(lastUpdateTime) }} </span>
        </div>
      </div>
    </el-card>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出日志"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportOptions" label-width="80px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportOptions.format">
            <el-radio value="TXT">纯文本(.txt)</el-radio>
            <el-radio value="JSON">JSON格式(.json)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日志级别">
          <el-select v-model="exportOptions.logLevel" placeholder="选择日志级别">
            <el-option label="全部级别" value="ALL" />
            <el-option label="信息" value="INFO" />
            <el-option label="警告" value="WARN" />
            <el-option label="错误" value="ERROR" />
            <el-option label="调试" value="DEBUG" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportOptions.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="包含详情">
          <el-checkbox v-model="exportOptions.includeDetails">包含详细信息和堆栈跟踪</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleExport" :loading="exporting"> 导出 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Refresh, Delete, Download, Search, ArrowDown } from '@element-plus/icons-vue'
import { DrugBatchImportApi } from '@/api/drug/task'

defineOptions({ name: 'TaskLogViewer' })

// 日志条目接口
interface LogEntry {
  timestamp?: string
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  source?: string
  message?: string
  details?: string
  stackTrace?: string
  highlighted?: boolean
}

interface Props {
  taskId: number
  autoRefreshInterval?: number
  maxLogLines?: number
  maxDisplayLogs?: number // 新增：最大显示日志数，控制性能
}

const props = withDefaults(defineProps<Props>(), {
  autoRefreshInterval: 5000,
  maxLogLines: 1000,
  maxDisplayLogs: 500 // 默认只显示最新500条，保证性能
})

const emit = defineEmits<{
  'export-logs': []
}>()

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const exporting = ref(false)
const exportDialogVisible = ref(false)

const logs = ref<LogEntry[]>([])
const filteredLogs = ref<LogEntry[]>([])
const selectedLogLevel = ref('ALL')
const searchKeyword = ref('')
const autoRefresh = ref(false)
const showScrollToBottom = ref(false)

const lastUpdateTime = ref<string>('')
const logContainer = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()
const logContainerHeight = ref(400)

// 修复：使用ref避免生命周期问题
const refreshTimer = ref<NodeJS.Timeout | null>(null)
const isComponentMounted = ref(false)

// 日志统计
const logStats = reactive({
  totalLines: 0,
  infoCount: 0,
  warnCount: 0,
  errorCount: 0,
  debugCount: 0
})

// 日志文件信息
const logFileInfo = reactive({
  size: 0,
  hasMoreLogs: false
})

// 导出选项
const exportOptions = reactive({
  format: 'TXT',
  logLevel: 'ALL',
  timeRange: [] as string[],
  includeDetails: true
})

// ========================= 性能优化的计算属性 =========================

/**
 * 核心性能优化：只显示部分日志避免DOM节点过多
 * 这是简化方案的关键 - 通过限制DOM数量保证性能
 */
const displayedLogs = computed(() => {
  const logs = filteredLogs.value
  if (logs.length <= props.maxDisplayLogs) {
    return logs
  }
  // 只显示最新的日志
  return logs.slice(-props.maxDisplayLogs)
})

/**
 * 判断是否有更多日志未显示
 */
const hasMoreLogs = computed(() => {
  return filteredLogs.value.length > props.maxDisplayLogs
})

// ========================= 监听器 =========================

watch(
  () => props.taskId,
  (newTaskId) => {
    if (newTaskId && isComponentMounted.value) {
      loadLogs()
    }
  }
)

watch(searchKeyword, () => {
  handleSearch()
})

// ========================= 生命周期 =========================

onMounted(() => {
  isComponentMounted.value = true
  initComponent()
})

onUnmounted(() => {
  isComponentMounted.value = false
  stopAutoRefresh()
})

// ========================= 核心方法（与原版本基本相同，省略重复代码） =========================

const initComponent = () => {
  if (!isComponentMounted.value) return
  loadLogs()
  updateContainerHeight()
}

/**
 * 加载日志 - 核心逻辑不变
 */
const loadLogs = async () => {
  if (!props.taskId || !isComponentMounted.value) return

  loading.value = true
  try {
    const response = await DrugBatchImportApi.getTaskLogs(props.taskId, selectedLogLevel.value)

    if (response.logs) {
      logs.value = parseLogContent(response.logs)
      updateLogStats()
      filterLogs()

      logFileInfo.size = response.logFileSize || 0
      logFileInfo.hasMoreLogs = response.hasMoreLogs || false
      lastUpdateTime.value = new Date().toISOString()

      if (autoRefresh.value) {
        nextTick(() => scrollToBottom())
      }
    }
  } catch (error) {
    if (isComponentMounted.value) {
      ElMessage.error('获取日志失败')
      console.error('加载日志失败:', error)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 解析日志内容 - 逻辑不变
 */
const parseLogContent = (logContent: string): LogEntry[] => {
  if (!logContent) return []

  const lines = logContent.split('\n').filter((line) => line.trim())
  const parsedLogs: LogEntry[] = []

  for (const line of lines) {
    const logEntry = parseLogLine(line)
    if (logEntry) {
      parsedLogs.push(logEntry)
    }
  }

  if (parsedLogs.length > props.maxLogLines) {
    return parsedLogs.slice(-props.maxLogLines)
  }

  return parsedLogs
}

const parseLogLine = (line: string): LogEntry | null => {
  const logPattern = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.+)$/
  const match = line.match(logPattern)

  if (match) {
    return {
      timestamp: match[1],
      level: match[2] as LogEntry['level'],
      source: match[3] || undefined,
      message: match[4],
      highlighted: false
    }
  }

  return {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: line,
    highlighted: false
  }
}

const updateLogStats = () => {
  logStats.totalLines = logs.value.length
  logStats.infoCount = logs.value.filter((log) => log.level === 'INFO').length
  logStats.warnCount = logs.value.filter((log) => log.level === 'WARN').length
  logStats.errorCount = logs.value.filter((log) => log.level === 'ERROR').length
  logStats.debugCount = logs.value.filter((log) => log.level === 'DEBUG').length
}

const filterLogs = () => {
  let filtered = [...logs.value]

  if (selectedLogLevel.value !== 'ALL') {
    filtered = filtered.filter((log) => log.level === selectedLogLevel.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      (log) =>
        (log.message && log.message.toLowerCase().includes(keyword)) ||
        (log.source && log.source.toLowerCase().includes(keyword))
    )
  }

  filteredLogs.value = filtered
}

const updateContainerHeight = () => {
  const windowHeight = window.innerHeight
  const headerHeight = 200
  const toolbarHeight = 120
  const footerHeight = 80

  logContainerHeight.value = Math.max(
    windowHeight - headerHeight - toolbarHeight - footerHeight,
    300
  )
}

const startAutoRefresh = () => {
  if (refreshTimer.value || !isComponentMounted.value) return

  refreshTimer.value = setInterval(() => {
    if (isComponentMounted.value) {
      loadLogs()
    }
  }, props.autoRefreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// ========================= 事件处理方法 =========================

const refreshLogs = async () => {
  if (!isComponentMounted.value) return

  refreshing.value = true
  try {
    await loadLogs()
    ElMessage.success('日志已刷新')
  } catch (error) {
    if (isComponentMounted.value) {
      ElMessage.error('刷新失败')
    }
  } finally {
    refreshing.value = false
  }
}

const clearLogs = () => {
  if (!isComponentMounted.value) return

  logs.value = []
  filteredLogs.value = []
  updateLogStats()
  ElMessage.success('日志显示已清空')
}

const handleLogLevelChange = () => {
  if (!isComponentMounted.value) return
  filterLogs()
  loadLogs()
}

const handleSearch = () => {
  if (!isComponentMounted.value) return

  filterLogs()

  if (searchKeyword.value.trim()) {
    filteredLogs.value.forEach((log) => {
      if (log.message) {
        log.highlighted = log.message.toLowerCase().includes(searchKeyword.value.toLowerCase())
      }
    })
  } else {
    filteredLogs.value.forEach((log) => {
      log.highlighted = false
    })
  }
}

const handleAutoRefreshChange = (enabled: boolean) => {
  if (!isComponentMounted.value) return

  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

/**
 * 滚动事件处理 - 修复：使用简单的滚动检测
 */
const handleScroll = (event: Event) => {
  if (!isComponentMounted.value) return

  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  // 判断是否显示回到底部按钮
  showScrollToBottom.value = scrollTop < scrollHeight - clientHeight - 100
}

/**
 * 滚动到底部 - 修复：直接操作DOM
 */
const scrollToBottom = () => {
  if (!isComponentMounted.value || !scrollContainer.value) return

  scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  showScrollToBottom.value = false
}

const exportLogs = () => {
  if (!isComponentMounted.value) return
  exportDialogVisible.value = true
  emit('export-logs')
}

// 其他工具方法保持不变...
const getStatusText = () => {
  if (loading.value) return '正在加载日志...'
  if (filteredLogs.value.length === 0) return '无日志记录'
  if (filteredLogs.value.length !== logs.value.length) {
    return `显示 ${displayedLogs.value.length} / ${filteredLogs.value.length} 条，共 ${logs.value.length} 条日志`
  }
  return `显示 ${displayedLogs.value.length} / ${logs.value.length} 条日志`
}

const getLogLevelTagType = (level: string | undefined) => {
  const typeMap = {
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'danger',
    DEBUG: 'success'
  }
  return typeMap[level || 'INFO'] || 'info'
}

const formatLogTime = (timestamp: string | undefined) => {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return timestamp
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const highlightSearchKeyword = (message: string) => {
  if (!searchKeyword.value.trim() || !message) return message

  const keyword = searchKeyword.value
  const regex = new RegExp(`(${keyword})`, 'gi')
  return message.replace(regex, '<mark class="search-highlight">$1</mark>')
}

const formatLogDetails = (details: string) => {
  try {
    return JSON.stringify(JSON.parse(details), null, 2)
  } catch {
    return details
  }
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** 处理导出 */
const handleExport = async () => {
  if (!isComponentMounted.value) return

  exporting.value = true
  try {
    // 准备导出数据
    let exportData = [...logs.value]

    // 按级别过滤
    if (exportOptions.logLevel !== 'ALL') {
      exportData = exportData.filter((log) => log.level === exportOptions.logLevel)
    }

    // 按时间范围过滤
    if (exportOptions.timeRange && exportOptions.timeRange.length === 2) {
      const startTime = new Date(exportOptions.timeRange[0])
      const endTime = new Date(exportOptions.timeRange[1])
      exportData = exportData.filter((log) => {
        if (!log.timestamp) return false
        const logTime = new Date(log.timestamp)
        return logTime >= startTime && logTime <= endTime
      })
    }

    // 生成文件内容
    let content = ''
    const filename = `task_${props.taskId}_logs_${new Date().toISOString().slice(0, 10)}`

    if (exportOptions.format === 'JSON') {
      // JSON格式
      const jsonData = exportData.map((log) => ({
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        ...(exportOptions.includeDetails && log.details && { details: log.details }),
        ...(exportOptions.includeDetails && log.stackTrace && { stackTrace: log.stackTrace })
      }))
      content = JSON.stringify(jsonData, null, 2)
      downloadFile(content, `${filename}.json`, 'application/json')
    } else {
      // 纯文本格式
      content = exportData
        .map((log) => {
          let line = `[${log.timestamp || ''}] [${log.level || 'UNKNOWN'}]`
          if (log.source) line += ` [${log.source}]`
          line += ` ${log.message || ''}`

          if (exportOptions.includeDetails) {
            if (log.details) line += `\n详情: ${log.details}`
            if (log.stackTrace) line += `\n堆栈: ${log.stackTrace}`
          }

          return line
        })
        .join('\n')
      downloadFile(content, `${filename}.txt`, 'text/plain')
    }

    ElMessage.success('日志导出成功')
    exportDialogVisible.value = false
  } catch (error) {
    if (isComponentMounted.value) {
      ElMessage.error('导出失败')
      console.error('导出日志失败:', error)
    }
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
/* 保持原有样式，只修复必要的部分 */
.task-log-viewer {
  width: 100%;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.log-count-tag {
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auto-refresh-group {
  display: flex;
  align-items: center;
}

.log-stats {
  display: flex;
  gap: 8px;
}

.stat-tag {
  font-size: 12px;
}

.log-content-area {
  position: relative;
  min-height: 300px;
}

.empty-logs {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.log-container {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.log-virtual-list {
  background: #1e1e1e;
  border-radius: 6px;
}

.log-line {
  contain: layout;
  will-change: transform;
}

.log-line:hover {
  background-color: #2d2d2d;
}

.log-line.highlighted {
  background-color: #3d4f66 !important;
}

.log-line-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-timestamp {
  color: #808080;
  font-size: 11px;
  font-weight: 500;
  min-width: 140px;
}

.log-level-tag {
  font-size: 10px;
  min-width: 50px;
  text-align: center;
}

.log-source {
  color: #569cd6;
  font-size: 11px;
  font-weight: 500;
}

.log-message {
  color: #d4d4d4;
  word-wrap: break-word;
  white-space: pre-wrap;
  margin-left: 8px;
}

.log-info .log-message {
  color: #d4d4d4;
}

.log-warn .log-message {
  color: #dcdcaa;
}

.log-error .log-message {
  color: #f44747;
}

.log-debug .log-message {
  color: #9cdcfe;
}

:deep(.search-highlight) {
  background-color: #ffd700;
  color: #000;
  padding: 1px 2px;
  border-radius: 2px;
}

.log-details,
.log-stack-trace {
  margin-top: 8px;
  margin-left: 8px;
}

.log-details-content,
.log-stack-content {
  background-color: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  color: #cccccc;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 200px;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
}

.footer-right {
  display: flex;
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .log-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .log-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .footer-right {
    flex-direction: column;
    gap: 4px;
  }

  .log-line-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.log-container :deep(.el-virtual-list__wrapper) {
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #2d2d2d;
}

.log-container :deep(.el-virtual-list__wrapper::-webkit-scrollbar) {
  width: 8px;
}

.log-container :deep(.el-virtual-list__wrapper::-webkit-scrollbar-track) {
  background: #2d2d2d;
}

.log-container :deep(.el-virtual-list__wrapper::-webkit-scrollbar-thumb) {
  background: #4a4a4a;
  border-radius: 4px;
}

.log-container :deep(.el-virtual-list__wrapper::-webkit-scrollbar-thumb:hover) {
  background: #5a5a5a;
}

.log-details :deep(.el-collapse-item__header),
.log-stack-trace :deep(.el-collapse-item__header) {
  background-color: transparent;
  border: none;
  color: #9cdcfe;
  font-size: 11px;
  padding: 4px 0;
  height: auto;
  line-height: 1.4;
}

.log-details :deep(.el-collapse-item__wrap),
.log-stack-trace :deep(.el-collapse-item__wrap) {
  border: none;
  background-color: transparent;
}

.log-details :deep(.el-collapse-item__content),
.log-stack-trace :deep(.el-collapse-item__content) {
  padding: 8px 0;
}

.log-line {
  animation: slideIn 0.3s ease-out;
}
.log-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  background: #1e1e1e;
  border-radius: 6px;

  /* 滚动条样式优化 */
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #2d2d2d;
}

.log-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.log-scroll-container::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-scroll-container::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.log-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}

.more-logs-hint {
  padding: 12px;
  margin: 8px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
