<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入测试数据"
    width="70%"
    :before-close="handleClose"
    destroy-on-close
    class="data-import-dialog"
  >
    <div class="import-container">
      <!-- 导入方式选择 -->
      <div class="import-method-section">
        <div class="section-header">
          <Icon icon="ep:upload" class="header-icon" />
          <span class="header-title">选择导入方式</span>
        </div>

        <el-radio-group v-model="importMethod" @change="handleMethodChange">
          <el-radio-button label="file">文件上传</el-radio-button>
          <el-radio-button label="paste">粘贴数据</el-radio-button>
          <el-radio-button label="database">数据库查询</el-radio-button>
          <el-radio-button label="api">API接口</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文件上传方式 -->
      <div v-if="importMethod === 'file'" class="file-upload-section">
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :accept="acceptedFileTypes"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            drag
            class="upload-dragger"
          >
            <Icon icon="ep:upload-filled" class="upload-icon" />
            <div class="upload-text">
              <p>将文件拖拽到此处，或<em>点击上传</em></p>
              <p class="upload-tip">支持 Excel (.xlsx, .xls), CSV (.csv), JSON (.json) 格式</p>
            </div>
          </el-upload>
        </div>

        <!-- 文件解析配置 -->
        <div v-if="uploadedFile" class="file-config">
          <div class="config-header">
            <Icon icon="ep:setting" class="header-icon" />
            <span>文件解析配置</span>
          </div>

          <el-form :model="fileConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="文件编码">
                  <el-select v-model="fileConfig.encoding">
                    <el-option label="UTF-8" value="utf-8" />
                    <el-option label="GBK" value="gbk" />
                    <el-option label="UTF-16" value="utf-16" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="isCSVFile">
                <el-form-item label="分隔符">
                  <el-select v-model="fileConfig.delimiter">
                    <el-option label="逗号 (,)" value="," />
                    <el-option label="分号 (;)" value=";" />
                    <el-option label="制表符" value="\t" />
                    <el-option label="竖线 (|)" value="|" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否包含标题行">
                  <el-switch v-model="fileConfig.hasHeader" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开始行号">
                  <el-input-number
                    v-model="fileConfig.startRow"
                    :min="1"
                    :max="1000"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="parse-actions">
            <el-button type="primary" @click="parseFile" :loading="parsing">
              <Icon icon="ep:cpu" class="mr-5px" />
              解析文件
            </el-button>
            <el-button @click="resetFileConfig">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置配置
            </el-button>
          </div>
        </div>
      </div>

      <!-- 粘贴数据方式 -->
      <div v-else-if="importMethod === 'paste'" class="paste-data-section">
        <div class="paste-config">
          <el-form :model="pasteConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="数据格式">
                  <el-select v-model="pasteConfig.format">
                    <el-option label="JSON" value="json" />
                    <el-option label="CSV" value="csv" />
                    <el-option label="表格数据" value="table" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="pasteConfig.format === 'csv'">
                <el-form-item label="分隔符">
                  <el-select v-model="pasteConfig.delimiter">
                    <el-option label="逗号 (,)" value="," />
                    <el-option label="制表符" value="\t" />
                    <el-option label="空格" value=" " />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="paste-area">
          <div class="paste-header">
            <span>粘贴数据内容</span>
            <el-button size="small" text @click="pasteFromClipboard">
              <Icon icon="ep:document-copy" class="mr-5px" />
              从剪贴板粘贴
            </el-button>
          </div>
          <el-input
            v-model="pasteData"
            type="textarea"
            :rows="8"
            placeholder="请粘贴数据内容..."
            @input="handlePasteInput"
          />
        </div>

        <div class="paste-actions">
          <el-button type="primary" @click="parsePasteData" :loading="parsing">
            <Icon icon="ep:cpu" class="mr-5px" />
            解析数据
          </el-button>
          <el-button @click="clearPasteData">
            <Icon icon="ep:delete" class="mr-5px" />
            清空
          </el-button>
        </div>
      </div>

      <!-- 数据库查询方式 -->
      <div v-else-if="importMethod === 'database'" class="database-query-section">
        <div class="database-config">
          <el-form :model="databaseConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="数据源">
                  <el-select v-model="databaseConfig.dataSource" placeholder="选择数据源">
                    <el-option
                      v-for="source in dataSources"
                      :key="source.id"
                      :label="source.name"
                      :value="source.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="表名">
                  <el-select v-model="databaseConfig.tableName" placeholder="选择表">
                    <el-option
                      v-for="table in availableTables"
                      :key="table.name"
                      :label="table.label"
                      :value="table.name"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="查询条件">
                  <el-input
                    v-model="databaseConfig.whereClause"
                    placeholder="输入WHERE条件，如：create_time >= '2024-01-01'"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="限制行数">
                  <el-input-number
                    v-model="databaseConfig.limit"
                    :min="1"
                    :max="10000"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="排序字段">
                  <el-input v-model="databaseConfig.orderBy" placeholder="如：create_time DESC" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="sql-preview">
          <div class="sql-header">
            <span>生成的SQL查询</span>
            <el-button size="small" text @click="copySQLQuery">
              <Icon icon="ep:document-copy" class="mr-5px" />
              复制SQL
            </el-button>
          </div>
          <div class="sql-content">
            <pre><code>{{ generateSQLQuery() }}</code></pre>
          </div>
        </div>

        <div class="database-actions">
          <el-button type="primary" @click="executeQuery" :loading="querying">
            <Icon icon="ep:search" class="mr-5px" />
            执行查询
          </el-button>
          <el-button @click="testConnection" :loading="testing">
            <Icon icon="ep:connection" class="mr-5px" />
            测试连接
          </el-button>
        </div>
      </div>

      <!-- API接口方式 -->
      <div v-else-if="importMethod === 'api'" class="api-request-section">
        <div class="api-config">
          <el-form :model="apiConfig" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="请求方法">
                  <el-select v-model="apiConfig.method">
                    <el-option label="GET" value="GET" />
                    <el-option label="POST" value="POST" />
                    <el-option label="PUT" value="PUT" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="API地址">
                  <el-input v-model="apiConfig.url" placeholder="输入API接口地址" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="请求头">
                  <div class="headers-editor">
                    <div
                      v-for="(header, index) in apiConfig.headers"
                      :key="index"
                      class="header-row"
                    >
                      <el-input v-model="header.key" placeholder="Header名称" class="header-key" />
                      <el-input
                        v-model="header.value"
                        placeholder="Header值"
                        class="header-value"
                      />
                      <el-button size="small" text type="danger" @click="removeHeader(index)">
                        <Icon icon="ep:delete" />
                      </el-button>
                    </div>
                    <el-button size="small" text @click="addHeader">
                      <Icon icon="ep:plus" class="mr-5px" />
                      添加Header
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24" v-if="apiConfig.method !== 'GET'">
                <el-form-item label="请求体">
                  <el-input
                    v-model="apiConfig.body"
                    type="textarea"
                    :rows="4"
                    placeholder="输入JSON格式的请求体"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="api-actions">
          <el-button type="primary" @click="sendAPIRequest" :loading="requesting">
            <Icon icon="ep:position" class="mr-5px" />
            发送请求
          </el-button>
          <el-button @click="saveAPITemplate">
            <Icon icon="ep:collection-tag" class="mr-5px" />
            保存模板
          </el-button>
        </div>
      </div>

      <!-- 数据预览区 -->
      <div v-if="previewData.length > 0" class="data-preview-section">
        <div class="section-header">
          <Icon icon="ep:view" class="header-icon" />
          <span class="header-title">数据预览</span>
          <el-tag size="small" type="info">{{ previewData.length }} 条记录</el-tag>
        </div>

        <!-- 字段映射配置 -->
        <div class="field-mapping">
          <div class="mapping-header">
            <span>字段映射配置</span>
            <el-button size="small" text @click="autoMapFields">
              <Icon icon="ep:magic-stick" class="mr-5px" />
              自动映射
            </el-button>
          </div>

          <div class="mapping-table">
            <el-table :data="fieldMappings" border stripe max-height="200">
              <el-table-column label="源字段" width="200">
                <template #default="{ row }">
                  <el-select v-model="row.sourceField" placeholder="选择源字段">
                    <el-option
                      v-for="field in sourceFields"
                      :key="field"
                      :label="field"
                      :value="field"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="目标字段" width="200">
                <template #default="{ row }">
                  <el-select v-model="row.targetField" placeholder="选择目标字段">
                    <el-option
                      v-for="field in targetFields"
                      :key="field.name"
                      :label="field.label"
                      :value="field.name"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="数据转换" width="150">
                <template #default="{ row }">
                  <el-select v-model="row.transform" placeholder="转换方式">
                    <el-option label="无转换" value="none" />
                    <el-option label="去除空格" value="trim" />
                    <el-option label="转大写" value="upper" />
                    <el-option label="转小写" value="lower" />
                    <el-option label="数字转换" value="number" />
                    <el-option label="日期转换" value="date" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="默认值" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.defaultValue" placeholder="默认值" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button size="small" text type="danger" @click="removeMapping($index)">
                    <Icon icon="ep:delete" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="mapping-actions">
            <el-button size="small" @click="addMapping">
              <Icon icon="ep:plus" class="mr-5px" />
              添加映射
            </el-button>
            <el-button size="small" @click="clearMappings">
              <Icon icon="ep:delete" class="mr-5px" />
              清空映射
            </el-button>
          </div>
        </div>

        <!-- 数据预览表格 -->
        <div class="preview-table">
          <el-table :data="previewData.slice(0, 10)" border stripe max-height="300">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column
              v-for="field in Object.keys(previewData[0] || {})"
              :key="field"
              :prop="field"
              :label="field"
              show-overflow-tooltip
              width="150"
            />
          </el-table>

          <div v-if="previewData.length > 10" class="preview-note">
            <Icon icon="ep:info-filled" class="note-icon" />
            <span>仅显示前10条数据，实际将导入 {{ previewData.length }} 条记录</span>
          </div>
        </div>

        <!-- 数据验证结果 -->
        <div v-if="validationErrors.length > 0" class="validation-errors">
          <div class="errors-header">
            <Icon icon="ep:warning-filled" class="error-icon" />
            <span>数据验证错误</span>
            <el-tag size="small" type="danger">{{ validationErrors.length }} 个错误</el-tag>
          </div>

          <div class="errors-list">
            <div v-for="error in validationErrors.slice(0, 5)" :key="error.id" class="error-item">
              <span class="error-row">第{{ error.row }}行：</span>
              <span class="error-message">{{ error.message }}</span>
            </div>
            <div v-if="validationErrors.length > 5" class="more-errors">
              还有 {{ validationErrors.length - 5 }} 个错误...
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <span v-if="previewData.length > 0" class="import-summary">
            准备导入 <strong>{{ previewData.length }}</strong> 条记录
          </span>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
            :disabled="previewData.length === 0 || validationErrors.length > 0"
          >
            <Icon icon="ep:check" class="mr-5px" />
            确认导入
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 组件引用
const uploadRef = ref()

