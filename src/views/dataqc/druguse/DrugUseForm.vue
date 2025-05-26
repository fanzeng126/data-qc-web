<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="院内药品编码" prop="hosDrugId">
            <el-input
              v-model="formData.hosDrugId"
              placeholder="请输入院内药品编码"
              @blur="handleDrugCodeBlur"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品通用名" prop="productName">
            <el-input
              v-model="formData.productName"
              placeholder="产品通用名"
              :disabled="true"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售数量" prop="sellPackQuantity">
            <el-input-number
              v-model="formData.sellPackQuantity"
              :min="1"
              placeholder="请输入销售数量"
              class="w-full"
              @change="calculateAmount"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售单价" prop="sellPackPrice">
            <el-input-number
              v-model="formData.sellPackPrice"
              :min="0"
              :precision="2"
              placeholder="请输入销售单价"
              class="w-full"
              @change="calculateAmount"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="科室代码" prop="departmentCode">
            <el-input
              v-model="formData.departmentCode"
              placeholder="请输入科室代码"
              @blur="handleDepartmentCodeBlur"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="科室名称" prop="departmentName">
            <el-input
              v-model="formData.departmentName"
              placeholder="科室名称"
              :disabled="true"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="医生代码" prop="doctorCode">
            <el-input
              v-model="formData.doctorCode"
              placeholder="请输入医生代码"
              @blur="handleDoctorCodeBlur"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医生姓名" prop="doctorName">
            <el-input
              v-model="formData.doctorName"
              placeholder="医生姓名"
              :disabled="true"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="患者类型" prop="patientType">
            <el-select
              v-model="formData.patientType"
              placeholder="请选择患者类型"
              class="w-full"
            >
              <el-option label="门诊" value="1" />
              <el-option label="急诊" value="2" />
              <el-option label="住院" value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售日期" prop="sellDate">
            <el-date-picker
              v-model="formData.sellDate"
              type="date"
              placeholder="选择销售日期"
              value-format="YYYYMMDD"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 处方信息 -->
      <el-card class="mb-4">
        <template #header>
          <span>处方信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="处方编号" prop="prescriptionNo">
              <el-input
                v-model="formData.prescriptionNo"
                placeholder="请输入处方编号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处方类型">
              <el-select
                v-model="formData.prescriptionType"
                placeholder="请选择处方类型"
                class="w-full"
              >
                <el-option label="普通处方" value="NORMAL" />
                <el-option label="急诊处方" value="EMERGENCY" />
                <el-option label="儿童处方" value="PEDIATRIC" />
                <el-option label="精神药品处方" value="PSYCHIATRIC" />
                <el-option label="麻醉药品处方" value="NARCOTIC" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用法用量">
              <el-input
                v-model="formData.usage"
                placeholder="请输入用法用量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="给药频次">
              <el-select
                v-model="formData.frequency"
                placeholder="请选择给药频次"
                class="w-full"
              >
                <el-option label="一日一次" value="QD" />
                <el-option label="一日两次" value="BID" />
                <el-option label="一日三次" value="TID" />
                <el-option label="一日四次" value="QID" />
                <el-option label="必要时" value="PRN" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 患者信息 -->
      <el-card class="mb-4">
        <template #header>
          <span>患者信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者编号">
              <el-input
                v-model="formData.patientId"
                placeholder="请输入患者编号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="患者姓名">
              <el-input
                v-model="formData.patientName"
                placeholder="请输入患者姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者年龄">
              <el-input-number
                v-model="formData.patientAge"
                :min="0"
                :max="150"
                placeholder="请输入患者年龄"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="患者性别">
              <el-select
                v-model="formData.patientGender"
                placeholder="请选择性别"
                class="w-full"
              >
                <el-option label="男" value="M" />
                <el-option label="女" value="F" />
                <el-option label="未知" value="U" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 金额信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售金额">
            <el-input
              :value="calculateTotalAmount()"
              disabled
              placeholder="自动计算"
            >
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支付方式">
            <el-select
              v-model="formData.paymentMethod"
              placeholder="请选择支付方式"
              class="w-full"
            >
              <el-option label="现金" value="CASH" />
              <el-option label="医保" value="INSURANCE" />
              <el-option label="银行卡" value="CARD" />
              <el-option label="支付宝" value="ALIPAY" />
              <el-option label="微信" value="WECHAT" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注信息">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 系统信息 -->
      <el-row>
        <el-col :span="24">
          <el-form-item label="系统信息">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="系统编码" prop="domainCode">
                  <el-input v-model="formData.domainCode" placeholder="系统编码" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="组织机构代码" prop="organizationCode">
                  <el-input v-model="formData.organizationCode" placeholder="组织机构代码" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="医疗机构代码" prop="hospitalCode">
                  <el-input v-model="formData.hospitalCode" placeholder="医疗机构代码" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as DrugUseApi from '@/api/dataqc/drugUse'
import * as DrugListApi from '@/api/dataqc/drugList'
import * as DepartmentApi from '@/api/system/dept'
import * as DoctorApi from '@/api/system/user'
import { FormRules } from 'element-plus'

