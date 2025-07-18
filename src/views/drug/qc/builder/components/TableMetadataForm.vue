<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="所属分类" prop="categoryId">
        <el-select v-model="formData.categoryId" placeholder="请选择数据源分类" class="w-full">
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

      <el-form-item label="表名" prop="tableName">
        <el-input v-model="formData.tableName" placeholder="请输入表名，如：drug_list" />
      </el-form-item>

      <el-form-item label="中文名称" prop="chineseName">
        <el-input v-model="formData.chineseName" placeholder="请输入中文名称" />
      </el-form-item>

      <el-form-item label="表说明" prop="tableComment">
        <el-input
          v-model="formData.tableComment"
          type="textarea"
          :rows="3"
          placeholder="请输入表说明信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="同步来源" prop="syncSource">
        <el-select v-model="formData.syncSource" placeholder="请选择同步来源" class="w-full">
          <el-option label="导入模板" :value="1" />
          <el-option label="数据库表" :value="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="来源引用" prop="sourceReference">
        <el-input
          v-model="formData.sourceReference"
          placeholder="如：药品目录导入模板.xlsx 或 drug_list"
        />
        <div class="mt-1 text-xs text-gray-500"> 导入模板：Excel文件名；数据库表：实际表名 </div>
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
import {
  QcBuilderTableMetadataApi,
  QcBuilderTableMetadataVO,
  QcBuilderDatasourceCategoryVO
} from '@/api/drug/qc/builder'

defineOptions({ name: 'TableMetadataForm' })

interface Props {
  categoryList: QcBuilderDatasourceCategoryVO[]
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
  categoryId: undefined,
  tableName: undefined,
  chineseName: undefined,
  tableComment: undefined,
  syncSource: undefined,
  sourceReference: undefined,
  isActive: 1 // 默认启用
})

const formRules = reactive({
  categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
  tableName: [
    { required: true, message: '表名不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '表名必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  chineseName: [
    { required: true, message: '中文名称不能为空', trigger: 'blur' },
    { min: 2, max: 200, message: '中文名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  syncSource: [{ required: true, message: '请选择同步来源', trigger: 'change' }],
  sourceReference: [
    { required: true, message: '来源引用不能为空', trigger: 'blur' },
    { max: 200, message: '来源引用长度不能超过 200 个字符', trigger: 'blur' }
  ]
})

const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增表元数据' : '编辑表元数据'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcBuilderTableMetadataApi.getQcBuilderTableMetadata(id)
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
    const data = formData.value as unknown as QcBuilderTableMetadataVO
    if (formType.value === 'create') {
      await QcBuilderTableMetadataApi.createQcBuilderTableMetadata(data)
      message.success('创建成功')
    } else {
      await QcBuilderTableMetadataApi.updateQcBuilderTableMetadata(data)
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
    categoryId: undefined,
    tableName: undefined,
    chineseName: undefined,
    tableComment: undefined,
    syncSource: undefined,
    sourceReference: undefined,
    isActive: 1 // 默认启用
  }
  formRef.value?.resetFields()
}
</script>
