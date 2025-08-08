<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          基本信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医疗机构代码" prop="hospitalCode">
              <el-input
                v-model="formData.hospitalCode"
                placeholder="请输入22位医疗机构代码"
                maxlength="22"
                show-word-limit
              >
                <template #append>
                  <el-tooltip content="22位统一社会信用代码" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织机构代码" prop="organizationCode">
              <el-input
                v-model="formData.organizationCode"
                placeholder="请输入9位组织机构代码"
                maxlength="9"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机构名称" prop="organizationName">
              <el-input
                v-model="formData.organizationName"
                placeholder="请输入组织机构名称"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行政区划代码" prop="domainCode">
              <el-input
                v-model="formData.domainCode"
                placeholder="请输入6位省级行政区划代码"
                maxlength="6"
              >
                <template #prepend>省级</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位负责人" prop="unitManager">
              <el-input
                v-model="formData.unitManager"
                placeholder="请输入单位负责人姓名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统计负责人" prop="statisticsManager">
              <el-input
                v-model="formData.statisticsManager"
                placeholder="请输入统计负责人姓名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据上报日期" prop="uploadDate">
              <el-date-picker
                v-model="formData.uploadDate"
                type="date"
                placeholder="选择上报日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="导入任务ID" prop="taskId">
              <el-input-number
                v-model="formData.taskId"
                placeholder="请输入导入任务ID"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 医疗资源信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><User /></el-icon>
          医疗资源信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="实有床位数" prop="bedCount">
              <el-input-number
                v-model="formData.bedCount"
                placeholder="请输入床位数"
                :min="0"
                :max="99999"
                style="width: 100%"
              >
                <template #append>张</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <!--          <el-col :span="8">
            <el-form-item label="执业医师数" prop="doctorCount">
              <el-input-number
                v-model="formData.doctorCount"
                placeholder="请输入执业医师数"
                :min="0"
                :max="99999"
                style="width: 100%"
              >
                <template #append>人</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="助理医师数" prop="assistantDoctorCount">
              <el-input-number
                v-model="formData.assistantDoctorCount"
                placeholder="请输入助理医师数"
                :min="0"
                :max="99999"
                style="width: 100%"
              >
                <template #append>人</template>
              </el-input-number>
            </el-form-item>
          </el-col>-->
        </el-row>
      </div>

      <!-- 诊疗服务信息 -->
      <!--      <div class="form-section">
        <div class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          诊疗服务信息
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总诊疗人次数" prop="visitCount">
              <el-input-number
                v-model="formData.visitCount"
                placeholder="请输入年度总诊疗人次"
                :min="0"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>人次</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出院人数" prop="dischargeCount">
              <el-input-number
                v-model="formData.dischargeCount"
                placeholder="请输入年度出院人数"
                :min="0"
                :precision="0"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #append>人</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </div>-->

      <!-- 药品收入信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Money /></el-icon>
          药品收入信息
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="年度药品总收入" prop="annualDrugIncomeImport">
              <el-input-number
                v-model="formData.annualDrugIncomeImport"
                placeholder="请输入年度药品总收入"
                :min="0"
                :precision="2"
                :controls-position="'right'"
                style="width: 100%"
              >
                <template #prepend>¥</template>
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <!--        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中药饮片采购额" prop="ypPurchaseAmount">
              <el-input-number
                v-model="formData.ypPurchaseAmount"
                placeholder="请输入采购额"
                :min="0"
                :precision="2"
                style="width: 100%"
              >
                <template #prepend>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中药饮片销售额" prop="ypSellAmount">
              <el-input-number
                v-model="formData.ypSellAmount"
                placeholder="请输入销售额"
                :min="0"
                :precision="2"
                style="width: 100%"
              >
                <template #prepend>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中药颗粒剂采购额" prop="klPurchaseAmount">
              <el-input-number
                v-model="formData.klPurchaseAmount"
                placeholder="请输入采购额"
                :min="0"
                :precision="2"
                style="width: 100%"
              >
                <template #prepend>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中药颗粒剂销售额" prop="klSellAmount">
              <el-input-number
                v-model="formData.klSellAmount"
                placeholder="请输入销售额"
                :min="0"
                :precision="2"
                style="width: 100%"
              >
                <template #prepend>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>-->
      </div>

      <!-- 质控信息 -->
      <div class="form-section" v-if="formType === 'update'">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon>
          质控信息
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="质控状态" prop="qcStatus">
              <el-select
                v-model="formData.qcStatus"
                placeholder="请选择质控状态"
                style="width: 100%"
              >
                <el-option label="未质控" :value="0" />
                <el-option label="质控通过" :value="1" />
                <el-option label="质控失败" :value="2" />
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
import { HospitalInfoApi, HospitalInfoVO } from '@/api/drug/data/hospital'
import {
  Document,
  User,
  DataAnalysis,
  Money,
  CircleCheck,
  QuestionFilled
} from '@element-plus/icons-vue'

