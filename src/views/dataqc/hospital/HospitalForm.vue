<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="系统编码" prop="domainCode">
            <el-input v-model="formData.domainCode" placeholder="请输入系统编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组织机构代码" prop="organizationCode">
            <el-input v-model="formData.organizationCode" placeholder="请输入组织机构代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="组织机构名称" prop="organizationName">
            <el-input v-model="formData.organizationName" placeholder="请输入组织机构名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医疗机构代码" prop="hospitalCode">
            <el-input v-model="formData.hospitalCode" placeholder="请输入医疗机构代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="统计日期" prop="statDate">
            <el-date-picker
              v-model="formData.statDate"
              type="month"
              placeholder="选择统计月份"
              format="YYYY-MM"
              value-format="YYYYMM"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数据上报日期" prop="uploadDate">
            <el-date-picker
              v-model="formData.uploadDate"
              type="date"
              placeholder="选择上报日期"
              format="YYYY-MM-DD"
              value-format="YYYYMMDD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 资源配置信息 -->
      <el-divider content-position="left">
        <span class="section-title">资源配置</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="实有床位数" prop="bedsNum">
            <el-input-number
              v-model="formData.bedsNum"
              :min="0"
              :precision="0"
              placeholder="床位数"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="执业医师数" prop="pracDockerNum">
            <el-input-number
              v-model="formData.pracDockerNum"
              :min="0"
              :precision="0"
              placeholder="执业医师数"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="执业助理医师数" prop="assDockerNum">
            <el-input-number
              v-model="formData.assDockerNum"
              :min="0"
              :precision="0"
              placeholder="助理医师数"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 服务情况 -->
      <el-divider content-position="left">
        <span class="section-title">服务情况</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总诊疗人次数" prop="visitCount">
            <el-input-number
              v-model="formData.visitCount"
              :min="0"
              :precision="0"
              placeholder="诊疗人次"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出院人数" prop="leaveHosCount">
            <el-input-number
              v-model="formData.leaveHosCount"
              :min="0"
              :precision="0"
              placeholder="出院人数"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 药品收入信息 -->
      <el-divider content-position="left">
        <span class="section-title">药品收入</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="本季度药品总收入" prop="drugSellAmount">
            <el-input-number
              v-model="formData.drugSellAmount"
              :min="0"
              :precision="2"
              placeholder="药品总收入（元）"
              style="width: 100%"
              :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/￥\s?|(,*)/g, '')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 中医药相关 -->
      <el-divider content-position="left">
        <span class="section-title">中医药情况</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="中药饮片总采购额" prop="ypPurchaseAmount">
            <el-input-number
              v-model="formData.ypPurchaseAmount"
              :min="0"
              :precision="2"
              placeholder="中药饮片采购额"
              style="width: 100%"
              :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/￥\s?|(,*)/g, '')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="中药饮片总销售额" prop="ypSellAmount">
            <el-input-number
              v-model="formData.ypSellAmount"
              :min="0"
              :precision="2"
              placeholder="中药饮片销售额"
              style="width: 100%"
              :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/￥\s?|(,*)/g, '')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="中药颗粒剂总采购额" prop="klPurchaseAmount">
            <el-input-number
              v-model="formData.klPurchaseAmount"
              :min="0"
              :precision="2"
              placeholder="中药颗粒剂采购额"
              style="width: 100%"
              :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/￥\s?|(,*)/g, '')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="中药颗粒剂总销售额" prop="klSellAmount">
            <el-input-number
              v-model="formData.klSellAmount"
              :min="0"
              :precision="2"
              placeholder="中药颗粒剂销售额"
              style="width: 100%"
              :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/￥\s?|(,*)/g, '')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="导入批次号" prop="importBatchNo">
        <el-input
          v-model="formData.importBatchNo"
          placeholder="系统自动生成或手工输入"
          :disabled="formType === 'update'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">
          确 定
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as HospitalResourceApi from '@/api/dataqc/hosResource'

defineOptions({ name: 'HospitalForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  domainCode: '',
  organizationCode: '',
  organizationName: '',
  hospitalCode: '',
  statDate: '',
  bedsNum: undefined,
  pracDockerNum: undefined,
  assDockerNum: undefined,
  visitCount: undefined,
  leaveHosCount: undefined,
  drugSellAmount: undefined,
  ypPurchaseAmount: undefined,
  ypSellAmount: undefined,
  klPurchaseAmount: undefined,
  klSellAmount: undefined,
  uploadDate: '',
  importBatchNo: ''
})
const formRef = ref()
const formRules = reactive({
  domainCode: [{ required: true, message: '系统编码不能为空', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '组织机构代码不能为空', trigger: 'blur' }],
  organizationName: [{ required: true, message: '组织机构名称不能为空', trigger: 'blur' }],
  hospitalCode: [{ required: true, message: '医疗机构代码不能为空', trigger: 'blur' }],
  statDate: [{ required: true, message: '统计日期不能为空', trigger: 'change' }],
  uploadDate: [{ required: true, message: '数据上报日期不能为空', trigger: 'change' }]
})

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增医疗机构资源' : '修改医疗机构资源'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await HospitalResourceApi.getHospitalResource(id)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    const data = formData.value as unknown as HospitalResourceApi.HospitalResourceVO
    if (formType.value === 'create') {
      await HospitalResourceApi.createHospitalResource(data)
      message.success(t('common.createSuccess'))
    } else {
      await HospitalResourceApi.updateHospitalResource(data)
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
    domainCode: '',
    organizationCode: '',
    organizationName: '',
    hospitalCode: '',
    statDate: '',
    bedsNum: undefined,
    pracDockerNum: undefined,
    assDockerNum: undefined,
    visitCount: undefined,
    leaveHosCount: undefined,
    drugSellAmount: undefined,
    ypPurchaseAmount: undefined,
    ypSellAmount: undefined,
    klPurchaseAmount: undefined,
    klSellAmount: undefined,
    uploadDate: '',
    importBatchNo: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })

const emit = defineEmits(['success'])
</script>

<style scoped>
.section-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-divider__text) {
  background-color: #f5f7fa;
  padding: 0 15px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