defineOptions({ name: 'DrugUseForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  hosDrugId: '',
  productName: '',
  sellPackQuantity: undefined,
  sellPackPrice: undefined,
  departmentCode: '',
  departmentName: '',
  doctorCode: '',
  doctorName: '',
  patientType: '',
  sellDate: '',
  prescriptionNo: '',
  prescriptionType: '',
  usage: '',
  frequency: '',
  patientId: '',
  patientName: '',
  patientAge: undefined,
  patientGender: '',
  paymentMethod: '',
  remark: '',
  domainCode: '',
  organizationCode: '',
  hospitalCode: ''
})

const formRef = ref()

// 表单验证规则
const formRules = reactive<FormRules>({
  hosDrugId: [{ required: true, message: '院内药品编码不能为空', trigger: 'blur' }],
  sellPackQuantity: [
    { required: true, message: '销售数量不能为空', trigger: 'change' },
    { type: 'number', min: 1, message: '销售数量必须大于0', trigger: 'change' }
  ],
  sellPackPrice: [
    { required: true, message: '销售单价不能为空', trigger: 'change' },
    { type: 'number', min: 0, message: '销售单价不能小于0', trigger: 'change' }
  ],
  departmentCode: [{ required: true, message: '科室代码不能为空', trigger: 'blur' }],
  doctorCode: [{ required: true, message: '医生代码不能为空', trigger: 'blur' }],
  patientType: [{ required: true, message: '患者类型不能为空', trigger: 'change' }],
  sellDate: [{ required: true, message: '销售日期不能为空', trigger: 'change' }],
  domainCode: [{ required: true, message: '系统编码不能为空', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '组织机构代码不能为空', trigger: 'blur' }],
  hospitalCode: [{ required: true, message: '医疗机构代码不能为空', trigger: 'blur' }]
})

/** 打开表单对话框 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      formData.value = await DrugUseApi.getDrugUseInfo(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await DrugUseApi.createDrugUseInfo(data)
      message.success(t('common.createSuccess'))
    } else {
      await DrugUseApi.updateDrugUseInfo(data)
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
    hosDrugId: '',
    productName: '',
    sellPackQuantity: undefined,
    sellPackPrice: undefined,
    departmentCode: '',
    departmentName: '',
    doctorCode: '',
    doctorName: '',
    patientType: '',
    sellDate: '',
    prescriptionNo: '',
    prescriptionType: '',
    usage: '',
    frequency: '',
    patientId: '',
    patientName: '',
    patientAge: undefined,
    patientGender: '',
    paymentMethod: '',
    remark: '',
    domainCode: '',
    organizationCode: '',
    hospitalCode: ''
  }
  formRef.value?.resetFields()
}

/** 处理药品编码失焦 */
const handleDrugCodeBlur = async () => {
  if (!formData.value.hosDrugId) return

  try {
    // 查询药品信息
    const drug = await DrugListApi.getDrugByCode(formData.value.hosDrugId)
    if (drug) {
      formData.value.productName = drug.productName
      formData.value.ypid = drug.ypid
      formData.value.prDrugId = drug.prDrugId
      // 自动设置销售单价为进货单价
      if (drug.inPackPrice) {
        formData.value.sellPackPrice = drug.inPackPrice
      }
    } else {
      message.warning('未找到该药品编码对应的药品信息')
      formData.value.productName = ''
    }
  } catch (error) {
    console.error('查询药品信息失败', error)
  }
}

/** 处理科室编码失焦 */
const handleDepartmentCodeBlur = async () => {
  if (!formData.value.departmentCode) return

  try {
    // 查询科室信息
    const department = await DepartmentApi.getDepartmentByCode(formData.value.departmentCode)
    if (department) {
      formData.value.departmentName = department.name
    } else {
      message.warning('未找到该科室编码对应的科室信息')
      formData.value.departmentName = ''
    }
  } catch (error) {
    console.error('查询科室信息失败', error)
  }
}

/** 处理医生编码失焦 */
const handleDoctorCodeBlur = async () => {
  if (!formData.value.doctorCode) return

  try {
    // 查询医生信息
    const doctor = await DoctorApi.getDoctorByCode(formData.value.doctorCode)
    if (doctor) {
      formData.value.doctorName = doctor.nickname || doctor.username
    } else {
      message.warning('未找到该医生编码对应的医生信息')
      formData.value.doctorName = ''
    }
  } catch (error) {
    console.error('查询医生信息失败', error)
  }
}

/** 计算金额 */
const calculateAmount = () => {
  // 触发金额计算显示更新
}

/** 计算总金额 */
const calculateTotalAmount = () => {
  const quantity = formData.value.sellPackQuantity || 0
  const price = formData.value.sellPackPrice || 0
  return (quantity * price).toFixed(2)
}

// 暴露方法
defineExpose({ open })

// 定义事件
const emit = defineEmits(['success'])
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 16px;
}

.w-full {
  width: 100%;
}
</style>