// 导入方式
const importMethod = ref('file')

// 文件上传相关
const uploadedFile = ref(null)
const acceptedFileTypes = '.xlsx,.xls,.csv,.json'
const fileConfig = reactive({
  encoding: 'utf-8',
  delimiter: ',',
  hasHeader: true,
  startRow: 1
})

// 粘贴数据相关
const pasteData = ref('')
const pasteConfig = reactive({
  format: 'json',
  delimiter: ','
})

// 数据库查询相关
const databaseConfig = reactive({
  dataSource: '',
  tableName: '',
  whereClause: '',
  limit: 1000,
  orderBy: ''
})

// API请求相关
const apiConfig = reactive({
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '' }],
  body: ''
})

// 数据状态
const parsing = ref(false)
const querying = ref(false)
const testing = ref(false)
const requesting = ref(false)
const previewData = ref([])
const validationErrors = ref([])

// 字段映射
const fieldMappings = ref([])
const sourceFields = ref([])
const targetFields = ref([
  { name: 'ypid', label: '药品本位码' },
  { name: 'drug_name', label: '药品名称' },
  { name: 'manufacturer', label: '生产企业' },
  { name: 'specification', label: '规格' },
  { name: 'amount', label: '金额' },
  { name: 'quantity', label: '数量' }
])

