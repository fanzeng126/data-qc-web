<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="关联YPID版本表ID" prop="versionId">
        <el-input v-model="formData.versionId" placeholder="请输入关联YPID版本表ID" />
      </el-form-item>
      <el-form-item label="国家药管平台药品编码（YPID）" prop="ypid">
        <el-input v-model="formData.ypid" placeholder="请输入国家药管平台药品编码（YPID）" />
      </el-form-item>
      <el-form-item label="国家医保药品编码" prop="medicalInsuranceCode">
        <el-input v-model="formData.medicalInsuranceCode" placeholder="请输入国家医保药品编码" />
      </el-form-item>
      <el-form-item label="药品本位码" prop="drugCode">
        <el-input v-model="formData.drugCode" placeholder="请输入药品本位码" />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="formData.productName" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="标化产品名称" prop="standardProductName">
        <el-input v-model="formData.standardProductName" placeholder="请输入标化产品名称" />
      </el-form-item>
      <el-form-item label="通用名（中文）" prop="genericNameCn">
        <el-input v-model="formData.genericNameCn" placeholder="请输入通用名（中文）" />
      </el-form-item>
      <el-form-item label="通用名（英文）" prop="genericNameEn">
        <el-input v-model="formData.genericNameEn" placeholder="请输入通用名（英文）" />
      </el-form-item>
      <el-form-item label="商品名" prop="tradeName">
        <el-input v-model="formData.tradeName" placeholder="请输入商品名" />
      </el-form-item>
      <el-form-item label="商品名（英文）" prop="tradeNameEn">
        <el-input v-model="formData.tradeNameEn" placeholder="请输入商品名（英文）" />
      </el-form-item>
      <el-form-item label="生产企业名称" prop="manufacturerName">
        <el-input v-model="formData.manufacturerName" placeholder="请输入生产企业名称" />
      </el-form-item>
      <el-form-item label="生产企业编码" prop="manufacturerCode">
        <el-input v-model="formData.manufacturerCode" placeholder="请输入生产企业编码" />
      </el-form-item>
      <el-form-item label="上市许可持有人" prop="licenseHolder">
        <el-input v-model="formData.licenseHolder" placeholder="请输入上市许可持有人" />
      </el-form-item>
      <el-form-item label="批准文号" prop="approvalNumber">
        <el-input v-model="formData.approvalNumber" placeholder="请输入批准文号" />
      </el-form-item>
      <el-form-item label="剂型名称" prop="dosageForm">
        <el-input v-model="formData.dosageForm" placeholder="请输入剂型名称" />
      </el-form-item>
      <el-form-item label="剂型分类码" prop="dosageFormCode">
        <el-input v-model="formData.dosageFormCode" placeholder="请输入剂型分类码" />
      </el-form-item>
      <el-form-item label="制剂规格" prop="specification">
        <el-input v-model="formData.specification" placeholder="请输入制剂规格" />
      </el-form-item>
      <el-form-item label="规格标化" prop="standardSpecification">
        <el-input v-model="formData.standardSpecification" placeholder="请输入规格标化" />
      </el-form-item>
      <el-form-item label="制剂单位" prop="dosageUnit">
        <el-input v-model="formData.dosageUnit" placeholder="请输入制剂单位" />
      </el-form-item>
      <el-form-item label="最小销售包装单位" prop="minPackageUnit">
        <el-input v-model="formData.minPackageUnit" placeholder="请输入最小销售包装单位" />
      </el-form-item>
      <el-form-item label="转换系数" prop="conversionFactor">
        <el-input v-model="formData.conversionFactor" placeholder="请输入转换系数" />
      </el-form-item>
      <el-form-item label="是否基本药物:0-否,1-是" prop="isBasicDrug">
        <el-input v-model="formData.isBasicDrug" placeholder="请输入是否基本药物:0-否,1-是" />
      </el-form-item>
      <el-form-item label="药品类别" prop="drugCategory">
        <el-input v-model="formData.drugCategory" placeholder="请输入药品类别" />
      </el-form-item>
      <el-form-item label="药理/功效分类" prop="pharmacologyCategory">
        <el-input v-model="formData.pharmacologyCategory" placeholder="请输入药理/功效分类" />
      </el-form-item>
      <el-form-item label="医保甲乙类" prop="medicalInsuranceType">
        <el-select v-model="formData.medicalInsuranceType" placeholder="请选择医保甲乙类">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="医保编号" prop="medicalInsuranceNumber">
        <el-input v-model="formData.medicalInsuranceNumber" placeholder="请输入医保编号" />
      </el-form-item>
      <el-form-item label="是否集中采购:0-否,1-是" prop="isCentralizedProcurement">
        <el-input
          v-model="formData.isCentralizedProcurement"
          placeholder="请输入是否集中采购:0-否,1-是"
        />
      </el-form-item>
      <el-form-item label="是否通过一致性评价:0-否,1-是" prop="isConsistencyEvaluation">
        <el-input
          v-model="formData.isConsistencyEvaluation"
          placeholder="请输入是否通过一致性评价:0-否,1-是"
        />
      </el-form-item>
      <el-form-item label="是否进口药:0-否,1-是" prop="isImportedDrug">
        <el-input v-model="formData.isImportedDrug" placeholder="请输入是否进口药:0-否,1-是" />
      </el-form-item>
      <el-form-item label="状态:1-启用,2-停用,3-已删除" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生效日期" prop="effectiveDate">
        <el-date-picker
          v-model="formData.effectiveDate"
          type="date"
          value-format="x"
          placeholder="选择生效日期"
        />
      </el-form-item>
      <el-form-item label="失效日期" prop="expiryDate">
        <el-date-picker
          v-model="formData.expiryDate"
          type="date"
          value-format="x"
          placeholder="选择失效日期"
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
import { StandardLibraryApi, StandardLibraryVO } from '@/api/drug/ypid/standardlibrary'

