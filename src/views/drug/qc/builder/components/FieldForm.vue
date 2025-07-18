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
          <el-form-item label="字段名" prop="fieldName">
            <el-input v-model="formData.fieldName" placeholder="请输入字段名，如：drug_name" />
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
          <el-form-item label="数据类型" prop="dataType">
            <el-select
              v-model="formData.dataType"
              placeholder="请选择数据类型"
              class="w-full"
              @change="handleDataTypeChange"
            >
              <el-option label="VARCHAR - 可变长字符串" value="VARCHAR" />
              <el-option label="INT - 整数" value="INT" />
              <el-option label="BIGINT - 长整数" value="BIGINT" />
              <el-option label="DECIMAL - 小数" value="DECIMAL" />
              <el-option label="DATE - 日期" value="DATE" />
              <el-option label="DATETIME - 日期时间" value="DATETIME" />
              <el-option label="TEXT - 长文本" value="TEXT" />
              <el-option label="TINYINT - 小整数" value="TINYINT" />
              <el-option label="FLOAT - 浮点数" value="FLOAT" />
              <el-option label="DOUBLE - 双精度浮点数" value="DOUBLE" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大长度" prop="maxLength">
            <el-input-number
              v-model="formData.maxLength"
              :min="1"
              :max="65535"
              placeholder="字段最大长度"
              class="w-full"
              :disabled="!needLength"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="是否可空" prop="isNullable">
            <el-switch
              v-model="formData.isNullable"
              :active-value="1"
              :inactive-value="0"
              active-text="可空"
              inactive-text="不可空"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否主键" prop="isPrimaryKey">
            <el-switch
              v-model="formData.isPrimaryKey"
              :active-value="1"
              :inactive-value="0"
              active-text="主键"
              inactive-text="非主键"
              @change="handlePrimaryKeyChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否必填" prop="isRequired">
            <el-switch
              v-model="formData.isRequired"
              :active-value="1"
              :inactive-value="0"
              active-text="必填"
              inactive-text="非必填"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="默认值" prop="defaultValue">
            <el-input v-model="formData.defaultValue" placeholder="请输入默认值（可选）" />
          </el-form-item>
        </el-col>
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
      </el-row>

      <el-form-item label="字段说明" prop="fieldComment">
        <el-input
          v-model="formData.fieldComment"
          type="textarea"
          :rows="2"
          placeholder="请输入字段说明"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="业务含义" prop="businessMeaning">
        <el-input
          v-model="formData.businessMeaning"
          type="textarea"
          :rows="3"
          placeholder="请输入字段的业务含义，便于质控规则配置时理解"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="是否启用" prop="isActive">
        <el-switch
          v-model="formData.isActive"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcBuilderFieldMetadataApi, QcBuilderFieldMetadataVO } from '@/api/drug/qc/builder'

defineOptions({ name: 'FieldForm' })

interface Props {
  tableId?: number
}

const props = defineProps<Props>()
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  tableId: undefined,
  fieldName: undefined,
  chineseName: undefined,
  dataType: 'VARCHAR',
  maxLength: 255,
  isNullable: 1,
  isPrimaryKey: 0,
  isRequired: 0,
  defaultValue: undefined,
  fieldComment: undefined,
  businessMeaning: undefined,
  sortOrder: 0,
  isActive: 1
})

// 是否需要长度设置
const needLength = computed(() => {
  return ['VARCHAR', 'CHAR', 'DECIMAL'].includes(formData.value.dataType)
})

const formRules = reactive({
  fieldName: [
    { required: true, message: '字段名不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '字段名必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  chineseName: [
    { required: true, message: '中文名称不能为空', trigger: 'blur' },
    { min: 2, max: 200, message: '中文名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  maxLength: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (needLength.value && (!value || value < 1)) {
          callback(new Error('请设置字段长度'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  sortOrder: [{ required: true, message: '排序不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref

// 数据类型变化处理
const handleDataTypeChange = (dataType: string) => {
  // 根据数据类型设置默认长度
  const lengthMap: Record<string, number> = {
    VARCHAR: 255,
    CHAR: 50,
    TEXT: 65535,
    INT: 11,
    BIGINT: 20,
    DECIMAL: 10,
    TINYINT: 4
  }

  if (lengthMap[dataType]) {
    formData.value.maxLength = lengthMap[dataType]
  }

  // 某些类型不需要长度
  if (!needLength.value) {
    formData.value.maxLength = undefined
  }
}

// 主键变化处理
const handlePrimaryKeyChange = (isPrimaryKey: number) => {
  if (isPrimaryKey === 1) {
    // 主键字段通常不能为空且必填
    formData.value.isNullable = 0
    formData.value.isRequired = 1
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增字段' : '编辑字段'
  formType.value = type
  resetForm()

  // 设置表ID
  if (props.tableId) {
    formData.value.tableId = props.tableId
  }

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcBuilderFieldMetadataApi.getQcBuilderFieldMetadata(id)
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

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcBuilderFieldMetadataVO
    if (formType.value === 'create') {
      await QcBuilderFieldMetadataApi.createQcBuilderFieldMetadata(data)
      message.success('创建成功')
    } else {
      await QcBuilderFieldMetadataApi.updateQcBuilderFieldMetadata(data)
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
    tableId: props.tableId,
    fieldName: undefined,
    chineseName: undefined,
    dataType: 'VARCHAR',
    maxLength: 255,
    isNullable: 1,
    isPrimaryKey: 0,
    isRequired: 0,
    defaultValue: undefined,
    fieldComment: undefined,
    businessMeaning: undefined,
    sortOrder: 0,
    isActive: 1
  }
  formRef.value?.resetFields()
}
</script>
