<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="操作符符号" prop="operatorSymbol">
            <el-input
              v-model="formData.operatorSymbol"
              placeholder="请输入操作符符号，如：="
              maxlength="20"
            />
            <div class="mt-1 text-xs text-gray-500"> 示例：=、!=、&gt;、&lt;、AND、OR等 </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="操作符名称" prop="operatorName">
            <el-input v-model="formData.operatorName" placeholder="请输入操作符名称，如：EQUALS" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="操作符分类" prop="operatorCategory">
            <el-select
              v-model="formData.operatorCategory"
              placeholder="请选择操作符分类"
              class="w-full"
            >
              <el-option label="比较操作符" value="COMPARISON" />
              <el-option label="逻辑操作符" value="LOGICAL" />
              <el-option label="算术操作符" value="ARITHMETIC" />
              <el-option label="集合操作符" value="SET" />
              <el-option label="模糊匹配" value="PATTERN" />
              <el-option label="范围操作符" value="RANGE" />
              <el-option label="空值检查" value="NULL_CHECK" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="中文名称" prop="chineseName">
            <el-input v-model="formData.chineseName" placeholder="请输入中文名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入操作符描述信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="优先级" prop="precedence">
            <el-input-number
              v-model="formData.precedence"
              :min="1"
              :max="10"
              placeholder="优先级"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500"> 数值越大优先级越高 </div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="结合性" prop="associativity">
            <el-select v-model="formData.associativity" placeholder="请选择结合性" class="w-full">
              <el-option label="左结合" value="LEFT" />
              <el-option label="右结合" value="RIGHT" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="操作数数量" prop="operandCount">
            <el-input-number
              v-model="formData.operandCount"
              :min="1"
              :max="3"
              placeholder="操作数数量"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="支持的数据类型" prop="supportedTypes">
        <div class="supported-types-config">
          <el-checkbox-group v-model="selectedTypes">
            <el-checkbox label="STRING">字符串</el-checkbox>
            <el-checkbox label="INTEGER">整数</el-checkbox>
            <el-checkbox label="DECIMAL">小数</el-checkbox>
            <el-checkbox label="DATE">日期</el-checkbox>
            <el-checkbox label="BOOLEAN">布尔值</el-checkbox>
            <el-checkbox label="ALL">所有类型</el-checkbox>
          </el-checkbox-group>
          <div class="mt-2 text-xs text-gray-500">
            选择该操作符支持的数据类型，用于表达式构建时的类型检查
          </div>
        </div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
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
        <el-col :span="12">
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

      <!-- 预览区域 -->
      <el-form-item label="操作符预览">
        <div class="operator-preview">
          <div class="preview-item">
            <span class="preview-label">符号：</span>
            <el-tag type="primary" size="large" class="operator-symbol">
              {{ formData.operatorSymbol || '?' }}
            </el-tag>
          </div>
          <div class="preview-item">
            <span class="preview-label">中文：</span>
            <span class="preview-value">{{ formData.chineseName || '未设置' }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">分类：</span>
            <el-tag :type="getCategoryColor(formData.operatorCategory)" size="small">
              {{ getCategoryName(formData.operatorCategory) }}
            </el-tag>
          </div>
          <div class="preview-item">
            <span class="preview-label">优先级：</span>
            <el-badge
              :value="formData.precedence || 0"
              :type="getPrecedenceType(formData.precedence || 0)"
            />
          </div>
          <div class="preview-item">
            <span class="preview-label">结合性：</span>
            <el-tag :type="formData.associativity === 'LEFT' ? 'success' : 'warning'" size="small">
              {{
                formData.associativity === 'LEFT'
                  ? '左结合'
                  : formData.associativity === 'RIGHT'
                    ? '右结合'
                    : '未设置'
              }}
            </el-tag>
          </div>
          <div class="preview-item">
            <span class="preview-label">操作数：</span>
            <el-badge :value="formData.operandCount || 0" type="primary" />
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcOperatorConfigApi, QcOperatorConfigVO } from '@/api/drug/qc/builder'

