<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <!-- Institution Information -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><School /></el-icon>
          机构信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="医疗机构代码" prop="hospitalCode">
              <el-input
                v-model="formData.hospitalCode"
                placeholder="22位医疗机构代码"
                maxlength="22"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="组织机构代码" prop="organizationCode">
              <el-input
                v-model="formData.organizationCode"
                placeholder="9位组织机构代码"
                maxlength="9"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="机构名称" prop="organizationName">
              <el-input
                v-model="formData.organizationName"
                placeholder="组织机构名称"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="行政区划代码" prop="domainCode">
              <el-input v-model="formData.domainCode" placeholder="6位省级代码" maxlength="6">
                <template #prepend>省级</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="导入任务ID" prop="taskId">
              <el-input-number
                v-model="formData.taskId"
                placeholder="导入任务ID"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Drug Identification -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Key /></el-icon>
          药品标识信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="药品编码(YPID)" prop="ypid">
              <el-input v-model="formData.ypid" placeholder="国家药管平台编码" maxlength="30">
                <template #append>
                  <el-tooltip content="国家药管平台统一编码" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="院内药品码" prop="hospitalDrugId">
              <el-input
                v-model="formData.hospitalDrugId"
                placeholder="院内药品唯一码"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="省采购平台码" prop="provinceDrugId">
              <el-input
                v-model="formData.provinceDrugId"
                placeholder="省级集采平台编码"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批准文号" prop="approvalNumber">
              <el-input
                v-model="formData.approvalNumber"
                placeholder="国药准字..."
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="YPID匹配状态" prop="ypidMatchStatus">
              <el-select
                v-model="formData.ypidMatchStatus"
                placeholder="选择匹配状态"
                style="width: 100%"
              >
                <el-option label="未匹配" :value="0">
                  <span style="display: flex; align-items: center">
                    <el-icon style="margin-right: 8px"><Remove /></el-icon>
                    未匹配
                  </span>
                </el-option>
                <el-option label="自动匹配" :value="1">
                  <span style="display: flex; align-items: center">
                    <el-icon style="margin-right: 8px; color: #67c23a"><CircleCheck /></el-icon>
                    自动匹配
                  </span>
                </el-option>
                <el-option label="手动匹配" :value="2">
                  <span style="display: flex; align-items: center">
                    <el-icon style="margin-right: 8px; color: #409eff"><Edit /></el-icon>
                    手动匹配
                  </span>
                </el-option>
                <el-option label="匹配失败" :value="3">
                  <span style="display: flex; align-items: center">
                    <el-icon style="margin-right: 8px; color: #f56c6c"><CircleClose /></el-icon>
                    匹配失败
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Drug Name Information -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Memo /></el-icon>
          药品名称信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="通用名" prop="drugName">
              <el-input
                v-model="formData.drugName"
                placeholder="药品通用名（不含剂型）"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="formData.productName" placeholder="完整产品名称" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名" prop="tradeName">
              <el-input v-model="formData.tradeName" placeholder="商品名（中文）" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名(英文)" prop="tradeNameEn">
              <el-input
                v-model="formData.tradeNameEn"
                placeholder="商品名（英文）"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="生产企业" prop="manufacturer">
              <el-input
                v-model="formData.manufacturer"
                placeholder="生产企业全称"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Drug Specifications -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Files /></el-icon>
          药品规格信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="剂型名称" prop="drugForm">
              <el-input
                v-model="formData.drugForm"
                placeholder="片剂/胶囊剂/注射液等"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制剂规格" prop="drugSpec">
              <el-input v-model="formData.drugSpec" placeholder="如：10mg" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制剂单位" prop="dosageUnit">
              <el-input v-model="formData.dosageUnit" placeholder="片/粒/支/瓶等" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包装单位" prop="packUnit">
              <el-input v-model="formData.packUnit" placeholder="盒/瓶/袋等" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转换系数" prop="conversionFactor">
              <el-input-number
                v-model="formData.conversionFactor"
                placeholder="包装单位与制剂单位转换系数"
                :min="1"
                :precision="0"
                style="width: 100%"
              >
                <template #append>
                  <el-tooltip content="每包装单位包含的制剂单位数量" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Drug Properties -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Flag /></el-icon>
          药品属性
        </div>
        <el-row :gutter="20">
          <!--          <el-col :span="8">
            <el-form-item label="集中采购药品" prop="isCentralizedPurchase">
              <el-radio-group v-model="formData.isCentralizedPurchase">
                <el-radio :label="1">
                  <el-tag type="primary" effect="plain">是</el-tag>
                </el-radio>
                <el-radio :label="2">
                  <el-tag type="info" effect="plain">否</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>-->
          <el-col :span="8">
            <el-form-item label="基本药物" prop="isBasicDrug">
              <el-radio-group v-model="formData.isBasicDrug">
                <el-radio :label="1">
                  <el-tag type="success" effect="plain">是</el-tag>
                </el-radio>
                <el-radio :label="2">
                  <el-tag type="info" effect="plain">否</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <!--
          <el-col :span="8">
            <el-form-item label="一致性评价" prop="isConsistencyEvaluation">
              <el-radio-group v-model="formData.isConsistencyEvaluation">
                <el-radio :label="1">
                  <el-tag type="warning" effect="plain">通过</el-tag>
                </el-radio>
                <el-radio :label="2">
                  <el-tag type="info" effect="plain">未通过</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
