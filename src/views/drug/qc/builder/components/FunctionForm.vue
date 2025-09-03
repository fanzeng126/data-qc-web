<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px" :close-on-click-modal="false">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="函数名" prop="functionName">
                <el-input
                  v-model="formData.functionName"
                  placeholder="请输入函数名，如：COUNT"
                  :disabled="formType === 'update' && formData.isSystem === 1"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="中文名称" prop="chineseName">
                <el-input v-model="formData.chineseName" placeholder="请输入中文名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="函数分类" prop="functionCategory">
                <el-select
                  v-model="formData.functionCategory"
                  placeholder="请选择函数分类"
                  class="w-full"
                >
                  <el-option label="统计函数" value="STATISTICS" />
                  <el-option label="字符串函数" value="STRING" />
                  <el-option label="数值函数" value="NUMERIC" />
                  <el-option label="日期函数" value="TIME" />
                  <el-option label="空值检查" value="NULL_CHECK" />
                  <el-option label="分析函数" value="ANALYSIS" />
                  <el-option label="自定义函数" value="CUSTOM" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="函数级别" prop="functionLevel">
                <el-select
                  v-model="formData.functionLevel"
                  placeholder="请选择函数级别"
                  class="w-full"
                >
                  <el-option label="记录维度" value="RECORD_LEVEL" />
                  <el-option label="聚合维度" value="AGGREGATE_LEVEL" />
                  <el-option label="混合维度" value="MIXED_LEVEL" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="函数描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入函数描述信息"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-row :gutter="30">
            <el-col :span="10">
              <el-form-item label="实现类型" prop="implementationType">
                <el-select
                  v-model="formData.implementationType"
                  placeholder="请选择实现类型"
                  class="w-full"
                  @change="handleImplementationTypeChange"
                >
                  <el-option label="内置函数" :value="1" />
                  <el-option label="自定义函数" :value="2" />
                  <el-option label="SQL函数" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="排序" prop="sortOrder">
                <el-input-number
                  v-model="formData.sortOrder"
                  :min="0"
                  :max="9999"
                  placeholder="排序值"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="是否启用" prop="isActive">
                <el-switch
                  v-model="formData.isActive"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 参数配置 -->
        <el-tab-pane label="参数配置" name="parameters">
          <div class="parameter-config">
            <div class="config-header mb-4">
              <h4>函数参数配置</h4>
              <el-button size="small" @click="addParameter">
                <Icon icon="ep:plus" class="mr-1" />
                添加参数
              </el-button>
            </div>

            <el-table :data="parameterList" border size="small">
              <el-table-column label="参数名" width="150">
                <template #default="{ row }">
                  <el-input v-model="row.name" placeholder="参数名" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="参数类型" width="150">
                <template #default="{ row }">
                  <el-select v-model="row.type" placeholder="参数类型" size="small" class="w-full">
                    <el-option label="字段" value="field" />
                    <el-option label="字符串" value="string" />
                    <el-option label="数值" value="number" />
                    <el-option label="字段数组" value="field[]" />
                    <el-option label="表" value="table" />
                    <el-option label="表达式" value="expression" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="是否必需" width="100">
                <template #default="{ row }">
                  <el-switch v-model="row.required" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="默认值" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.default" placeholder="默认值" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="参数描述" min-width="200">
                <template #default="{ row }">
                  <el-input v-model="row.description" placeholder="参数描述" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button link type="danger" size="small" @click="removeParameter($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 返回值配置 -->
            <div class="return-config mt-6">
              <div class="return-variables">
                <div class="config-header mb-2">
                  <span>返回变量</span>
                  <el-button size="small" @click="addReturnVariable">
                    <Icon icon="ep:plus" class="mr-1" />
                    添加变量
                  </el-button>
                </div>

                <el-table :data="returnVariableList" border size="small">
                  <el-table-column label="变量名" width="120">
                    <template #default="{ row }">
                      <el-input v-model="row.key" placeholder="变量名" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="变量类型" width="120">
                    <template #default="{ row }">
                      <el-select v-model="row.type" placeholder="变量类型" size="small" class="w-full">
                        <el-option label="字符串" value="STRING" />
                        <el-option label="数值" value="number" />
                        <el-option label="布尔值" value="BOOLEAN" />
                        <el-option label="数组" value="ARRAY" />
                        <el-option label="对象" value="OBJECT" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量描述" min-width="160">
                    <template #default="{ row }">
                      <el-input v-model="row.description" placeholder="变量描述" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ $index }">
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="removeReturnVariable($index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 实现配置 -->
        <el-tab-pane label="实现配置" name="implementation">
          <el-form-item
            v-if="formData.implementationType === 1"
            label="实现类"
            prop="implementationClass"
          >
            <el-input
              v-model="formData.implementationClass"
              placeholder="请输入实现类全路径，如：com.drug.qc.function.CountFunction"
            />
          </el-form-item>

          <el-form-item v-if="formData.implementationType === 3" label="SQL模板" prop="sqlTemplate">
            <el-input
              v-model="formData.sqlTemplate"
              type="textarea"
              :rows="6"
              placeholder="请输入SQL模板，使用${参数名}表示参数，如：SELECT COUNT(${field}) FROM ${table}"
            />
          </el-form-item>

          <el-form-item label="使用示例" prop="usageExample">
            <el-input
              v-model="formData.usageExample"
              placeholder="请输入使用示例，如：COUNT(drug_list.id)"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcFunctionConfigApi, QcFunctionConfigVO } from '@/api/drug/qc/builder'

