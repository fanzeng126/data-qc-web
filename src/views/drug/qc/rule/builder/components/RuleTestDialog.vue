<template>
  <el-dialog
    v-model="dialogVisible"
    title="规则测试"
    width="90%"
    :before-close="handleClose"
    destroy-on-close
    class="rule-test-dialog"
  >
    <div class="test-container">
      <!-- 测试配置区 -->
      <div class="test-config-section">
        <div class="section-header">
          <Icon icon="ep:setting" class="header-icon" />
          <span class="header-title">测试配置</span>
        </div>

        <el-form :model="testConfig" :rules="testRules" ref="testFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="机构数量" prop="hospitalCount">
                <el-input-number
                  v-model="testConfig.hospitalCount"
                  :min="1"
                  :max="10"
                  controls-position="right"
                  placeholder="每个机构生成多少条数据"
                />
                <div class="form-tip">生成测试用的医疗机构数量</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="每机构样本数" prop="sampleSize">
                <el-input-number
                  v-model="testConfig.sampleSize"
                  :min="1"
                  :max="200"
                  controls-position="right"
                  placeholder="每个机构的样本数据量"
                />
                <div class="form-tip">每个机构对应的样本数量</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="测试超时" prop="timeout">
                <el-input-number
                  v-model="testConfig.timeout"
                  :min="5"
                  :max="300"
                  controls-position="right"
                />
                <span class="unit-text">秒</span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 测试数据区 -->
      <div class="test-data-section">
        <div class="section-header">
          <Icon icon="ep:document" class="header-icon" />
          <span class="header-title">测试数据</span>
          <div class="header-actions">
            <el-button
              size="small"
              @click="generateMockData"
              :loading="generatingMockData"
            >
              <Icon icon="ep:refresh" class="mr-5px" />
              生成模拟数据
            </el-button>
            <el-button size="small" @click="addMockRecord" :disabled="!currentTableName">
              <Icon icon="ep:plus" class="mr-5px" />
              添加记录
            </el-button>
          </div>
        </div>

        <!-- 适用表 Tab 导航 -->
        <div v-if="applicableTables.length > 0" class="table-tabs">
          <el-tabs v-model="currentTableName" type="border-card">
            <el-tab-pane 
              v-for="table in applicableTables" 
              :key="table.value"
              :label="table.label"
              :name="table.value"
            >
              <!-- 当前表的模拟数据编辑器 -->
              <div class="mock-data-editor">
                <div class="data-table-container">
                  <el-table
                    :data="getCurrentTableMockData(table.value)"
                    border
                    stripe
                    max-height="300"
                    class="mock-data-table"
                  >
                    <el-table-column type="index" label="#" width="50" />
                    <el-table-column
                      v-for="field in getCurrentTableFields(table.value)"
                      :key="field.name"
                      :prop="field.name"
                      :label="field.label"
                      :width="field.width"
                      show-overflow-tooltip
                    >
                      <template #default="{ row }">
                        <el-input
                          v-if="field.type === 'string'"
                          v-model="row[field.name]"
                          size="small"
                        />
                        <el-input-number
                          v-else-if="field.type === 'number'"
                          v-model="row[field.name]"
                          size="small"
                          controls-position="right"
                        />
                        <el-date-picker
                          v-else-if="field.type === 'date'"
                          v-model="row[field.name]"
                          type="date"
                          size="small"
                          format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD"
                        />
                        <el-select
                          v-else-if="field.type === 'select'"
                          v-model="row[field.name]"
                          size="small"
                        >
                          <el-option
                            v-for="option in field.options"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                          />
                        </el-select>
                        <el-input v-else v-model="row[field.name]" size="small" />
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="80" fixed="right">
                      <template #default="{ $index }">
                        <el-button 
                          size="small" 
                          text 
                          type="danger" 
                          @click="removeMockRecord(table.value, $index)"
                        >
                          <Icon icon="ep:delete" />
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 没有适用表时的提示 -->
        <div v-else class="no-tables-hint">
          <el-empty description="没有找到适用表，请先配置规则的适用表信息" />
        </div>
      </div>

      <!-- 测试执行区 -->
      <div class="test-execution-section">
        <div class="section-header">
          <Icon icon="ep:cpu" class="header-icon" />
          <span class="header-title">执行测试</span>
        </div>

        <div class="execution-controls">
          <el-button
            type="primary"
            @click="executeTest"
            :loading="testExecuting"
            :disabled="!canExecuteTest"
          >
            <Icon icon="ep:video-play" class="mr-5px" />
            {{ testExecuting ? '测试中...' : '开始测试' }}
          </el-button>
          <el-button v-if="testExecuting" @click="cancelTest">
            <Icon icon="ep:video-pause" class="mr-5px" />
            取消测试
          </el-button>
          <el-button v-if="testResult" @click="exportTestResult">
            <Icon icon="ep:download" class="mr-5px" />
            导出结果
          </el-button>
        </div>

        <!-- 测试进度 -->
        <div v-if="testProgress.visible" class="test-progress">
          <div class="progress-header">
            <span>测试进度：{{ testProgress.current }} / {{ testProgress.total }}</span>
            <span>{{ testProgress.message }}</span>
          </div>
          <el-progress
            :percentage="testProgress.percentage"
            :status="testProgress.status"
            :show-text="false"
          />
          <div class="progress-details">
            <span>已耗时：{{ formatDuration(testProgress.elapsed) }}</span>
            <span>预计剩余：{{ formatDuration(testProgress.remaining) }}</span>
          </div>
        </div>
      </div>

      <!-- 测试结果区 -->
      <div v-if="testResult" class="test-result-section">
        <div class="section-header">
          <Icon icon="ep:trophy" class="header-icon" />
          <span class="header-title">测试结果</span>
          <el-tag :type="getResultType(testResult.overallStatus)" size="large">
            {{ getResultStatusText(testResult.overallStatus) }}
          </el-tag>
        </div>

        <!-- 结果概览 -->
        <div class="result-overview">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ testResult.totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card success">
                <div class="stat-value">{{ testResult.passedRecords }}</div>
                <div class="stat-label">通过记录</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card danger">
                <div class="stat-value">{{ testResult.failedRecords }}</div>
                <div class="stat-label">失败记录</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card warning">
                <div class="stat-value">{{ testResult.warningRecords || 0 }}</div>
                <div class="stat-label">警告记录</div>
              </div>
            </el-col>
          </el-row>

          <div class="additional-stats">
            <el-descriptions :column="4" border>
              <el-descriptions-item label="通过率">
                <span class="pass-rate" :class="getPassRateClass(testResult.passRate)">
                  {{ (testResult.passRate * 100).toFixed(2) }}%
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="执行时间"
                >{{ testResult.executionTime }}ms</el-descriptions-item
              >
              <el-descriptions-item label="测试开始时间">{{
                testResult.startTime
              }}</el-descriptions-item>
              <el-descriptions-item label="测试结束时间">{{
                testResult.endTime
              }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 错误详情 -->
        <div v-if="testResult.sampleErrors?.length > 0" class="error-details">
          <div class="details-header">
            <span>错误详情（显示前{{ Math.min(testResult.sampleErrors.length, 10) }}条）</span>
          </div>

          <el-table
            :data="testResult.sampleErrors.slice(0, 10)"
            border
            stripe
            max-height="300"
            class="error-table"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="recordId" label="记录ID" width="100" />
            <el-table-column prop="ruleCode" label="规则编码" width="120" />
            <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
            <el-table-column label="字段值" width="200">
              <template #default="{ row }">
                <div class="field-values">
                  <div
                    v-for="(value, field) in row.fieldValues"
                    :key="field"
                    class="field-value-item"
                  >
                    <span class="field-name">{{ field }}:</span>
                    <span class="field-value">{{ value }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" text @click="viewErrorDetail(row)">
                  <Icon icon="ep:view" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 规则执行统计 -->
        <div class="rule-stats">
          <div class="details-header">
            <span>规则执行统计</span>
          </div>

          <el-table :data="testResult.ruleStats" border stripe class="rule-stats-table">
            <el-table-column prop="ruleCode" label="规则编码" width="120" />
            <el-table-column prop="ruleName" label="规则名称" show-overflow-tooltip />
            <el-table-column prop="checkedRecords" label="检查记录数" width="120" />
            <el-table-column prop="passedRecords" label="通过记录数" width="120" />
            <el-table-column prop="failedRecords" label="失败记录数" width="120" />
            <el-table-column label="通过率" width="100">
              <template #default="{ row }">
                <span :class="getPassRateClass(row.passRate)">
                  {{ (row.passRate * 100).toFixed(1) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="executionTime" label="执行时间(ms)" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getResultType(row.status)" size="small">
                  {{ getResultStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="testResult && testResult.overallStatus === 'PASSED'"
          type="primary"
          @click="handleApplyTest"
        >
          <Icon icon="ep:check" class="mr-5px" />
          应用测试结果
        </el-button>
      </div>
    </template>

    <!-- 错误详情对话框 -->
    <ErrorDetailDialog v-model="showErrorDetail" :error-info="selectedError" />

  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { testRuleExpression, getFieldsByTable, generateMockTestData } from '@/api/drug/qc/rule/builder'
import ErrorDetailDialog from './ErrorDetailDialog.vue'

interface Props {
  modelValue: boolean
  ruleForm: any
  conditionGroups: any[]
  tableMapping?: Record<string, { label: string; value: string }>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', result: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单引用
const testFormRef = ref()

// 测试配置
const testConfig = reactive({
  hospitalCount: 1,
  sampleSize: 10,
  timeout: 60
})

// 多表数据管理
const tableDataMap = ref({}) // 存储所有表的数据：{ [tableName]: { mockData: [], fields: [] } }
const currentTableName = ref('') // 当前选中的表名

// 测试规则
const testRules = {
  hospitalCount: [{ required: true, message: '请输入机构数量', trigger: 'blur' }],
  sampleSize: [{ required: true, message: '请输入每机构样本数', trigger: 'blur' }]
}

// 数据状态
const generatingMockData = ref(false)
const testExecuting = ref(false)
const testResult = ref(null)
const selectedError = ref(null)
const showErrorDetail = ref(false)

// 测试进度
const testProgress = reactive({
  visible: false,
  current: 0,
  total: 0,
  percentage: 0,
  status: 'active',
  message: '',
  elapsed: 0,
  remaining: 0
})

// 适用的表选项（从规则中获取）
const applicableTables = computed(() => {
  // 从规则的检测到的表中获取适用表
  if (!props.ruleForm) return []
  
  // 优先使用传入的表映射，否则使用默认映射
  const tableMapping = props.tableMapping || {
    'drug_list': { label: '药品目录表 (drug_list)', value: 'drug_list' },
    'drug_inbound': { label: '药品入库表 (drug_inbound)', value: 'drug_inbound' },
    'drug_outbound': { label: '药品出库表 (drug_outbound)', value: 'drug_outbound' },
    'drug_usage': { label: '药品使用表 (drug_usage)', value: 'drug_usage' },
    'hospital_info': { label: '机构信息表 (hospital_info)', value: 'hospital_info' },
    'CATALOG_DEFAULT': { label: '药品目录表 (CATALOG_DEFAULT)', value: 'CATALOG_DEFAULT' },
    'INBOUND': { label: '药品入库表 (INBOUND)', value: 'INBOUND' },
    'OUTBOUND': { label: '药品出库表 (OUTBOUND)', value: 'OUTBOUND' },
    'USAGE': { label: '药品使用表 (USAGE)', value: 'USAGE' },
    'HOSPITAL_INFO': { label: '机构信息表 (HOSPITAL_INFO)', value: 'HOSPITAL_INFO' }
  }
  
  // 如果有明确的适用表字段
  if (props.ruleForm.applicableTable) {
    const table = tableMapping[props.ruleForm.applicableTable]
    return table ? [table] : [{ 
      label: `${props.ruleForm.applicableTable} (${props.ruleForm.applicableTable})`, 
      value: props.ruleForm.applicableTable 
    }]
  }
  
  // 如果有 tableType 字段
  if (props.ruleForm.tableType) {
    const tables = props.ruleForm.tableType.split(',').map(tableName => {
      const cleanTableName = tableName.trim()
      const table = tableMapping[cleanTableName]
      return table ? table : { 
        label: `${cleanTableName} (${cleanTableName})`, 
        value: cleanTableName 
      }
    }).filter(Boolean)
    return tables
  }
  
  // 从条件组中检测使用的表
  if (props.conditionGroups && props.conditionGroups.length > 0) {
    const detectedTables = new Set()
    
    // 递归检测组件中的表
    const detectTablesInComponents = (components) => {
      if (!components || !Array.isArray(components)) return
      
      components.forEach(component => {
        if (component.type === 'field' && component.value && component.value.includes('.')) {
          const [tableName] = component.value.split('.')
          if (tableName) detectedTables.add(tableName)
        } else if (component.type === 'table' && component.value) {
          detectedTables.add(component.value)
        }
        
        // 检查函数参数中的嵌套表达式
        if (component.type === 'function' && component.parameters) {
          component.parameters.forEach(param => {
            if (param.components) {
              detectTablesInComponents(param.components)
            }
          })
        }
      })
    }
    
    props.conditionGroups.forEach(group => {
      if (group.expressionComponents) {
        detectTablesInComponents(group.expressionComponents)
      }
    })
    
    const tables = Array.from(detectedTables).map(tableName => {
      const table = tableMapping[tableName]
      return table ? table : { 
        label: `${tableName} (${tableName})`, 
        value: tableName 
      }
    })
    
    return tables
  }
  
  return []
})

// 监听规则变化，设置默认表名
watch(
  () => props.ruleForm,
  (ruleForm) => {
    if (ruleForm && applicableTables.value.length > 0) {
      // 设置第一个适用表作为默认值
      currentTableName.value = applicableTables.value[0].value
      
      // 初始化所有表的数据结构
      applicableTables.value.forEach(table => {
        if (!tableDataMap.value[table.value]) {
          tableDataMap.value[table.value] = {
            mockData: [],
            fields: []
          }
        }
      })
    }
  },
  { immediate: true }
)

// 获取当前表的模拟数据
const getCurrentTableMockData = (tableName) => {
  return tableDataMap.value[tableName]?.mockData || []
}

// 获取当前表的字段定义
const getCurrentTableFields = (tableName) => {
  return tableDataMap.value[tableName]?.fields || []
}

// 计算属性
const canExecuteTest = computed(() => {
  if (!currentTableName.value) return false
  
  // 检查当前表是否有数据
  const currentTableData = tableDataMap.value[currentTableName.value]
  return currentTableData && currentTableData.mockData.length > 0
})

// 监听表名变化 - 不再需要，因为使用了Tab切换
// watch(
//   () => testConfig.tableName,
//   async (tableName) => {
//     if (tableName) {
//       await loadTableFields(tableName)
//       initializeMockData()
//     }
//   }
// )

// 加载表字段 - 现在通过后端API获取
const loadTableFields = async (tableName: string) => {
  // 这个方法现在主要用于本地字段定义的回退
  try {
    const fieldDefinitions = getFieldDefinitions(tableName)
    if (fieldDefinitions.length > 0) {
      if (!tableDataMap.value[tableName]) {
        tableDataMap.value[tableName] = { mockData: [], fields: [] }
      }
      tableDataMap.value[tableName].fields = fieldDefinitions
    }
  } catch (error) {
    console.error('加载表字段失败:', error)
    ElMessage.error('加载表字段失败')
  }
}

// 获取字段定义（示例数据）
const getFieldDefinitions = (tableName: string) => {
  const definitions: Record<string, any[]> = {
    CATALOG_DEFAULT: [
      { name: 'ypid', label: '药品本位码', type: 'string', width: 120 },
      { name: 'drug_name', label: '药品名称', type: 'string', width: 150 },
      { name: 'manufacturer', label: '生产企业', type: 'string', width: 150 },
      { name: 'specification', label: '规格', type: 'string', width: 120 },
      {
        name: 'dosage_form',
        label: '剂型',
        type: 'select',
        width: 100,
        options: [
          { label: '片剂', value: '片剂' },
          { label: '胶囊', value: '胶囊' },
          { label: '注射剂', value: '注射剂' }
        ]
      },
      { name: 'conversion_factor', label: '转换系数', type: 'number', width: 100 }
    ],
    INBOUND_DEFAULT: [
      { name: 'ypid', label: '药品本位码', type: 'string', width: 120 },
      { name: 'batch_no', label: '批号', type: 'string', width: 120 },
      { name: 'quantity', label: '数量', type: 'number', width: 100 },
      { name: 'amount', label: '金额', type: 'number', width: 100 },
      { name: 'inbound_date', label: '入库日期', type: 'date', width: 120 }
    ],
    OUTBOUND_DEFAULT: [
      { name: 'ypid', label: '药品本位码', type: 'string', width: 120 },
      { name: 'batch_no', label: '批号', type: 'string', width: 120 },
      { name: 'quantity', label: '数量', type: 'number', width: 100 },
      { name: 'amount', label: '金额', type: 'number', width: 100 },
      { name: 'outbound_date', label: '出库日期', type: 'date', width: 120 }
    ],
    USAGE_DEFAULT: [
      { name: 'ypid', label: '药品本位码', type: 'string', width: 120 },
      { name: 'patient_id', label: '患者ID', type: 'string', width: 100 },
      { name: 'dosage', label: '用量', type: 'number', width: 80 },
      { name: 'usage_date', label: '使用日期', type: 'date', width: 120 }
    ],
    HOSPITAL_DEFAULT: [
      { name: 'hospital_code', label: '机构代码', type: 'string', width: 120 },
      { name: 'hospital_name', label: '机构名称', type: 'string', width: 200 },
      { name: 'hospital_level', label: '机构级别', type: 'string', width: 100 }
    ]
  }

  return definitions[tableName] || []
}

// 初始化模拟数据 - 现在不需要自动初始化
// const initializeMockData = () => {
//   if (!currentTableName.value) return
//   
//   const currentFields = tableDataMap.value[currentTableName.value]?.fields || []
//   if (currentFields.length === 0) return
//
//   if (!tableDataMap.value[currentTableName.value]) {
//     tableDataMap.value[currentTableName.value] = { mockData: [], fields: [] }
//   }
//   tableDataMap.value[currentTableName.value].mockData = []
//   addMockRecord()
// }

// 生成模拟数据
const generateMockData = async () => {
  try {
    generatingMockData.value = true

    // 获取所有适用表名
    const applicableTableNames = applicableTables.value.map(table => table.value)
    
    if (applicableTableNames.length === 0) {
      ElMessage.warning('没有找到适用表')
      return
    }

    // 调用后端API生成所有表的模拟数据
    const data = await generateMockTestData({
      applicableTables: applicableTableNames,
      sampleSize: Math.min(testConfig.sampleSize, 200),
      hospitalCount: Math.min(testConfig.hospitalCount, 10)
    })
    // 更新所有表的字段定义和模拟数据
    if (data && data.tableDataMap) {
      Object.keys(data.tableDataMap).forEach(tableName => {
        const tableData = data.tableDataMap[tableName]
        
        // 初始化表数据结构
        if (!tableDataMap.value[tableName]) {
          tableDataMap.value[tableName] = { mockData: [], fields: [] }
        }
        
        // 更新字段定义
        if (tableData.fieldDefinitions && Array.isArray(tableData.fieldDefinitions)) {
          tableDataMap.value[tableName].fields = tableData.fieldDefinitions
        }
        
        // 更新模拟数据
        tableDataMap.value[tableName].mockData = tableData.mockData || []
      })
      
      const totalRecords = Object.values(data.tableDataMap || {})
        .reduce((sum, tableData) => sum + (tableData.mockData?.length || 0), 0)

      ElMessage.success(`生成了 ${applicableTableNames.length} 个表共 ${totalRecords} 条模拟数据`)
    } else {
      ElMessage.error('后端返回数据格式错误')
    }
  } catch (error: any) {
    console.error('生成模拟数据失败:', error)
    ElMessage.error('生成模拟数据失败: ' + (error.message || '未知错误'))
    
    // 如果后端接口失败，回退到本地生成逻辑
    try {
      const applicableTableNames = applicableTables.value.map(table => table.value)
      
      applicableTableNames.forEach(tableName => {
        const fieldDefinitions = getFieldDefinitions(tableName)
        
        if (!tableDataMap.value[tableName]) {
          tableDataMap.value[tableName] = { mockData: [], fields: [] }
        }
        
        tableDataMap.value[tableName].fields = fieldDefinitions
        
        const mockData = []
        const recordsPerHospital = Math.min(testConfig.sampleSize, 200)
        for (let h = 0; h < Math.min(testConfig.hospitalCount, 10); h++) {
          for (let i = 0; i < recordsPerHospital; i++) {
            const record: any = {}
            fieldDefinitions.forEach((field) => {
              record[field.name] = generateMockValue(field)
            })
            mockData.push(record)
          }
        }
        
        tableDataMap.value[tableName].mockData = mockData
      })

      ElMessage.warning(`后端生成失败，已使用本地生成数据`)
    } catch (fallbackError) {
      ElMessage.error('模拟数据生成完全失败')
    }
  } finally {
    generatingMockData.value = false
  }
}

// 生成模拟值
const generateMockValue = (field: any) => {
  switch (field.type) {
    case 'string':
      if (field.name === 'ypid') {
        return Math.random().toString().slice(2, 14).padStart(12, '0')
      } else if (field.name.includes('name')) {
        return `示例${field.label}${Math.floor(Math.random() * 100)}`
      }
      return `示例值${Math.floor(Math.random() * 1000)}`

    case 'number':
      return Math.floor(Math.random() * 1000) + 1

    case 'date':
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))
      return date.toISOString().split('T')[0]

    case 'select':
      const options = field.options || []
      return options.length > 0 ? options[Math.floor(Math.random() * options.length)].value : ''

    default:
      return ''
  }
}

// 添加模拟记录
const addMockRecord = () => {
  if (!currentTableName.value) return
  
  const fields = tableDataMap.value[currentTableName.value]?.fields || []
  const record: any = {}
  fields.forEach((field) => {
    record[field.name] = ''
  })
  
  if (!tableDataMap.value[currentTableName.value]) {
    tableDataMap.value[currentTableName.value] = { mockData: [], fields: [] }
  }
  
  tableDataMap.value[currentTableName.value].mockData.push(record)
}

// 删除模拟记录
const removeMockRecord = (tableName: string, index: number) => {
  if (tableDataMap.value[tableName]) {
    tableDataMap.value[tableName].mockData.splice(index, 1)
  }
}

// 执行测试
const executeTest = async () => {
  try {
    // 表单验证
    const valid = await testFormRef.value.validate()
    if (!valid) return

    if (!currentTableName.value) {
      ElMessage.error('请先选择要测试的表')
      return
    }

    const currentTableData = tableDataMap.value[currentTableName.value]
    if (!currentTableData || currentTableData.mockData.length === 0) {
      ElMessage.error('当前表没有测试数据，请先生成模拟数据')
      return
    }

    testExecuting.value = true
    testResult.value = null

    // 初始化进度
    testProgress.visible = true
    testProgress.current = 0
    testProgress.total = testConfig.sampleSize
    testProgress.percentage = 0
    testProgress.status = 'active'
    testProgress.message = '准备测试数据...'
    testProgress.elapsed = 0
    testProgress.remaining = 0

    const startTime = Date.now()

    // 构建测试请求
    const testRequest = {
      ruleId: props.ruleForm.id || 0,
      testData: {
        tableName: currentTableName.value,
        sampleSize: testConfig.sampleSize,
        timeout: testConfig.timeout,
        mockData: currentTableData.mockData
      }
    }

    // 模拟进度更新
    const progressTimer = setInterval(() => {
      if (testProgress.current < testProgress.total) {
        testProgress.current += Math.floor(Math.random() * 5) + 1
        testProgress.percentage = Math.min((testProgress.current / testProgress.total) * 100, 95)
        testProgress.elapsed = Date.now() - startTime

        if (testProgress.current < testProgress.total * 0.3) {
          testProgress.message = '加载测试数据...'
        } else if (testProgress.current < testProgress.total * 0.7) {
          testProgress.message = '执行规则检查...'
        } else {
          testProgress.message = '生成测试报告...'
        }

        const avgTime = testProgress.elapsed / testProgress.current
        testProgress.remaining = avgTime * (testProgress.total - testProgress.current)
      }
    }, 200)

    // 执行测试
    const data = await testRuleExpression(testRequest)

    clearInterval(progressTimer)

    // 完成进度
    testProgress.current = testProgress.total
    testProgress.percentage = 100
    testProgress.status = 'success'
    testProgress.message = '测试完成'
    testProgress.remaining = 0

    // 处理测试结果
    testResult.value = {
      ...data.testResult,
      overallStatus: data.testResult.failedRecords > 0 ? 'FAILED' : 'PASSED',
      passRate: data.testResult.passedRecords / data.testResult.totalRecords,
      startTime: new Date(startTime).toLocaleString(),
      endTime: new Date().toLocaleString(),
      ruleStats: generateRuleStats(data.testResult)
    }

    ElMessage.success('测试执行完成')
  } catch (error: any) {
    testProgress.status = 'exception'
    testProgress.message = '测试执行失败'
    ElMessage.error('测试执行失败: ' + error.message)
  } finally {
    testExecuting.value = false
    setTimeout(() => {
      testProgress.visible = false
    }, 2000)
  }
}

// 生成规则统计
const generateRuleStats = (testResult: any) => {
  // 模拟规则统计数据
  return props.conditionGroups.map((group, index) => ({
    ruleCode: `RULE_${String(index + 1).padStart(3, '0')}`,
    ruleName: group.groupName || `条件组 ${index + 1}`,
    checkedRecords: testResult.totalRecords,
    passedRecords: Math.floor(testResult.totalRecords * (0.8 + Math.random() * 0.2)),
    failedRecords: Math.floor(testResult.totalRecords * Math.random() * 0.2),
    passRate: 0.8 + Math.random() * 0.2,
    executionTime: Math.floor(Math.random() * 100) + 10,
    status: Math.random() > 0.1 ? 'PASSED' : 'FAILED'
  }))
}

// 取消测试
const cancelTest = () => {
  testExecuting.value = false
  testProgress.visible = false
  testProgress.status = 'exception'
  ElMessage.warning('测试已取消')
}

// 查看错误详情
const viewErrorDetail = (error: any) => {
  selectedError.value = error
  showErrorDetail.value = true
}

// 导出测试结果
const exportTestResult = () => {
  if (!testResult.value) return

  const data = {
    summary: {
      totalRecords: testResult.value.totalRecords,
      passedRecords: testResult.value.passedRecords,
      failedRecords: testResult.value.failedRecords,
      passRate: testResult.value.passRate,
      executionTime: testResult.value.executionTime
    },
    errors: testResult.value.sampleErrors,
    ruleStats: testResult.value.ruleStats
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rule_test_result_${new Date().getTime()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('测试结果已导出')
}

// 工具方法
const getResultType = (status: string) => {
  const types: Record<string, string> = {
    PASSED: 'success',
    FAILED: 'danger',
    WARNING: 'warning',
    PARTIAL: 'warning'
  }
  return types[status] || 'info'
}

const getResultStatusText = (status: string) => {
  const texts: Record<string, string> = {
    PASSED: '通过',
    FAILED: '失败',
    WARNING: '警告',
    PARTIAL: '部分通过'
  }
  return texts[status] || status
}

const getPassRateClass = (rate: number) => {
  if (rate >= 0.9) return 'pass-rate-excellent'
  if (rate >= 0.8) return 'pass-rate-good'
  if (rate >= 0.6) return 'pass-rate-warning'
  return 'pass-rate-danger'
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// 事件处理
const handleClose = () => {
  if (testExecuting.value) {
    ElMessageBox.confirm('测试正在进行中，确定要关闭吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      cancelTest()
      dialogVisible.value = false
    })
  } else {
    dialogVisible.value = false
  }
}

const handleApplyTest = () => {
  emit('apply', testResult.value)
  handleClose()
}
</script>

<style lang="scss" scoped>
.rule-test-dialog {
  .test-container {
    max-height: 80vh;
    overflow-y: auto;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;

      .header-icon {
        color: #409eff;
      }

      .header-title {
        font-size: 16px;
        font-weight: 500;
        flex: 1;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .test-config-section,
    .test-data-section,
    .test-execution-section,
    .test-result-section {
      margin-bottom: 24px;
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e4e7ed;
    }

    .unit-text {
      margin-left: 8px;
      color: #909399;
      font-size: 14px;
    }

    .form-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      line-height: 1.4;
    }
  }

  .mock-data-editor {
    .table-tabs {
      margin-bottom: 20px;
      
      .el-tabs--border-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
      }
      
      .el-tab-pane {
        padding: 16px 0;
      }
    }
    
    .no-tables-hint {
      text-align: center;
      padding: 40px 0;
      color: #909399;
    }

    .data-table-container {
      margin-bottom: 16px;
    }

    .mock-data-table {
      .el-input,
      .el-input-number,
      .el-date-picker,
      .el-select {
        width: 100%;
      }
    }
  }


  .test-execution-section {
    .execution-controls {
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .test-progress {
      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .test-result-section {
    .result-overview {
      margin-bottom: 20px;

      .stat-card {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e4e7ed;

        &.success {
          background: #f0f9ff;
          border-color: #67c23a;

          .stat-value {
            color: #67c23a;
          }
        }

        &.danger {
          background: #fef0f0;
          border-color: #f56c6c;

          .stat-value {
            color: #f56c6c;
          }
        }

        &.warning {
          background: #fdf6ec;
          border-color: #e6a23c;

          .stat-value {
            color: #e6a23c;
          }
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #606266;
        }
      }

      .additional-stats {
        margin-top: 16px;

        .pass-rate {
          font-weight: 600;

          &.pass-rate-excellent {
            color: #67c23a;
          }

          &.pass-rate-good {
            color: #409eff;
          }

          &.pass-rate-warning {
            color: #e6a23c;
          }

          &.pass-rate-danger {
            color: #f56c6c;
          }
        }
      }
    }

    .error-details,
    .rule-stats {
      margin-bottom: 20px;

      .details-header {
        margin-bottom: 12px;
        font-weight: 500;
        color: #303133;
      }

      .field-values {
        .field-value-item {
          font-size: 12px;
          margin: 2px 0;

          .field-name {
            color: #909399;
            margin-right: 4px;
          }

          .field-value {
            color: #303133;
            font-family: 'Fira Code', Consolas, monospace;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .rule-test-dialog {
    .test-container {
      .result-overview .stat-card {
        margin-bottom: 12px;
      }

      .execution-controls {
        flex-direction: column;
        align-items: stretch;
      }
    }
  }
}
</style>
