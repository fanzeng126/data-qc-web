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
          <el-form-item label="出入库类型" prop="ioType">
            <el-select
              v-model="formData.ioType"
              placeholder="请选择类型"
              class="w-full"
              @change="handleTypeChange"
            >
              <el-option label="入库" value="IN" />
              <el-option label="出库" value="OUT" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="院内药品编码" prop="hosDrugId">
            <el-input
              v-model="formData.hosDrugId"
              placeholder="请输入院内药品编码"
              @blur="handleDrugCodeBlur"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品通用名" prop="productName">
            <el-input
              v-model="formData.productName"
              placeholder="产品通用名"
              :disabled="true"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出入库日期" prop="outInDate">
            <el-date-picker
              v-model="formData.outInDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYYMMDD"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 入库相关字段 -->
      <template v-if="formData.ioType === 'IN'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库数量" prop="inPackQuantity">
              <el-input-number
                v-model="formData.inPackQuantity"
                :min="1"
                placeholder="请输入入库数量"
                class="w-full"
                @change="calculateAmount"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库单价" prop="inPackPrice">
              <el-input-number
                v-model="formData.inPackPrice"
                :min="0"
                :precision="2"
                placeholder="请输入入库单价"
                class="w-full"
                @change="calculateAmount"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商代码" prop="supplierCode">
              <el-input
                v-model="formData.supplierCode"
                placeholder="请输入供应商代码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input
                v-model="formData.supplierName"
                placeholder="请输入供应商名称"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批次号" prop="batchNo">
              <el-input
                v-model="formData.batchNo"
                placeholder="请输入批次号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产日期" prop="productionDate">
              <el-date-picker
                v-model="formData.productionDate"
                type="date"
                placeholder="选择生产日期"
                value-format="YYYYMMDD"
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效期" prop="expiryDate">
              <el-date-picker
                v-model="formData.expiryDate"
                type="date"
                placeholder="选择有效期"
                value-format="YYYYMMDD"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库金额">
              <el-input
                :value="calculateTotalAmount()"
                disabled
                placeholder="自动计算"
              >
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- 出库相关字段 -->
      <template v-if="formData.ioType === 'OUT'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库数量" prop="outPackQuantity">
              <el-input-number
                v-model="formData.outPackQuantity"
                :min="1"
                placeholder="请输入出库数量"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库用途">
              <el-select
                v-model="formData.outPurpose"
                placeholder="请选择出库用途"
                class="w-full"
              >
                <el-option label="临床使用" value="CLINICAL" />
                <el-option label="科研使用" value="RESEARCH" />
                <el-option label="报损处理" value="DAMAGE" />
                <el-option label="过期处理" value="EXPIRED" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库科室" prop="departmentCode">
              <el-input
                v-model="formData.departmentCode"
                placeholder="请输入科室代码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科室名称" prop="departmentName">
              <el-input
                v-model="formData.departmentName"
                placeholder="请输入科室名称"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

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
import * as DrugInoutApi from '@/api/dataqc/drugInout'
import * as DrugListApi from '@/api/dataqc/drugList'
import { FormRules } from 'element-plus'

defineOptions({ name: 'DrugInoutForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  ioType: 'IN',
  hosDrugId: '',
  productName: '',
  outInDate: '',
  inPackQuantity: undefined,
  inPackPrice: undefined,
  outPackQuantity: undefined,
  supplierCode: '',
  supplierName: '',
  batchNo: '',
  productionDate: '',
  expiryDate: '',
  departmentCode: '',
  departmentName: '',
  outPurpose: '',
  remark: '',
  domainCode: '',
  organizationCode: '',
  hospitalCode: ''
})

const formRef = ref()

// 表单验证规则
const formRules = reactive<FormRules>({
  ioType: [{ required: true, message: '出入库类型不能为空', trigger: 'change' }],
  hosDrugId: [{ required: true, message: '院内药品编码不能为空', trigger: 'blur' }],
  outInDate: [{ required: true, message: '出入库日期不能为空', trigger: 'change' }],
  inPackQuantity: [
    { required: true, message: '入库数量不能为空', trigger: 'change' },
    { type: 'number', min: 1, message: '入库数量必须大于0', trigger: 'change' }
  ],
  inPackPrice: [
    { required: true, message: '入库单价不能为空', trigger: 'change' },
    { type: 'number', min: 0, message: '入库单价不能小于0', trigger: 'change' }
  ],
  outPackQuantity: [
    { required: true, message: '出库数量不能为空', trigger: 'change' },
    { type: 'number', min: 1, message: '出库数量必须大于0', trigger: 'change' }
  ],
  supplierName: [{ required: true, message: '供应商名称不能为空', trigger: 'blur' }],
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
      formData.value = await DrugInoutApi.getDrugInoutInfo(id)
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
      await DrugInoutApi.createDrugInoutInfo(data)
      message.success(t('common.createSuccess'))
    } else {
      await DrugInoutApi.updateDrugInoutInfo(data)
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
    ioType: 'IN',
    hosDrugId: '',
    productName: '',
    outInDate: '',
    inPackQuantity: undefined,
    inPackPrice: undefined,
    outPackQuantity: undefined,
    supplierCode: '',
    supplierName: '',
    batchNo: '',
    productionDate: '',
    expiryDate: '',
    departmentCode: '',
    departmentName: '',
    outPurpose: '',
    remark: '',
    domainCode: '',
    organizationCode: '',
    hospitalCode: ''
  }
  formRef.value?.resetFields()
}

/** 处理类型变化 */
const handleTypeChange = () => {
  // 清空相关字段
  if (formData.value.ioType === 'IN') {
    formData.value.outPackQuantity = undefined
    formData.value.departmentCode = ''
    formData.value.departmentName = ''
    formData.value.outPurpose = ''
  } else {
    formData.value.inPackQuantity = undefined
    formData.value.inPackPrice = undefined
    formData.value.supplierCode = ''
    formData.value.supplierName = ''
    formData.value.batchNo = ''
    formData.value.productionDate = ''
    formData.value.expiryDate = ''
  }
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
    } else {
      message.warning('未找到该药品编码对应的药品信息')
      formData.value.productName = ''
    }
  } catch (error) {
    console.error('查询药品信息失败', error)
  }
}

/** 计算金额 */
const calculateAmount = () => {
  // 触发金额计算显示更新
}

/** 计算总金额 */
const calculateTotalAmount = () => {
  const quantity = formData.value.inPackQuantity || 0
  const price = formData.value.inPackPrice || 0
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
</style>
