<template>
  <Dialog
    :title="`函数详情 - ${currentFunction?.chineseName}`"
    v-model="dialogVisible"
    width="900px"
  >
    <div v-if="currentFunction" class="function-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="函数名">
            <el-tag type="primary" size="large">{{ currentFunction.functionName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="中文名称">{{
            currentFunction.chineseName
          }}</el-descriptions-item>
          <el-descriptions-item label="函数分类">
            <el-tag :type="getCategoryColor(currentFunction.functionCategory)">
              {{ getCategoryName(currentFunction.functionCategory) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="函数级别">
            <el-tag :type="getLevelColor(currentFunction.functionLevel)">
              {{ getLevelName(currentFunction.functionLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实现类型">
            <el-tag :type="getImplementationTypeColor(currentFunction.implementationType)">
              {{ getImplementationTypeName(currentFunction.implementationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否系统函数">
            <el-tag :type="currentFunction.isSystem === 1 ? 'danger' : 'success'">
              {{ currentFunction.isSystem === 1 ? '系统函数' : '自定义函数' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentFunction.sortOrder }}</el-descriptions-item>
          <el-descriptions-item label="是否启用">
            <el-tag :type="currentFunction.isActive === 1 ? 'success' : 'danger'">
              {{ currentFunction.isActive === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 函数描述 -->
      <div class="detail-section">
        <h3 class="section-title">函数描述</h3>
        <div class="description-content">
          {{ currentFunction.description || '暂无描述' }}
        </div>
      </div>

      <!-- 参数配置 -->
      <div class="detail-section">
        <h3 class="section-title">参数配置</h3>
        <div v-if="parameterList.length > 0" class="parameter-list">
          <el-table :data="parameterList" border size="small">
            <el-table-column label="参数名" prop="name" width="150" />
            <el-table-column label="参数类型" prop="type" width="120">
              <template #default="scope">
                <el-tag size="small" :type="getParameterTypeColor(scope.row.type)">
                  {{ getParameterTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="是否必需" prop="required" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.required ? 'danger' : 'info'" size="small">
                  {{ scope.row.required ? '必需' : '可选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="默认值" prop="default" width="120" show-overflow-tooltip />
            <el-table-column
              label="描述"
              prop="description"
              min-width="200"
              show-overflow-tooltip
            />
          </el-table>
        </div>
        <div v-else class="empty-content">
          <el-empty description="该函数无参数" :image-size="80" />
        </div>
      </div>

      <!-- 返回值配置 -->
      <div class="detail-section">
        <h3 class="section-title">返回值配置</h3>
        <div class="return-config">
          <div class="return-type mb-3">
            <span class="label">返回类型：</span>
            <el-tag type="primary">{{ returnType }}</el-tag>
          </div>

          <div v-if="returnVariables.length > 0" class="return-variables">
            <div class="label mb-2">返回变量：</div>
            <el-table :data="returnVariables" border size="small">
              <el-table-column label="变量名" prop="key" width="120" />
              <el-table-column label="变量类型" prop="type" width="100">
                <template #default="scope">
                  <el-tag size="small" :type="getReturnTypeColor(scope.row.type)">
                    {{ scope.row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变量描述" prop="description" min-width="180" />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 实现配置 -->
      <div class="detail-section">
        <h3 class="section-title">实现配置</h3>
        <div class="implementation-config">
          <div v-if="currentFunction.implementationClass" class="implementation-class mb-3">
            <div class="label">实现类：</div>
            <div class="code-block">{{ currentFunction.implementationClass }}</div>
          </div>

          <div v-if="currentFunction.sqlTemplate" class="sql-template mb-3">
            <div class="label">SQL模板：</div>
            <div class="code-block">
              <pre>{{ currentFunction.sqlTemplate }}</pre>
            </div>
          </div>

          <div v-if="currentFunction.usageExample" class="usage-example">
            <div class="label">使用示例：</div>
            <div class="code-block example">{{ currentFunction.usageExample }}</div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="detail-section">
        <h3 class="section-title">使用说明</h3>
        <div class="usage-guide">
          <el-alert
            :title="`${currentFunction.functionName} 函数使用指南`"
            type="info"
            :closable="false"
          >
            <template #default>
              <div class="guide-content">
                <p><strong>函数作用：</strong>{{ currentFunction.description }}</p>
                <p v-if="currentFunction.usageExample">
                  <strong>使用方式：</strong>
                  <code>{{ currentFunction.usageExample }}</code>
                </p>
                <p v-if="parameterList.length > 0">
                  <strong>参数说明：</strong>
                  <span v-for="(param, index) in parameterList" :key="index" class="param-hint">
                    {{ param.name }}({{ getParameterTypeName(param.type) }}){{
                      index < parameterList.length - 1 ? '、' : ''
                    }}
                  </span>
                </p>
                <p><strong>返回类型：</strong>{{ returnType }}</p>
              </div>
            </template>
          </el-alert>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button v-if="!currentFunction?.isSystem" type="primary" @click="editFunction">
        编辑函数
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcFunctionConfigVO } from '@/api/drug/qc/builder'

defineOptions({ name: 'FunctionDetailDialog' })

const dialogVisible = ref(false)
const currentFunction = ref<QcFunctionConfigVO | null>(null)
const parameterList = ref<any[]>([])
const returnType = ref('STRING')
const returnVariables = ref<any[]>([])

// 获取分类名称
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    STATISTICS: '统计函数',
    STRING: '字符串函数',
    NUMERIC: '数值函数',
    TIME: '时间函数',
    NULL_CHECK: '空值检查',
    ANALYSIS: '分析函数',
    CUSTOM: '自定义函数'
  }
  return categoryMap[category] || category
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    STATISTICS: 'primary',
    STRING: 'success',
    NUMERIC: 'warning',
    TIME: 'info',
    NULL_CHECK: 'danger',
    ANALYSIS: 'info',
    CUSTOM: 'success'
  }
  return colorMap[category] || 'info'
}

// 获取实现类型名称
const getImplementationTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '内置函数',
    2: '自定义函数',
    3: 'SQL函数'
  }
  return typeMap[type] || '未知'
}

// 获取实现类型颜色
const getImplementationTypeColor = (type: number) => {
  const colorMap: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  return colorMap[type] || ''
}

// 获取级别名称
const getLevelName = (level: number) => {
  const levelMap: Record<number, string> = {
    1: '基础',
    2: '高级',
    3: '专家'
  }
  return levelMap[level] || '未知'
}

// 获取级别颜色
const getLevelColor = (level: number) => {
  const colorMap: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return colorMap[level] || ''
}

// 获取参数类型名称
const getParameterTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    field: '字段',
    expression: '表达式',
    string: '字符串',
    number: '数字',
    'field[]': '字段数组',
    table: '表'
  }
  return typeMap[type] || type
}

// 获取参数类型颜色
const getParameterTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    field: 'primary',
    expression: 'success',
    string: 'warning',
    number: 'info',
    'field[]': 'danger',
    table: 'info'
  }
  return colorMap[type] || 'info'
}

// 获取返回类型颜色
const getReturnTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    STRING: 'primary',
    INTEGER: 'success',
    DECIMAL: 'warning',
    BOOLEAN: 'info',
    ARRAY: 'danger',
    OBJECT: 'info'
  }
  return colorMap[type] || 'info'
}

// 解析参数配置
const parseParameterConfig = (configStr: string) => {
  try {
    const config = JSON.parse(configStr)
    parameterList.value = config.parameters || []
  } catch (error) {
    console.warn('解析参数配置失败：', error)
    parameterList.value = []
  }
}

// 解析返回值配置
const parseReturnConfig = (configStr: string) => {
  try {
    const config = JSON.parse(configStr)
    
    // 只支持新格式 {"variables": {"result": {"type": "BOOLEAN", "description": "描述"}}}
    if (config.variables && typeof config.variables === 'object') {
      const variableEntries = Object.entries(config.variables)
      returnVariables.value = variableEntries.map(([key, varInfo]) => ({
        key,
        type: (varInfo as any).type || 'STRING',
        description: (varInfo as any).description || ''
      }))
      
      // 如果有变量，使用第一个变量的类型作为主返回类型显示
      if (variableEntries.length > 0) {
        const firstVar = variableEntries[0][1] as any
        returnType.value = firstVar.type || 'STRING'
      } else {
        returnType.value = 'STRING'
      }
    } else {
      returnType.value = 'STRING'
      returnVariables.value = []
    }
  } catch (error) {
    console.warn('解析返回值配置失败：', error)
    returnType.value = 'STRING'
    returnVariables.value = []
  }
}

// 打开对话框
const open = (functionData: QcFunctionConfigVO) => {
  currentFunction.value = functionData
  dialogVisible.value = true

  // 解析配置数据
  if (functionData.parameterConfig) {
    parseParameterConfig(functionData.parameterConfig)
  } else {
    parameterList.value = []
  }

  if (functionData.returnConfig) {
    parseReturnConfig(functionData.returnConfig)
  } else {
    returnType.value = 'STRING'
    returnVariables.value = []
  }
}

// 编辑函数
const emit = defineEmits(['edit'])
const editFunction = () => {
  dialogVisible.value = false
  emit('edit', currentFunction.value?.id)
}

defineExpose({ open })
</script>

<style scoped>
.function-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background-color: #409eff;
  margin-right: 8px;
}

.description-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  color: #606266;
  line-height: 1.6;
}

.empty-content {
  text-align: center;
  padding: 40px 20px;
}

.return-config .label,
.implementation-config .label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.code-block {
  background: #f5f6fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #2c3e50;
  overflow-x: auto;
}

.code-block.example {
  background: #e8f4fd;
  border-color: #b3d8ff;
  color: #1f2937;
}

.code-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.usage-guide {
  background: #f0f9ff;
  border-radius: 6px;
  padding: 16px;
}

.guide-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.guide-content strong {
  color: #303133;
}

.guide-content code {
  background: #e1ecf4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #1f2937;
}

.param-hint {
  color: #409eff;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .function-detail {
    max-height: 60vh;
  }

  .section-title {
    font-size: 14px;
  }

  .code-block {
    font-size: 12px;
    padding: 8px;
  }
}
</style>
