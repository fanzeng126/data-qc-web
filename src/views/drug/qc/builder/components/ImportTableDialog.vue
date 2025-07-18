<template>
  <Dialog title="导入表元数据" v-model="dialogVisible" width="1000px" :close-on-click-modal="false">
    <div class="import-steps">
      <!-- 步骤条 -->
      <el-steps :active="currentStep" simple>
        <el-step title="选择数据来源" icon="Document" />
        <el-step title="选择要导入的表" icon="Grid" />
        <el-step title="设置导入参数" icon="Setting" />
        <el-step title="执行导入" icon="Upload" />
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 第一步：选择数据来源 -->
        <div v-if="currentStep === 0" class="step-panel">
          <div class="source-selection">
            <h3>选择数据来源</h3>
            <el-radio-group v-model="selectedSource" @change="handleSourceChange" size="large">
              <el-radio-button :label="1">
                <Icon icon="ep:document" class="mr-2" />
                Excel导入模板
              </el-radio-button>
              <el-radio-button :label="2">
                <Icon icon="ep:coin" class="mr-2" />
                数据库表
              </el-radio-button>
            </el-radio-group>

            <div class="source-description mt-4">
              <el-alert :title="sourceDescription" type="info" :closable="false" show-icon />
            </div>
          </div>
        </div>

        <!-- 第二步：选择要导入的表 -->
        <div v-if="currentStep === 1" class="step-panel">
          <div class="table-selection">
            <div class="search-bar mb-4">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索表名或中文名称"
                @input="handleSearch"
                clearable
                class="w-300px"
              >
                <template #prefix>
                  <Icon icon="ep:search" />
                </template>
              </el-input>
              <el-button @click="loadAvailableTables" :loading="tablesLoading" class="ml-2">
                <Icon icon="ep:refresh" class="mr-1" />
                刷新
              </el-button>
            </div>

            <div class="table-list">
              <el-table
                ref="tableRef"
                v-loading="tablesLoading"
                :data="filteredTables"
                @select="handleTableSelect"
                @select-all="handleSelectAll"
                height="400"
                stripe
              >
                <el-table-column type="selection" width="55" />
                <el-table-column
                  label="表名"
                  prop="tableName"
                  min-width="150"
                  show-overflow-tooltip
                />
                <el-table-column
                  label="中文名称"
                  prop="chineseName"
                  min-width="150"
                  show-overflow-tooltip
                />
                <el-table-column label="字段数量" prop="fieldCount" width="90" align="center">
                  <template #default="scope">
                    <el-badge :value="scope.row.fieldCount" type="primary" />
                  </template>
                </el-table-column>
                <el-table-column
                  label="描述"
                  prop="description"
                  min-width="200"
                  show-overflow-tooltip
                />
                <!--                <el-table-column
                  v-if="selectedSource === 1"
                  label="模板类型"
                  prop="templateType"
                  width="120"
                >
                  <template #default="scope">
                    <el-tag size="small">{{ scope.row.templateType }}</el-tag>
                  </template>
                </el-table-column>-->
                <el-table-column
                  v-if="selectedSource === 2"
                  label="表类型"
                  prop="tableType"
                  width="120"
                >
                  <template #default="scope">
                    <el-tag size="small" type="success">{{ scope.row.tableType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="创建/修改时间" width="160">
                  <template #default="scope">
                    <span>{{ formatDate(scope.row.createTime || scope.row.lastModified) }}</span>
                  </template>
                </el-table-column>
              </el-table>

              <div class="selection-info mt-3">
                <span class="text-sm text-gray-600">
                  已选择 <strong class="text-primary">{{ selectedTables.length }}</strong> 个表
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 第三步：设置导入参数 -->
        <div v-if="currentStep === 2" class="step-panel">
          <div class="import-settings">
            <h3>导入设置</h3>
            <el-form :model="importSettings" label-width="120px">
              <el-form-item label="目标分类">
                <el-select
                  v-model="importSettings.categoryId"
                  placeholder="请选择目标分类"
                  class="w-300px"
                >
                  <el-option
                    v-for="category in categoryList"
                    :key="category.id"
                    :label="category.categoryName"
                    :value="category.id"
                  >
                    <span style="float: left">{{ category.categoryName }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{
                      category.categoryCode
                    }}</span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="同步模式">
                <el-radio-group v-model="importSettings.syncMode">
                  <el-radio label="MERGE">合并模式（保留已存在的表和字段）</el-radio>
                  <el-radio label="OVERWRITE">覆盖模式（完全替换已存在的表和字段）</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="冲突处理">
                <el-checkbox v-model="importSettings.overwriteExisting">
                  覆盖已存在的表
                </el-checkbox>
              </el-form-item>
            </el-form>

            <!-- 预览将要导入的表和字段 -->
            <div class="preview-section mt-6">
              <h4>将要导入的表和字段 ({{ selectedTables.length }} 个表)</h4>
              <el-collapse v-model="activeTableNames">
                <el-collapse-item 
                  v-for="table in selectedTables" 
                  :key="table.tableName"
                  :title="`${table.tableName} (${table.chineseName}) - ${getSelectedFieldCount(table)} 个字段`"
                  :name="table.tableName"
                >
                  <template #title>
                    <div class="flex items-center justify-between w-full pr-4">
                      <span>{{ table.tableName }} ({{ table.chineseName }}) - {{ getSelectedFieldCount(table) }} 个字段</span>
                      <el-button link type="danger" @click.stop="removeSelectedTable(selectedTables.indexOf(table))">
                        移除表
                      </el-button>
                    </div>
                  </template>
                  
                  <div class="field-selection">
                    <div class="field-selection-header mb-3">
                      <el-checkbox 
                        :indeterminate="isIndeterminate(table)"
                        v-model="checkAll[table.tableName]"
                        @change="handleCheckAllChange(table, $event)"
                      >
                        全选字段
                      </el-checkbox>
                      <span class="text-sm text-gray-500 ml-2">
                        已选择 {{ getSelectedFieldCount(table) }} / {{ table.fields?.length || 0 }} 个字段
                      </span>
                    </div>
                    
                    <el-table 
                      :data="table.fields" 
                      size="small" 
                      max-height="300"
                      stripe
                    >
                      <el-table-column width="50">
                        <template #default="scope">
                          <el-checkbox 
                            v-model="scope.row.selected"
                            @change="updateCheckAllStatus(table)"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="字段名" prop="fieldName" width="150" />
                      <el-table-column label="中文名称" prop="chineseName" width="150" />
                      <el-table-column label="数据类型" prop="dataType" width="100" />
                      <el-table-column label="长度" prop="maxLength" width="80" align="center" />
                      <el-table-column label="必填" width="60" align="center">
                        <template #default="scope">
                          <el-tag v-if="scope.row.required" type="danger" size="small">是</el-tag>
                          <el-tag v-else type="info" size="small">否</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="主键" width="60" align="center">
                        <template #default="scope">
                          <el-tag v-if="scope.row.primaryKey" type="warning" size="small">是</el-tag>
                          <el-tag v-else type="info" size="small">否</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="注释" prop="comment" min-width="200" show-overflow-tooltip />
                    </el-table>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>

        <!-- 第四步：执行导入 -->
        <div v-if="currentStep === 3" class="step-panel">
          <div class="import-execution">
            <div v-if="!importStarted" class="import-confirm">
              <el-alert title="确认导入" type="warning" :closable="false">
                <template #default>
                  <p
                    >即将导入 <strong>{{ selectedTables.length }}</strong> 个表到分类
                    <strong>{{ targetCategoryName }}</strong></p
                  >
                  <p
                    >同步模式：<strong>{{
                      importSettings.syncMode === 'MERGE' ? '合并模式' : '覆盖模式'
                    }}</strong></p
                  >
                  <p>请确认导入信息无误后点击开始导入。</p>
                </template>
              </el-alert>
            </div>

            <div v-if="importStarted" class="import-progress">
              <el-progress :percentage="importProgress" :status="importStatus" :stroke-width="20" />
              <div class="progress-info mt-3">
                <p>{{ importStatusText }}</p>
              </div>
            </div>

            <!-- 导入结果 -->
            <div v-if="importResult" class="import-result mt-6">
              <h4>导入结果</h4>
              <div class="result-summary mb-4">
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="总表数">{{
                    importResult.totalTables
                  }}</el-descriptions-item>
                  <el-descriptions-item label="成功">
                    <el-tag type="success">{{ importResult.successTables }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="失败">
                    <el-tag type="danger">{{ importResult.failedTables }}</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <el-table :data="importResult.results" height="300" size="small">
                <el-table-column label="表名" prop="tableName" width="150" />
                <el-table-column label="中文名称" prop="chineseName" width="150" />
                <el-table-column label="状态" prop="status" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ scope.row.status === 'SUCCESS' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="字段数量" prop="fieldCount" width="100" align="center" />
                <el-table-column label="新增字段" prop="newFields" width="100" align="center" />
                <el-table-column
                  label="消息"
                  prop="message"
                  min-width="150"
                  show-overflow-tooltip
                />
                <el-table-column
                  label="错误详情"
                  prop="errorDetail"
                  min-width="200"
                  show-overflow-tooltip
                >
                  <template #default="scope">
                    <span v-if="scope.row.errorDetail" class="text-red-500">
                      {{ scope.row.errorDetail }}
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep" :disabled="!canNextStep" :loading="nextStepLoading">
          下一步
        </el-button>
        <el-button
          v-if="currentStep === 3 && !importStarted"
          type="primary"
          @click="startImport"
          :disabled="selectedTables.length === 0"
        >
          开始导入
        </el-button>
        <el-button v-if="importResult" type="success" @click="finishImport"> 完成 </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import {
  QcBuilderSyncApi,
  QcBuilderSyncTableVO,
  QcBuilderDatasourceCategoryVO,
  SYNC_SOURCE,
  SYNC_MODE
} from '@/api/drug/qc/builder'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'ImportTableDialog' })

interface Props {
  categoryList: QcBuilderDatasourceCategoryVO[]
}

const props = defineProps<Props>()
const message = useMessage()

const dialogVisible = ref(false)
const currentStep = ref(0)
const selectedSource = ref<number>(1) // 1-Excel模板，2-数据库表
const searchKeyword = ref('')
const tablesLoading = ref(false)
const availableTables = ref<QcBuilderSyncTableVO[]>([])
const selectedTables = ref<QcBuilderSyncTableVO[]>([])
const importStarted = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'exception' | undefined>(undefined)
const importStatusText = ref('')
const importResult = ref<any>(null)
const nextStepLoading = ref(false)
const activeTableNames = ref<string[]>([])
const checkAll = ref<Record<string, boolean>>({})

// 导入设置
const importSettings = reactive({
  categoryId: undefined,
  syncMode: SYNC_MODE.MERGE,
  overwriteExisting: false
})

// 计算属性
const sourceDescription = computed(() => {
  return selectedSource.value === 1
    ? '从系统预定义的Excel导入模板中同步表结构，适用于标准化的数据导入场景。'
    : '从现有数据库表中同步表结构和字段信息，适用于已有业务系统的数据同步。'
})

const filteredTables = computed(() => {
  if (!searchKeyword.value) return availableTables.value

  const keyword = searchKeyword.value.toLowerCase()
  return availableTables.value.filter(
    (table) =>
      table.tableName.toLowerCase().includes(keyword) ||
      table.chineseName?.toLowerCase().includes(keyword)
  )
})

const canNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedSource.value > 0
    case 1:
      return selectedTables.value.length > 0
    case 2:
      return importSettings.categoryId !== undefined
    default:
      return true
  }
})

