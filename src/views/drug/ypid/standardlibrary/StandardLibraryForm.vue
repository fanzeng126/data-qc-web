<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="YPID" prop="ypid">
            <el-input v-model="formData.ypid" placeholder="请输入YPID" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医保药品编码" prop="medicalInsuranceCode">
            <el-input v-model="formData.medicalInsuranceCode" placeholder="请输入医保药品编码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品名称" prop="productName">
            <el-input v-model="formData.productName" placeholder="请输入产品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标化产品名称" prop="standardProductName">
            <el-input v-model="formData.standardProductName" placeholder="请输入标化产品名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="通用名" prop="genericNameCn">
            <el-input v-model="formData.genericNameCn" placeholder="请输入通用名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品名" prop="tradeName">
            <el-input v-model="formData.tradeName" placeholder="请输入商品名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="生产企业" prop="manufacturerName">
            <el-input v-model="formData.manufacturerName" placeholder="请输入生产企业" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批准文号" prop="approvalNumber">
            <el-input v-model="formData.approvalNumber" placeholder="请输入批准文号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="剂型" prop="dosageForm">
            <el-input v-model="formData.dosageForm" placeholder="请输入剂型" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="规格" prop="specification">
            <el-input v-model="formData.specification" placeholder="请输入规格" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转换系数" prop="conversionFactor">
            <el-input-number v-model="formData.conversionFactor" :precision="4" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="基本药物">
            <el-radio-group v-model="formData.isBasicDrug">
              <el-radio :value="0">否</el-radio>
              <el-radio :value="1">是</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="集中采购">
            <el-radio-group v-model="formData.isCentralizedProcurement">
              <el-radio :value="0">否</el-radio>
              <el-radio :value="1">是</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="2">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { StandardLibraryApi, StandardLibraryVO } from '@/api/drug/ypid/standardlibrary'

defineOptions({ name: 'StandardLibraryForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const currentVersionId = ref<number>()

const formData = ref({
  id: undefined,
  versionId: undefined,
  ypid: undefined,
  medicalInsuranceCode: undefined,
  productName: undefined,
  standardProductName: undefined,
  genericNameCn: undefined,
  tradeName: undefined,
  manufacturerName: undefined,
  approvalNumber: undefined,
  dosageForm: undefined,
  specification: undefined,
  conversionFactor: undefined,
  isBasicDrug: 0,
  isCentralizedProcurement: 0,
  status: 1
})

const formRules = reactive({
  ypid: [{ required: true, message: 'YPID不能为空', trigger: 'blur' }],
  productName: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  genericNameCn: [{ required: true, message: '通用名不能为空', trigger: 'blur' }],
  manufacturerName: [{ required: true, message: '生产企业不能为空', trigger: 'blur' }],
  approvalNumber: [{ required: true, message: '批准文号不能为空', trigger: 'blur' }],
  dosageForm: [{ required: true, message: '剂型不能为空', trigger: 'blur' }],
  specification: [{ required: true, message: '规格不能为空', trigger: 'blur' }],
  conversionFactor: [{ required: true, message: '转换系数不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})

const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number, versionId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  currentVersionId.value = versionId
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StandardLibraryApi.getStandardLibrary(id)
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时设置默认版本ID
    formData.value.versionId = versionId
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as StandardLibraryVO
    if (formType.value === 'create') {
      await StandardLibraryApi.createStandardLibrary(data)
      message.success(t('common.createSuccess'))
    } else {
      await StandardLibraryApi.updateStandardLibrary(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    versionId: currentVersionId.value,
    ypid: undefined,
    medicalInsuranceCode: undefined,
    productName: undefined,
    standardProductName: undefined,
    genericNameCn: undefined,
    tradeName: undefined,
    manufacturerName: undefined,
    approvalNumber: undefined,
    dosageForm: undefined,
    specification: undefined,
    conversionFactor: undefined,
    isBasicDrug: 0,
    isCentralizedProcurement: 0,
    status: 1
  }
  formRef.value?.resetFields()
}
</script>