-->
        </el-row>
      </div>

      <!-- Quality Control Information -->
      <div class="form-section" v-if="formType === 'update'">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon>
          质控信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="质控状态" prop="qcStatus">
              <el-select v-model="formData.qcStatus" placeholder="选择质控状态" style="width: 100%">
                <el-option label="未质控" :value="0">
                  <el-tag type="info">未质控</el-tag>
                </el-option>
                <el-option label="质控通过" :value="1">
                  <el-tag type="success">质控通过</el-tag>
                </el-option>
                <el-option label="质控失败" :value="2">
                  <el-tag type="danger">质控失败</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="错误信息" prop="errorMessage">
              <el-input
                v-model="formData.errorMessage"
                placeholder="质控失败时的错误信息"
                :disabled="formData.qcStatus !== 2"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="质控结果详情" prop="qcResult">
              <el-input
                v-model="formData.qcResult"
                type="textarea"
                :rows="3"
                placeholder="JSON格式的质控结果详情"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button @click="resetForm" v-if="formType === 'create'">重 置</el-button>
        <el-button @click="submitForm" type="primary" :loading="formLoading">
          {{ formLoading ? '提交中...' : '确 定' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { CatalogApi, CatalogVO } from '@/api/drug/data/catalog'
import {
  School,
  Key,
  Memo,
  Files,
  Flag,
  CircleCheck,
  QuestionFilled,
  Remove,
  Edit,
  CircleClose
} from '@element-plus/icons-vue'

/** Drug Catalog Form */
defineOptions({ name: 'CatalogForm' })

const { t } = useI18n()
const message = useMessage()

// ==================== Reactive Data ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  taskId: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined,
  ypid: undefined,
  hospitalDrugId: undefined,
  provinceDrugId: undefined,
  approvalNumber: undefined,
  drugName: undefined,
  productName: undefined,
  tradeName: undefined,
  tradeNameEn: undefined,
  manufacturer: undefined,
  drugForm: undefined,
  drugSpec: undefined,
  dosageUnit: undefined,
  packUnit: undefined,
  conversionFactor: undefined,
  isCentralizedPurchase: 2,
  isBasicDrug: 2,
  isConsistencyEvaluation: 2,
  qcStatus: 0,
  qcResult: undefined,
  errorMessage: undefined,
  ypidMatchStatus: 0
})