/** 医疗机构基本情况 表单 */
defineOptions({ name: 'HospitalInfoForm' })

const { t } = useI18n()
const message = useMessage()

// ==================== 响应式数据 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  taskId: undefined,
  uploadDate: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  unitManager: undefined,
  statisticsManager: undefined,
  domainCode: undefined,
  bedCount: undefined,
  doctorCount: undefined,
  assistantDoctorCount: undefined,
  visitCount: undefined,
  dischargeCount: undefined,
  annualDrugIncomeImport: undefined,
  ypPurchaseAmount: undefined,
  ypSellAmount: undefined,
  klPurchaseAmount: undefined,
  klSellAmount: undefined,
  qcStatus: 0,
  qcResult: undefined,
  errorMessage: undefined
})

// ==================== 表单验证规则 ====================
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
  uploadDate: [{ required: true, message: '数据上报日期不能为空', trigger: 'change' }],
  bedCount: [
    { required: true, message: '实有床位数不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '床位数不能为负数', trigger: 'blur' }
  ],
  doctorCount: [
    { required: true, message: '执业医师数不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '医师数不能为负数', trigger: 'blur' }
  ],
  assistantDoctorCount: [
    { required: true, message: '执业助理医师数不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '助理医师数不能为负数', trigger: 'blur' }
  ],
  visitCount: [
    { required: true, message: '总诊疗人次数不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '诊疗人次不能为负数', trigger: 'blur' }
  ],
  dischargeCount: [
    { required: true, message: '出院人数不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '出院人数不能为负数', trigger: 'blur' }
  ],
  annualDrugIncomeImport: [
    { required: true, message: '年度药品总收入不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '收入金额不能为负数', trigger: 'blur' }
  ],
  ypPurchaseAmount: [
    { required: true, message: '中药饮片总采购额不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '采购额不能为负数', trigger: 'blur' }
  ],
  ypSellAmount: [
    { required: true, message: '中药饮片总销售额不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售额不能为负数', trigger: 'blur' }
  ],
  klPurchaseAmount: [
    { required: true, message: '中药颗粒剂总采购额不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '采购额不能为负数', trigger: 'blur' }
  ],
  klSellAmount: [
    { required: true, message: '中药颗粒剂总销售额不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售额不能为负数', trigger: 'blur' }
  ]
})

const formRef = ref()

// ==================== 方法定义 ====================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增医疗机构' : '编辑医疗机构'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await HospitalInfoApi.getHospitalInfo(id)
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as HospitalInfoVO

    if (formType.value === 'create') {
      await HospitalInfoApi.createHospitalInfo(data)
      message.success('创建成功')
    } else {
      await HospitalInfoApi.updateHospitalInfo(data)
      message.success('更新成功')
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
    taskId: undefined,
    uploadDate: undefined,
    organizationCode: undefined,
    hospitalCode: undefined,
    organizationName: undefined,
    unitManager: undefined,
    statisticsManager: undefined,
    domainCode: undefined,
    bedCount: undefined,
    doctorCount: undefined,
    assistantDoctorCount: undefined,
    visitCount: undefined,
    dischargeCount: undefined,
    annualDrugIncomeImport: undefined,
    ypPurchaseAmount: undefined,
    ypSellAmount: undefined,
    klPurchaseAmount: undefined,
    klSellAmount: undefined,
    qcStatus: 0,
    qcResult: undefined,
    errorMessage: undefined
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

/* 输入框样式优化 */
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

/* 表单项样式调整 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

/* 响应式布局 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
  }

  .el-row .el-col {
    margin-bottom: 10px;
  }
}
</style>