defineOptions({ name: 'OperatorForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  operatorSymbol: undefined,
  operatorName: undefined,
  operatorCategory: undefined,
  chineseName: undefined,
  description: undefined,
  precedence: 1,
  associativity: 'LEFT',
  operandCount: 2,
  supportedTypes: undefined,
  isActive: 1,
  sortOrder: 0
})

// 选中的数据类型
const selectedTypes = ref<string[]>([])

const formRules = reactive({
  operatorSymbol: [
    { required: true, message: '操作符符号不能为空', trigger: 'blur' },
    { max: 20, message: '操作符符号长度不能超过 20 个字符', trigger: 'blur' }
  ],
  operatorName: [
    { required: true, message: '操作符名称不能为空', trigger: 'blur' },
    {
      pattern: /^[A-Z_][A-Z0-9_]*$/,
      message: '操作符名称只能包含大写字母、数字和下划线，必须以字母或下划线开头',
      trigger: 'blur'
    }
  ],
  operatorCategory: [{ required: true, message: '请选择操作符分类', trigger: 'change' }],
  chineseName: [
    { required: true, message: '中文名称不能为空', trigger: 'blur' },
    { min: 2, max: 100, message: '中文名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  precedence: [{ required: true, message: '优先级不能为空', trigger: 'blur' }],
  associativity: [{ required: true, message: '请选择结合性', trigger: 'change' }],
  operandCount: [{ required: true, message: '操作数数量不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref

// 获取分类名称
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    COMPARISON: '比较',
    LOGICAL: '逻辑',
    ARITHMETIC: '算术',
    SET: '集合',
    PATTERN: '模糊匹配',
    RANGE: '范围',
    NULL_CHECK: '空值检查'
  }
  return categoryMap[category] || '未设置'
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    COMPARISON: 'primary',
    LOGICAL: 'success',
    ARITHMETIC: 'warning',
    SET: 'info',
    PATTERN: 'danger',
    RANGE: 'info',
    NULL_CHECK: 'danger'
  }
  return colorMap[category] || 'info'
}

// 获取优先级类型
const getPrecedenceType = (precedence: number) => {
  if (precedence >= 6) return 'danger' // 高优先级
  if (precedence >= 4) return 'warning' // 中优先级
  return 'primary' // 低优先级
}

// 处理支持类型变化
watch(
  selectedTypes,
  (newTypes) => {
    formData.value.supportedTypes = JSON.stringify(newTypes)
  },
  { deep: true }
)

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增操作符' : '编辑操作符'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QcOperatorConfigApi.getQcOperatorConfig(id)
      formData.value = data

      // 解析支持的数据类型
      try {
        selectedTypes.value = JSON.parse(data.supportedTypes || '[]')
      } catch (error) {
        selectedTypes.value = []
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

  // 校验支持的数据类型
  if (selectedTypes.value.length === 0) {
    message.error('请至少选择一种支持的数据类型')
    return
  }

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcOperatorConfigVO
    if (formType.value === 'create') {
      await QcOperatorConfigApi.createQcOperatorConfig(data)
      message.success('创建成功')
    } else {
      await QcOperatorConfigApi.updateQcOperatorConfig(data)
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
    operatorSymbol: undefined,
    operatorName: undefined,
    operatorCategory: undefined,
    chineseName: undefined,
    description: undefined,
    precedence: 1,
    associativity: 'LEFT',
    operandCount: 2,
    supportedTypes: undefined,
    isActive: 1,
    sortOrder: 0
  }

  selectedTypes.value = []
  formRef.value?.resetFields()
}
</script>

<style scoped>
.supported-types-config {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.operator-preview {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #b3d8ff;
}

.preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-weight: 500;
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.preview-value {
  color: #303133;
}

.operator-symbol {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: bold;
  font-size: 14px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}
</style>