// ==================== Form Validation Rules ====================
const formRules = reactive({
  hospitalCode: [
    { required: true, message: '医疗机构代码不能为空', trigger: 'blur' },
    { len: 22, message: '医疗机构代码必须为22位', trigger: 'blur' }
  ],
  organizationCode: [
    { required: true, message: '组织机构代码不能为空', trigger: 'blur' },
    { len: 9, message: '组织机构代码必须为9位', trigger: 'blur' }
  ],
  organizationName: [
    { required: true, message: '组织机构名称不能为空', trigger: 'blur' },
    { max: 100, message: '组织机构名称不能超过100个字符', trigger: 'blur' }
  ],
  domainCode: [
    { required: true, message: '省级行政区划代码不能为空', trigger: 'blur' },
    { len: 6, message: '行政区划代码必须为6位', trigger: 'blur' }
  ],
  ypid: [{ required: true, message: '国家药管平台药品编码不能为空', trigger: 'blur' }],
  hospitalDrugId: [{ required: true, message: '院内药品唯一码不能为空', trigger: 'blur' }],
  drugName: [
    { required: true, message: '品种通用名不能为空', trigger: 'blur' },
    { max: 200, message: '品种通用名不能超过200个字符', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '产品名称不能为空', trigger: 'blur' },
    { max: 200, message: '产品名称不能超过200个字符', trigger: 'blur' }
  ],
  manufacturer: [{ max: 200, message: '生产企业名称不能超过200个字符', trigger: 'blur' }],
  drugForm: [{ max: 50, message: '剂型名称不能超过50个字符', trigger: 'blur' }],
  drugSpec: [{ max: 100, message: '制剂规格不能超过100个字符', trigger: 'blur' }],
  dosageUnit: [
    { required: true, message: '制剂单位不能为空', trigger: 'blur' },
    { max: 20, message: '制剂单位不能超过20个字符', trigger: 'blur' }
  ],
  packUnit: [
    { required: true, message: '最小销售包装单位不能为空', trigger: 'blur' },
    { max: 20, message: '包装单位不能超过20个字符', trigger: 'blur' }
  ],
  conversionFactor: [
    { required: true, message: '转换系数不能为空', trigger: 'blur' },
    { type: 'number', min: 1, message: '转换系数必须大于0', trigger: 'blur' }
  ],
  isCentralizedPurchase: [
    { required: true, message: '请选择是否为集中采购药品', trigger: 'change' }
  ],
  isBasicDrug: [{ required: true, message: '请选择是否为基本药物', trigger: 'change' }],
  isConsistencyEvaluation: [
    { required: true, message: '请选择是否通过一致性评价', trigger: 'change' }
  ],
  taskId: [{ required: true, message: '导入任务ID不能为空', trigger: 'blur' }],
  ypidMatchStatus: [{ required: true, message: 'YPID匹配状态不能为空', trigger: 'change' }]
})

const formRef = ref()

// ==================== Methods ====================

/** Open dialog */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增药品目录' : '编辑药品目录'
  formType.value = type
  resetForm()

  // Load data for update
  if (id) {
    formLoading.value = true
    try {
      formData.value = await CatalogApi.getCatalog(id)
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open })

/** Submit form */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // Validate form
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // Submit request
  formLoading.value = true
  try {
    const data = formData.value as unknown as CatalogVO

    if (formType.value === 'create') {
      await CatalogApi.createCatalog(data)
      message.success('创建成功')
    } else {
      await CatalogApi.updateCatalog(data)
      message.success('更新成功')
    }

    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** Reset form */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskId: undefined,
    organizationCode: undefined,
    hospitalCode: undefined,
    organizationName: undefined,
    domainCode: undefined,
    ypid: undefined,
    hospitalDrugId: undefined,
    provinceDrugId: undefined,
    approvalNumber: undefined,
    drugName: undefined,
    productName: undefined,
    tradeName: undefined,
    tradeNameEn: undefined,
    manufacturer: undefined,
    drugForm: undefined,
    drugSpec: undefined,
    dosageUnit: undefined,
    packUnit: undefined,
    conversionFactor: undefined,
    isCentralizedPurchase: 2,
    isBasicDrug: 2,
    isConsistencyEvaluation: 2,
    qcStatus: 0,
    qcResult: undefined,
    errorMessage: undefined,
    ypidMatchStatus: 0
  }
  formRef.value?.resetFields()
}
</script>

<style scoped>
.form-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-title .el-icon {
  font-size: 18px;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Input styles */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding-right: 50px;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

/* Form item styles */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

/* Radio group styles */
:deep(.el-radio-group) {
  display: flex;
  gap: 20px;
}

:deep(.el-radio) {
  margin-right: 0;
}

/* Responsive layout */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
  }

  .el-row .el-col {
    margin-bottom: 10px;
  }
}
</style>