const targetCategoryName = computed(() => {
  const category = props.categoryList.find((cat) => cat.id === importSettings.categoryId)
  return category?.categoryName || ''
})

// 方法
const open = () => {
  dialogVisible.value = true
  currentStep.value = 0
  selectedSource.value = 1
  resetData()
}

const resetData = () => {
  searchKeyword.value = ''
  availableTables.value = []
  selectedTables.value = []
  importStarted.value = false
  importProgress.value = 0
  importStatus.value = undefined
  importStatusText.value = ''
  importResult.value = null
  importSettings.categoryId = undefined
  importSettings.syncMode = SYNC_MODE.MERGE
  importSettings.overwriteExisting = false
}

const handleSourceChange = () => {
  availableTables.value = []
  selectedTables.value = []
}

const loadAvailableTables = async () => {
  if (!selectedSource.value) return

  tablesLoading.value = true
  try {
    const data = await QcBuilderSyncApi.getSyncTables({
      syncSource: selectedSource.value,
      keyword: searchKeyword.value
    })
    availableTables.value = data
  } catch (error) {
    message.error('加载表列表失败')
    console.error('加载表列表失败：', error)
  } finally {
    tablesLoading.value = false
  }
}

const handleSearch = () => {
  // 搜索是通过计算属性实现的，这里可以添加防抖等逻辑
}