// 数据源配置
const dataSources = ref([
  { id: 'main_db', name: '主数据库' },
  { id: 'backup_db', name: '备份数据库' },
  { id: 'test_db', name: '测试数据库' }
])

const availableTables = ref([
  { name: 'drug_list', label: '药品目录表' },
  { name: 'drug_inbound', label: '药品入库表' },
  { name: 'drug_outbound', label: '药品出库表' }
])

// 计算属性
const isCSVFile = computed(() => {
  return uploadedFile.value?.name.toLowerCase().endsWith('.csv')
})

// 方法切换处理
const handleMethodChange = (method: string) => {
  resetData()
}

// 文件处理
const handleFileChange = (file: any) => {
  uploadedFile.value = file
  resetFileConfig()
}

const handleFileRemove = () => {
  uploadedFile.value = null
  resetData()
}

const parseFile = async () => {
  if (!uploadedFile.value) return

  try {
    parsing.value = true

    const file = uploadedFile.value.raw
    const fileExtension = file.name.split('.').pop().toLowerCase()

    let data = []

    if (fileExtension === 'json') {
      data = await parseJSONFile(file)
    } else if (fileExtension === 'csv') {
      data = await parseCSVFile(file)
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      data = await parseExcelFile(file)
    }

    previewData.value = data
    extractSourceFields(data)
    autoMapFields()
    validateData(data)

    ElMessage.success(`成功解析 ${data.length} 条记录`)
  } catch (error: any) {
    ElMessage.error('文件解析失败: ' + error.message)
  } finally {
    parsing.value = false
  }
}

const parseJSONFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)
        resolve(Array.isArray(data) ? data : [data])
      } catch (error) {
        reject(new Error('JSON格式错误'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, fileConfig.encoding)
  })
}

const parseCSVFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((line) => line.trim())

        if (lines.length === 0) {
          resolve([])
          return
        }

        let startIndex = fileConfig.startRow - 1
        let headers: string[] = []

        if (fileConfig.hasHeader) {
          headers = lines[startIndex].split(fileConfig.delimiter).map((h) => h.trim())
          startIndex++
        } else {
          // 如果没有标题行，生成默认标题
          const firstLine = lines[startIndex].split(fileConfig.delimiter)
          headers = firstLine.map((_, index) => `列${index + 1}`)
        }

        const data = []
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(fileConfig.delimiter)
          const record: any = {}
          headers.forEach((header, index) => {
            record[header] = values[index]?.trim() || ''
          })
          data.push(record)
        }

        resolve(data)
      } catch (error) {
        reject(new Error('CSV解析错误'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, fileConfig.encoding)
  })
}

const parseExcelFile = async (file: File): Promise<any[]> => {
  // 简化的Excel解析，实际应该使用SheetJS等库
  return new Promise((resolve, reject) => {
    // 这里应该使用真正的Excel解析库
    resolve([
      { ypid: '123456789012', drug_name: '阿司匹林片', manufacturer: 'XX制药' },
      { ypid: '123456789013', drug_name: '布洛芬胶囊', manufacturer: 'YY制药' }
    ])
  })
}

// 粘贴数据处理
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    pasteData.value = text
    handlePasteInput()
  } catch (error) {
    ElMessage.error('无法访问剪贴板')
  }
}

const handlePasteInput = () => {
  // 实时验证粘贴的数据格式
}

const parsePasteData = async () => {
  if (!pasteData.value.trim()) {
    ElMessage.warning('请输入数据内容')
    return
  }

  try {
    parsing.value = true

    let data = []

    if (pasteConfig.format === 'json') {
      data = JSON.parse(pasteData.value)
      if (!Array.isArray(data)) {
        data = [data]
      }
    } else if (pasteConfig.format === 'csv') {
      const lines = pasteData.value.split('\n').filter((line) => line.trim())
      const headers = lines[0].split(pasteConfig.delimiter).map((h) => h.trim())

      data = lines.slice(1).map((line) => {
        const values = line.split(pasteConfig.delimiter)
        const record: any = {}
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || ''
        })
        return record
      })
    } else if (pasteConfig.format === 'table') {
      // 处理表格数据（制表符分隔）
      const lines = pasteData.value.split('\n').filter((line) => line.trim())
      const headers = lines[0].split('\t').map((h) => h.trim())

      data = lines.slice(1).map((line) => {
        const values = line.split('\t')
        const record: any = {}
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || ''
        })
        return record
      })
    }

    previewData.value = data
    extractSourceFields(data)
    autoMapFields()
    validateData(data)

    ElMessage.success(`成功解析 ${data.length} 条记录`)
  } catch (error: any) {
    ElMessage.error('数据解析失败: ' + error.message)
  } finally {
    parsing.value = false
  }
}

// 数据库查询处理
const generateSQLQuery = () => {
  if (!databaseConfig.tableName) return 'SELECT * FROM table_name'

  let sql = `SELECT * FROM ${databaseConfig.tableName}`

  if (databaseConfig.whereClause) {
    sql += ` WHERE ${databaseConfig.whereClause}`
  }

  if (databaseConfig.orderBy) {
    sql += ` ORDER BY ${databaseConfig.orderBy}`
  }

  if (databaseConfig.limit) {
    sql += ` LIMIT ${databaseConfig.limit}`
  }

  return sql
}

