<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="药品名称" prop="drugName">
        <el-input v-model="formData.drugName" placeholder="请输入药品名称" />
      </el-form-item>
      <el-form-item label="剂型" prop="dosageForm">
        <el-input v-model="formData.dosageForm" placeholder="请输入剂型，如：片剂、注射剂等" />
      </el-form-item>
      <el-form-item label="最小剂量单位" prop="dosageUnit">
        <el-input v-model="formData.dosageUnit" placeholder="请输入最小剂量单位，如：片、支、mg等" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number 
          v-model="formData.sortOrder" 
          :min="0"
          :max="9999"
          placeholder="请输入排序数值"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DrugConfigApi, type DrugConfigVO } from '@/api/shortage'

/** 专区药品配置 表单 */
defineOptions({ name: 'DrugConfigForm' })

const message = useMessage() // 消息弹窗

// Props
const props = defineProps<{
  zoneId?: number
}>()

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneId: undefined,
  drugName: '',
  dosageForm: '',
  dosageUnit: '',
  status: 1,
  sortOrder: 0,
})

const formRules = reactive({
  drugName: [{ required: true, message: '药品名称不能为空', trigger: 'blur' }],
  dosageForm: [{ required: true, message: '剂型不能为空', trigger: 'blur' }],
  dosageUnit: [{ required: true, message: '最小剂量单位不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增药品配置' : '编辑药品配置'
  formType.value = type
  resetForm()
  
  // 设置专区ID
  if (props.zoneId) {
    formData.value.zoneId = props.zoneId
  }
  
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await DrugConfigApi.get(id)
      Object.assign(formData.value, data)
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
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as DrugConfigVO
    if (formType.value === 'create') {
      await DrugConfigApi.create(data)
      message.success('创建成功')
    } else {
      await DrugConfigApi.update(data)
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
    zoneId: props.zoneId,
    drugName: '',
    dosageForm: '',
    dosageUnit: '',
    status: 1,
    sortOrder: 0,
  }
  formRef.value?.resetFields()
}
</script>