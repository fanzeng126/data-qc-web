<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="医疗机构ID" prop="institutionId">
            <el-input v-model="formData.institutionId" placeholder="请输入医疗机构ID" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构唯一编码" prop="orgId">
            <el-input v-model="formData.orgId" placeholder="请输入机构唯一编码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="机构名称" prop="institutionName">
            <el-input v-model="formData.institutionName" placeholder="请输入机构名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构类别" prop="institutionCategory">
            <el-select v-model="formData.institutionCategory" placeholder="请选择机构类别" class="w-full">
              <el-option label="A-医院" value="A" />
              <el-option label="B1-社区卫生服务中心" value="B1" />
              <el-option label="C-乡镇卫生院" value="C" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="行政区划代码" prop="adminDivisionCode">
            <el-input v-model="formData.adminDivisionCode" placeholder="请输入行政区划代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="乡镇街道代码" prop="townshipStreetCode">
            <el-input v-model="formData.townshipStreetCode" placeholder="请输入乡镇街道代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="负责人" prop="director">
            <el-input v-model="formData.director" placeholder="请输入负责人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构代码" prop="institutionCode">
            <el-input v-model="formData.institutionCode" placeholder="请输入机构代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="统一社会信用代码" prop="socialCreditCode">
            <el-input v-model="formData.socialCreditCode" placeholder="请输入统一社会信用代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="经济类型" prop="economicType">
            <el-select v-model="formData.economicType" placeholder="请选择经济类型" class="w-full">
              <el-option label="国有" value="国有" />
              <el-option label="集体" value="集体" />
              <el-option label="私营" value="私营" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="医院等级(等)" prop="hospitalLevelGrade">
            <el-select v-model="formData.hospitalLevelGrade" placeholder="请选择等级" class="w-full">
              <el-option label="一级" value="1" />
              <el-option label="二级" value="2" />
              <el-option label="三级" value="3" />
              <el-option label="未定级" value="9" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="医院等级(级)" prop="hospitalLevelClass">
            <el-select v-model="formData.hospitalLevelClass" placeholder="请选择级别" class="w-full">
              <el-option label="甲等" value="1" />
              <el-option label="乙等" value="2" />
              <el-option label="丙等" value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="机构等级" prop="institutionLevel">
            <el-select v-model="formData.institutionLevel" placeholder="请选择等级" class="w-full">
              <el-option label="一级" value="1" />
              <el-option label="二级" value="2" />
              <el-option label="三级" value="3" />
              <el-option label="未定级" value="9" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="有效期开始日期" prop="validFrom">
            <el-date-picker
              v-model="formData.validFrom"
              type="datetime"
              placeholder="选择有效期开始日期"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="有效期结束日期" prop="validTo">
            <el-date-picker
              v-model="formData.validTo"
              type="datetime"
              placeholder="选择有效期结束日期"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
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
import { InstitutionStandardApi, InstitutionStandardVO } from '@/api/drug/standardlibrary/institution'

defineOptions({ name: 'InstitutionStandardForm' })

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
  orgId: undefined,
  institutionId: undefined,
  institutionName: undefined,
  institutionCategory: undefined,
  adminDivisionCode: undefined,
  townshipStreetCode: undefined,
  director: undefined,
  contactPerson: undefined,
  contactPhone: undefined,
  institutionCode: undefined,
  socialCreditCode: undefined,
  economicType: undefined,
  hospitalLevelGrade: undefined,
  hospitalLevelClass: undefined,
  institutionLevel: undefined,
  validFrom: undefined,
  validTo: undefined,
  status: 1
})

const formRules = reactive({
  institutionId: [{ required: true, message: '医疗机构ID不能为空', trigger: 'blur' }],
  institutionName: [{ required: true, message: '机构名称不能为空', trigger: 'blur' }],
  institutionCategory: [{ required: true, message: '机构类别不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
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
      formData.value = await InstitutionStandardApi.getInstitutionStandard(id)
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
    const data = formData.value as unknown as InstitutionStandardVO
    if (formType.value === 'create') {
      await InstitutionStandardApi.createInstitutionStandard(data)
      message.success(t('common.createSuccess'))
    } else {
      await InstitutionStandardApi.updateInstitutionStandard(data)
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
    orgId: undefined,
    institutionId: undefined,
    institutionName: undefined,
    institutionCategory: undefined,
    adminDivisionCode: undefined,
    townshipStreetCode: undefined,
    director: undefined,
    contactPerson: undefined,
    contactPhone: undefined,
    institutionCode: undefined,
    socialCreditCode: undefined,
    economicType: undefined,
    hospitalLevelGrade: undefined,
    hospitalLevelClass: undefined,
    institutionLevel: undefined,
    validFrom: undefined,
    validTo: undefined,
    status: 1
  }
  formRef.value?.resetFields()
}
</script>
