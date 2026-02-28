<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="关联用户" prop="userId">
            <el-select
              v-model="formData.userId"
              placeholder="请选择系统用户"
              filterable
              style="width: 100%"
              :disabled="formType === 'update'"
            >
              <el-option
                v-for="u in userList"
                :key="u.id"
                :label="`${u.nickname} (${u.username})`"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="nickname">
            <el-input v-model="formData.nickname" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptTree"
              :props="{ label: 'name', value: 'id' }"
              check-strictly
              node-key="id"
              placeholder="请选择部门"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位" prop="postId">
            <el-select v-model="formData.postId" placeholder="请选择岗位" clearable style="width: 100%">
              <el-option
                v-for="p in postList"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="formData.mobile" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别" prop="sex">
            <el-radio-group v-model="formData.sex">
              <el-radio :value="0">未知</el-radio>
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="雇佣类型" prop="employmentType">
            <el-select v-model="formData.employmentType" placeholder="请选择" style="width: 100%">
              <el-option label="全职" :value="1" />
              <el-option label="实习" :value="2" />
              <el-option label="兼职" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="在职状态" prop="employmentStatus">
            <el-select v-model="formData.employmentStatus" placeholder="请选择" style="width: 100%">
              <el-option label="在职" :value="1" />
              <el-option label="离职" :value="2" />
              <el-option label="待入职" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="默认排班规则" prop="defaultRuleId">
            <el-select v-model="formData.defaultRuleId" placeholder="0=系统默认晚班" clearable style="width: 100%">
              <el-option
                v-for="r in ruleList"
                :key="r.id"
                :label="r.name"
                :value="r.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="入职日期" prop="joinDate">
            <el-date-picker
              v-model="formData.joinDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择入职日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="转正日期" prop="formalDate">
            <el-date-picker
              v-model="formData.formalDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择转正日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="离职日期" prop="leaveDate">
            <el-date-picker
              v-model="formData.leaveDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择离职日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号" prop="idCard" v-hasPermi="['system:hr-employee:sensitive']">
            <el-input v-model="formData.idCard" placeholder="请输入身份证号" maxlength="18" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="紧急联系人" prop="emergencyContact">
            <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="紧急联系电话" prop="emergencyPhone">
            <el-input v-model="formData.emergencyPhone" placeholder="请输入紧急联系电话" maxlength="11" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import * as HrEmployeeApi from '@/api/hr/employee'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as RuleApi from '@/api/hr/attendance/rule'
import type { HrEmployeeVO } from '@/api/hr/employee'

defineOptions({ name: 'HrEmployeeForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const userList = ref<any[]>([])
const deptTree = ref<any[]>([])
const postList = ref<any[]>([])
const ruleList = ref<any[]>([])
const formData = ref<HrEmployeeVO>({
  userId: 0,
  nickname: '',
  deptId: 0,
  postId: 0,
  mobile: '',
  email: '',
  sex: 0,
  employmentType: 1,
  employmentStatus: 3,
  defaultRuleId: 0,
  joinDate: '',
  formalDate: '',
  leaveDate: '',
  idCard: '',
  emergencyContact: '',
  emergencyPhone: '',
  remark: ''
})
const formRules = reactive({
  userId: [{ required: true, message: '请选择关联用户', trigger: 'change' }],
  nickname: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增员工' : '修改员工'
  formType.value = type
  resetForm()
  const [users, depts, posts, rules] = await Promise.all([
    UserApi.getSimpleUserList(),
    DeptApi.getSimpleDeptList(),
    PostApi.getSimplePostList(),
    RuleApi.getAttendanceRuleListEnabled()
  ])
  userList.value = users ?? []
  deptTree.value = handleTree(depts ?? [])
  postList.value = posts ?? []
  ruleList.value = rules ?? []
  if (id) {
    formLoading.value = true
    try {
      const data = await HrEmployeeApi.getHrEmployee(id)
      formData.value = {
        ...data,
        userId: data.userId ?? 0,
        deptId: data.deptId ?? 0,
        postId: data.postId ?? 0,
        defaultRuleId: data.defaultRuleId ?? 0
      }
    } finally {
      formLoading.value = false
    }
  }
}

const resetForm = () => {
  formData.value = {
    userId: 0,
    nickname: '',
    deptId: 0,
    postId: 0,
    mobile: '',
    email: '',
    sex: 0,
    employmentType: 1,
    employmentStatus: 3,
    defaultRuleId: 0,
    joinDate: '',
    formalDate: '',
    leaveDate: '',
    idCard: '',
    emergencyContact: '',
    emergencyPhone: '',
    remark: ''
  }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    const data = formData.value as any
    if (formType.value === 'create') {
      await HrEmployeeApi.createHrEmployee(data)
      message.success(t('common.createSuccess'))
    } else {
      await HrEmployeeApi.updateHrEmployee(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