const tableRef = ref()
const handleTableSelect = (selection: QcBuilderSyncTableVO[], row: QcBuilderSyncTableVO) => {
  selectedTables.value = selection
}

const handleSelectAll = (selection: QcBuilderSyncTableVO[]) => {
  selectedTables.value = selection
}

const removeSelectedTable = (index: number) => {
  selectedTables.value.splice(index, 1)
  // 同步更新表格选择状态
  nextTick(() => {
    tableRef.value?.clearSelection()
    selectedTables.value.forEach((table) => {
      const row = availableTables.value.find((t) => t.tableName === table.tableName)
      if (row) {
        tableRef.value?.toggleRowSelection(row, true)
      }
    })
  })
}

const nextStep = async () => {
  nextStepLoading.value = true
  
  try {
    if (currentStep.value === 0 && availableTables.value.length === 0) {
      await loadAvailableTables()
    }

    if (canNextStep.value) {
      currentStep.value++
      
      // 初始化字段选择状态
      if (currentStep.value === 2) {
        initializeFieldSelection()
      }
    }
  } finally {
    nextStepLoading.value = false
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const startImport = async () => {
  if (selectedTables.value.length === 0 || !importSettings.categoryId) {
    message.error('请检查导入参数')
    return
  }

  importStarted.value = true
  importProgress.value = 0
  importStatus.value = undefined
  importStatusText.value = '准备导入...'

  try {
    // 模拟进度更新
    const updateProgress = (progress: number, text: string) => {
      importProgress.value = progress
      importStatusText.value = text
    }

    updateProgress(20, '验证导入数据...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateProgress(50, '正在导入表结构...')
    const result = await QcBuilderSyncApi.importTables(
      {
        categoryId: importSettings.categoryId,
        syncMode: importSettings.syncMode,
        overwriteExisting: importSettings.overwriteExisting
      },
      selectedTables.value
    )

    updateProgress(80, '同步字段信息...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateProgress(100, '导入完成')
    importStatus.value = result.importResult.failedTables > 0 ? 'exception' : 'success'
    importResult.value = result.importResult

    if (result.importResult.failedTables === 0) {
      message.success(`成功导入 ${result.importResult.successTables} 个表`)
    } else {
      message.warning(
        `导入完成，成功 ${result.importResult.successTables} 个，失败 ${result.importResult.failedTables} 个`
      )
    }
  } catch (error: any) {
    importStatus.value = 'exception'
    importStatusText.value = '导入失败'
    
    // 构造错误结果显示详细信息
    const errorMessage = error?.response?.data?.msg || error?.message || '未知错误'
    importResult.value = {
      totalTables: selectedTables.value.length,
      successTables: 0,
      failedTables: selectedTables.value.length,
      importTime: new Date(),
      results: selectedTables.value.map(table => ({
        tableName: table.tableName,
        chineseName: table.chineseName,
        status: 'FAILED',
        tableId: null,
        fieldCount: 0,
        newFields: 0,
        updatedFields: 0,
        message: '导入失败',
        errorDetail: errorMessage
      }))
    }
    
    message.error(`导入失败：${errorMessage}`)
    console.error('导入失败：', error)
  }
}

const finishImport = () => {
  dialogVisible.value = false
  emit('success')
}

// 字段选择相关方法
const initializeFieldSelection = () => {
  activeTableNames.value = []
  checkAll.value = {}
  
  selectedTables.value.forEach(table => {
    checkAll.value[table.tableName] = true
    // 确保所有字段都有selected属性
    if (table.fields) {
      table.fields.forEach(field => {
        if (field.selected === undefined) {
          field.selected = true
        }
      })
    }
  })
}

const getSelectedFieldCount = (table: QcBuilderSyncTableVO) => {
  if (!table.fields) return 0
  return table.fields.filter(field => field.selected).length
}

const isIndeterminate = (table: QcBuilderSyncTableVO) => {
  if (!table.fields) return false
  const selectedCount = getSelectedFieldCount(table)
  return selectedCount > 0 && selectedCount < table.fields.length
}

const handleCheckAllChange = (table: QcBuilderSyncTableVO, checked: boolean) => {
  if (!table.fields) return
  
  table.fields.forEach(field => {
    field.selected = checked
  })
  checkAll.value[table.tableName] = checked
}

const updateCheckAllStatus = (table: QcBuilderSyncTableVO) => {
  if (!table.fields) return
  
  const selectedCount = getSelectedFieldCount(table)
  const totalCount = table.fields.length
  
  if (selectedCount === 0) {
    checkAll.value[table.tableName] = false
  } else if (selectedCount === totalCount) {
    checkAll.value[table.tableName] = true
  } else {
    checkAll.value[table.tableName] = false
  }
}

const emit = defineEmits(['success'])

defineExpose({ open })
</script>

<style scoped>
.import-steps {
  min-height: 500px;
}

.step-content {
  margin-top: 30px;
}

.step-panel {
  min-height: 400px;
}

.source-selection {
  text-align: center;
  padding: 40px 0;
}

.source-selection h3 {
  margin-bottom: 30px;
  font-size: 18px;
  color: #303133;
}

.source-description {
  max-width: 600px;
  margin: 0 auto;
}

.table-selection {
  padding: 20px 0;
}

.search-bar {
  display: flex;
  align-items: center;
}

.selection-info {
  text-align: right;
}

.import-settings {
  padding: 20px 0;
}

.import-settings h3 {
  margin-bottom: 20px;
  font-size: 16px;
  color: #303133;
}

.preview-section h4 {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}

.import-execution {
  padding: 20px 0;
}

.import-confirm {
  text-align: center;
  margin-bottom: 30px;
}

.import-progress {
  text-align: center;
}

.progress-info {
  color: #606266;
  font-size: 14px;
}

.import-result h4 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
}

.dialog-footer {
  text-align: right;
}

.field-selection {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin: 8px 0;
}

.field-selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.field-selection-header .el-checkbox {
  margin-right: 0;
}

.field-selection .el-table {
  background-color: white;
  border-radius: 4px;
}
</style>