/** 药品标准库 表单 */
defineOptions({ name: 'StandardLibraryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  versionId: undefined,
  ypid: undefined,
  medicalInsuranceCode: undefined,
  drugCode: undefined,
  productName: undefined,
  standardProductName: undefined,
  genericNameCn: undefined,
  genericNameEn: undefined,
  tradeName: undefined,
  tradeNameEn: undefined,
  manufacturerName: undefined,
  manufacturerCode: undefined,
  licenseHolder: undefined,
  approvalNumber: undefined,
  dosageForm: undefined,
  dosageFormCode: undefined,
  specification: undefined,
  standardSpecification: undefined,
  dosageUnit: undefined,
  minPackageUnit: undefined,
  conversionFactor: undefined,
  isBasicDrug: undefined,
  drugCategory: undefined,
  pharmacologyCategory: undefined,
  medicalInsuranceType: undefined,
  medicalInsuranceNumber: undefined,
  isCentralizedProcurement: undefined,
  isConsistencyEvaluation: undefined,
  isImportedDrug: undefined,
  status: undefined,
  effectiveDate: undefined,
  expiryDate: undefined
})
const formRules = reactive({
  versionId: [{ required: true, message: '关联YPID版本表ID不能为空', trigger: 'blur' }],
  ypid: [{ required: true, message: '国家药管平台药品编码（YPID）不能为空', trigger: 'blur' }],
  productName: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  genericNameCn: [{ required: true, message: '通用名（中文）不能为空', trigger: 'blur' }],
  manufacturerName: [{ required: true, message: '生产企业名称不能为空', trigger: 'blur' }],
  approvalNumber: [{ required: true, message: '批准文号不能为空', trigger: 'blur' }],
  dosageForm: [{ required: true, message: '剂型名称不能为空', trigger: 'blur' }],
  specification: [{ required: true, message: '制剂规格不能为空', trigger: 'blur' }],
  conversionFactor: [{ required: true, message: '转换系数不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态:1-启用,2-停用,3-已删除不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StandardLibraryApi.getStandardLibrary(id)
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
    const data = formData.value as unknown as StandardLibraryVO
    if (formType.value === 'create') {
      await StandardLibraryApi.createStandardLibrary(data)
      message.success(t('common.createSuccess'))
    } else {
      await StandardLibraryApi.updateStandardLibrary(data)
      message.success(t('common.updateSuccess'))
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
    versionId: undefined,
    ypid: undefined,
    medicalInsuranceCode: undefined,
    drugCode: undefined,
    productName: undefined,
    standardProductName: undefined,
    genericNameCn: undefined,
    genericNameEn: undefined,
    tradeName: undefined,
    tradeNameEn: undefined,
    manufacturerName: undefined,
    manufacturerCode: undefined,
    licenseHolder: undefined,
    approvalNumber: undefined,
    dosageForm: undefined,
    dosageFormCode: undefined,
    specification: undefined,
    standardSpecification: undefined,
    dosageUnit: undefined,
    minPackageUnit: undefined,
    conversionFactor: undefined,
    isBasicDrug: undefined,
    drugCategory: undefined,
    pharmacologyCategory: undefined,
    medicalInsuranceType: undefined,
    medicalInsuranceNumber: undefined,
    isCentralizedProcurement: undefined,
    isConsistencyEvaluation: undefined,
    isImportedDrug: undefined,
    status: undefined,
    effectiveDate: undefined,
    expiryDate: undefined
  }
  formRef.value?.resetFields()
}
</script>