defineOptions({ name: 'FunctionForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('basic') // 当前激活的标签页

const formData = ref({
  id: undefined,
  functionName: undefined,
  functionCategory: undefined,
  chineseName: undefined,
  description: undefined,
  parameterConfig: undefined,
  returnConfig: undefined,
  implementationType: 1,
  implementationClass: undefined,
  sqlTemplate: undefined,
  usageExample: undefined,
  functionLevel: 'RECORD_LEVEL',
  isSystem: 0,
  isActive: 1,
  sortOrder: 0
})

// 参数列表
const parameterList = ref<any[]>([])
// 返回值配置
// 返回变量列表
const returnVariableList = ref<any[]>([])

const formRules = reactive({
  functionName: [
    { required: true, message: '函数名不能为空', trigger: 'blur' },
    {
      pattern: /^[A-Z_][A-Z0-9_]*$/,
      message: '函数名只能包含大写字母、数字和下划线，必须以字母或下划线开头',
      trigger: 'blur'
    }
  ],
  chineseName: [
    { required: true, message: '中文名称不能为空', trigger: 'blur' },
    { min: 2, max: 200, message: '中文名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  functionCategory: [{ required: true, message: '请选择函数分类', trigger: 'change' }],
  implementationType: [{ required: true, message: '请选择实现类型', trigger: 'change' }],
  functionLevel: [{ required: true, message: '请选择函数级别', trigger: 'change' }]
})

const formRef = ref() // 表单 Ref

// 实现类型变化处理
const handleImplementationTypeChange = (type: number) => {
  if (type === 1) {
    formData.value.sqlTemplate = undefined
  } else if (type === 3) {
    formData.value.implementationClass = undefined
  }
}

// 添加参数
const addParameter = () => {
  parameterList.value.push({
    name: '',
    type: 'field',
    required: true,
    default: '',
    description: ''
  })
}

// 移除参数
const removeParameter = (index: number) => {
  parameterList.value.splice(index, 1)
}

// 添加返回变量
const addReturnVariable = () => {
  returnVariableList.value.push({
    key: '',
    type: 'STRING',
    description: ''
  })
}

// 移除返回变量
const removeReturnVariable = (index: number) => {
  returnVariableList.value.splice(index, 1)
}

// 构建参数配置JSON
const buildParameterConfig = () => {
  return {
    parameters: parameterList.value.filter((param) => param.name)
  }
}

// 构建返回值配置JSON
const buildReturnConfig = () => {
  // 构建新格式的返回值配置
  const variables: Record<string, { type: string; description: string }> = {}
  returnVariableList.value.forEach((variable) => {
    if (variable.key) {
      variables[variable.key] = {
        type: variable.type || 'STRING',
        description: variable.description || ''
      }
    }
  })

  return {
    variables
  }
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
      returnVariableList.value = variableEntries.map(([key, varInfo]) => ({
        key,
        type: (varInfo as any).type || 'STRING',
        description: (varInfo as any).description || ''
      }))
    } else {
      returnVariableList.value = []
    }
  } catch (error) {
    console.warn('解析返回值配置失败：', error)
    returnVariableList.value = []
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增函数' : '编辑函数'
  formType.value = type
  activeTab.value = 'basic'
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QcFunctionConfigApi.getQcFunctionConfig(id)
      formData.value = data

      // 解析配置数据
      if (data.parameterConfig) {
        parseParameterConfig(data.parameterConfig)
      }
      if (data.returnConfig) {
        parseReturnConfig(data.returnConfig)
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()

  // 构建配置JSON
  formData.value.parameterConfig = JSON.stringify(buildParameterConfig())
  formData.value.returnConfig = JSON.stringify(buildReturnConfig())

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcFunctionConfigVO
    if (formType.value === 'create') {
      await QcFunctionConfigApi.createQcFunctionConfig(data)
      message.success('创建成功')
    } else {
      await QcFunctionConfigApi.updateQcFunctionConfig(data)
      message.success('更新成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    functionName: undefined,
    functionCategory: undefined,
    chineseName: undefined,
    description: undefined,
    parameterConfig: undefined,
    returnConfig: undefined,
    implementationType: 1,
    implementationClass: undefined,
    sqlTemplate: undefined,
    usageExample: undefined,
    functionLevel: 'RECORD_LEVEL',
    isSystem: 0,
    isActive: 1,
    sortOrder: 0
  }

  parameterList.value = []
  returnVariableList.value = []

  formRef.value?.resetFields()
}
</script>

<style scoped>
.parameter-config {
  padding: 0;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.return-config {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.return-variables {
  margin-top: 16px;
}
</style>