const executeQuery = async () => {
  try {
    querying.value = true

    // 模拟数据库查询
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const data = [
      { ypid: '123456789012', drug_name: '阿司匹林片', manufacturer: 'XX制药', amount: 100.5 },
      { ypid: '123456789013', drug_name: '布洛芬胶囊', manufacturer: 'YY制药', amount: 89.0 }
    ]

    previewData.value = data
    extractSourceFields(data)
    autoMapFields()
    validateData(data)

    ElMessage.success(`查询成功，获取 ${data.length} 条记录`)
  } catch (error: any) {
    ElMessage.error('查询失败: ' + error.message)
  } finally {
    querying.value = false
  }
}

const testConnection = async () => {
  try {
    testing.value = true

    // 模拟连接测试
    await new Promise((resolve) => setTimeout(resolve, 500))

    ElMessage.success('数据库连接正常')
  } catch (error: any) {
    ElMessage.error('连接失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// API请求处理
const sendAPIRequest = async () => {
  try {
    requesting.value = true

    const headers: any = {}
    apiConfig.headers.forEach((header) => {
      if (header.key && header.value) {
        headers[header.key] = header.value
      }
    })

    const options: any = {
      method: apiConfig.method,
      headers
    }

    if (apiConfig.method !== 'GET' && apiConfig.body) {
      options.body = apiConfig.body
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(apiConfig.url, options)
    const data = await response.json()

    previewData.value = Array.isArray(data) ? data : [data]
    extractSourceFields(previewData.value)
    autoMapFields()
    validateData(previewData.value)

    ElMessage.success(`API请求成功，获取 ${previewData.value.length} 条记录`)
  } catch (error: any) {
    ElMessage.error('API请求失败: ' + error.message)
  } finally {
    requesting.value = false
  }
}

// 字段映射处理
const extractSourceFields = (data: any[]) => {
  if (data.length > 0) {
    sourceFields.value = Object.keys(data[0])
  }
}

const autoMapFields = () => {
  fieldMappings.value = sourceFields.value.map((sourceField) => {
    // 自动匹配目标字段
    const targetField = targetFields.value.find(
      (tf) =>
        tf.name === sourceField ||
        tf.label === sourceField ||
        sourceField.toLowerCase().includes(tf.name.toLowerCase())
    )

    return {
      sourceField,
      targetField: targetField?.name || '',
      transform: 'none',
      defaultValue: ''
    }
  })
}

const addMapping = () => {
  fieldMappings.value.push({
    sourceField: '',
    targetField: '',
    transform: 'none',
    defaultValue: ''
  })
}

const removeMapping = (index: number) => {
  fieldMappings.value.splice(index, 1)
}

const clearMappings = () => {
  fieldMappings.value = []
}

// API配置处理
const addHeader = () => {
  apiConfig.headers.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  apiConfig.headers.splice(index, 1)
}

// 数据验证
const validateData = (data: any[]) => {
  validationErrors.value = []

  data.forEach((record, index) => {
    // 验证必填字段
    if (!record.ypid) {
      validationErrors.value.push({
        id: `${index}-ypid`,
        row: index + 1,
        field: 'ypid',
        message: 'YPID不能为空'
      })
    } else if (!/^\d{12}$/.test(record.ypid)) {
      validationErrors.value.push({
        id: `${index}-ypid-format`,
        row: index + 1,
        field: 'ypid',
        message: 'YPID必须是12位数字'
      })
    }

    if (!record.drug_name) {
      validationErrors.value.push({
        id: `${index}-drug_name`,
        row: index + 1,
        field: 'drug_name',
        message: '药品名称不能为空'
      })
    }
  })
}

// 工具方法
const resetData = () => {
  previewData.value = []
  validationErrors.value = []
  fieldMappings.value = []
  sourceFields.value = []
}

const resetFileConfig = () => {
  fileConfig.encoding = 'utf-8'
  fileConfig.delimiter = ','
  fileConfig.hasHeader = true
  fileConfig.startRow = 1
}

const clearPasteData = () => {
  pasteData.value = ''
  resetData()
}

const copySQLQuery = async () => {
  try {
    await navigator.clipboard.writeText(generateSQLQuery())
    ElMessage.success('SQL已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const saveAPITemplate = () => {
  ElMessage.info('API模板保存功能开发中...')
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  if (previewData.value.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  if (validationErrors.value.length > 0) {
    ElMessage.error('存在数据验证错误，请修正后重试')
    return
  }

  // 应用字段映射转换数据
  const transformedData = previewData.value.map((record) => {
    const newRecord: any = {}

    fieldMappings.value.forEach((mapping) => {
      if (mapping.sourceField && mapping.targetField) {
        let value = record[mapping.sourceField] || mapping.defaultValue

        // 应用数据转换
        switch (mapping.transform) {
          case 'trim':
            value = String(value).trim()
            break
          case 'upper':
            value = String(value).toUpperCase()
            break
          case 'lower':
            value = String(value).toLowerCase()
            break
          case 'number':
            value = Number(value) || 0
            break
          case 'date':
            value = new Date(value).toISOString().split('T')[0]
            break
        }

        newRecord[mapping.targetField] = value
      }
    })

    return newRecord
  })

  emit('confirm', transformedData)
  handleClose()
}
</script>

<style lang="scss" scoped>
.data-import-dialog {
  .import-container {
    max-height: 70vh;
    overflow-y: auto;

    .import-method-section,
    .file-upload-section,
    .paste-data-section,
    .database-query-section,
    .api-request-section,
    .data-preview-section {
      margin-bottom: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .header-icon {
        color: #409eff;
      }

      .header-title {
        flex: 1;
      }
    }

    .import-method-section {
      padding: 16px;
      border: none;

      :deep(.el-radio-button__inner) {
        padding: 8px 16px;
      }
    }

    .file-upload-section {
      .upload-area {
        padding: 20px;

        .upload-dragger {
          width: 100%;

          .upload-icon {
            font-size: 48px;
            color: #c0c4cc;
            margin-bottom: 16px;
          }

          .upload-text {
            color: #606266;

            p {
              margin: 0;
              line-height: 1.4;
            }

            .upload-tip {
              font-size: 13px;
              color: #909399;
              margin-top: 8px;
            }

            em {
              font-style: normal;
              color: #409eff;
            }
          }
        }
      }

      .file-config {
        border-top: 1px solid #e4e7ed;
        padding: 16px;

        .config-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 500;

          .header-icon {
            color: #409eff;
          }
        }

        .parse-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 16px;
        }
      }
    }

    .paste-data-section {
      padding: 16px;

      .paste-config {
        margin-bottom: 16px;
      }

      .paste-area {
        margin-bottom: 16px;

        .paste-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
        }
      }

      .paste-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }

    .database-query-section {
      padding: 16px;

      .database-config {
        margin-bottom: 16px;
      }

      .sql-preview {
        margin-bottom: 16px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;

        .sql-header {
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #e4e7ed;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
        }

        .sql-content {
          padding: 12px;
          background: #2d3748;
          color: #e2e8f0;

          pre code {
            font-family: 'Fira Code', Consolas, monospace;
            line-height: 1.4;
          }
        }
      }

      .database-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }

    .api-request-section {
      padding: 16px;

      .api-config {
        margin-bottom: 16px;

        .headers-editor {
          .header-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: center;

            .header-key,
            .header-value {
              flex: 1;
            }
          }
        }
      }

      .api-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }

    .data-preview-section {
      .field-mapping {
        padding: 16px;
        border-bottom: 1px solid #e4e7ed;

        .mapping-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .mapping-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 12px;
        }
      }

      .preview-table {
        padding: 16px;

        .preview-note {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 12px;
          background: #e7f3ff;
          border-radius: 6px;
          font-size: 13px;
          color: #606266;

          .note-icon {
            color: #409eff;
          }
        }
      }

      .validation-errors {
        padding: 16px;
        border-top: 1px solid #e4e7ed;
        background: #fef0f0;

        .errors-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 500;

          .error-icon {
            color: #f56c6c;
          }
        }

        .errors-list {
          .error-item {
            margin-bottom: 4px;
            font-size: 13px;

            .error-row {
              color: #909399;
            }

            .error-message {
              color: #f56c6c;
            }
          }

          .more-errors {
            color: #909399;
            font-size: 13px;
            margin-top: 8px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      .import-summary {
        color: #606266;
        font-size: 14px;

        strong {
          color: #409eff;
        }
      }
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .data-import-dialog {
    .import-container {
      .file-config,
      .paste-data-section,
      .database-query-section,
      .api-request-section {
        .el-row .el-col {
          margin-bottom: 12px;
        }
      }

      .field-mapping .mapping-table {
        overflow-x: auto;
      }

      .api-config .headers-editor .header-row {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .footer-left,
      .footer-right {
        justify-content: center;
      }
    }
  }
}
</style>
