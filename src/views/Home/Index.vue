<template>
  <div>
    <!-- 模块一：欢迎语 + 个人工作概览 -->
    <el-card shadow="never">
      <el-skeleton :loading="loading" animated>
        <el-row :gutter="16" justify="space-between">
          <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="flex items-center">
              <el-avatar :src="avatar" :size="70" class="mr-16px">
                <img src="@/assets/imgs/avatar.gif" alt="" />
              </el-avatar>
              <div>
                <div class="text-20px">
                  {{ t('workplace.welcome') }} {{ username }} {{ t('workplace.happyDay') }}
                </div>
                <div class="mt-10px text-14px text-gray-500 space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono text-16px">{{ currentTime }}</span>
                    <span>{{ weekDay }}</span>
                  </div>
                  <div class="text-12px text-gray-400">
                    {{ solarDate }}
                    <span v-if="lunarDate"> · {{ lunarDate }}</span>
                  </div>
                  <div v-if="weather" class="text-12px text-gray-400">
                    无锡 {{ weather.text }}
                  </div>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <!-- 今日打卡快捷入口 -->
            <div v-if="clockCardVisible" class="flex items-center gap-2 mb-2">
              <el-button
                size="small"
                :type="todayClockIn ? 'success' : 'primary'"
                :disabled="todayClockIn"
                :loading="clockLoading"
                @click="handleClockIn"
              >
                {{ todayClockIn ? '已签到' : '签到' }}
              </el-button>
              <el-button
                size="small"
                :type="todayClockOut ? 'info' : 'warning'"
                :disabled="todayClockOut"
                :loading="clockLoading"
                @click="handleClockOut"
              >
                {{ todayClockOut ? '已签退' : '签退' }}
              </el-button>
            </div>
            <div class="h-70px flex items-center justify-end lt-sm:mt-10px">
              <div class="px-8px text-right">
                <div class="mb-16px text-14px text-gray-400">待办任务</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                  :end-val="totalState.todo"
                  :duration="2600"
                />
              </div>
              <el-divider direction="vertical" />
              <div class="px-8px text-right">
                <div class="mb-16px text-14px text-gray-400">已办任务</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                  :end-val="totalState.done"
                  :duration="2600"
                />
              </div>
              <el-divider direction="vertical" border-style="dashed" />
              <div class="px-8px text-right">
                <div class="mb-16px text-14px text-gray-400">进行中流程</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                  :end-val="totalState.running"
                  :duration="2600"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-skeleton>
    </el-card>

    <el-row class="mt-8px" :gutter="8" justify="space-between">
      <!-- 左列：待办 + 快捷入口 + 统计图 -->
      <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-8px">
        <!-- 模块二：我的待办 -->
        <el-card shadow="never">
          <template #header>
            <div class="h-3 flex justify-between">
              <span>我的待办</span>
              <el-link type="primary" :underline="false" @click="goToTodo">
                {{ t('action.more') }}
              </el-link>
            </div>
          </template>
          <el-skeleton :loading="loading" animated>
            <div v-if="todoList.length === 0" class="py-8 text-center text-gray-400">
              暂无待办任务
            </div>
            <ul v-else>
              <li
                v-for="item in todoList"
                :key="item.id"
                class="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2"
                @click="handleTodoClick(item)"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-14px truncate">{{ item.processInstance?.name || item.name }}</div>
                  <div class="mt-1 text-12px text-gray-400">
                    {{ item.processInstance?.startUser?.nickname || '-' }} ·
                    {{ formatTime(item.createTime, 'yyyy-MM-dd HH:mm') }}
                  </div>
                </div>
                <el-tag size="small" type="info">{{ item.name }}</el-tag>
              </li>
            </ul>
          </el-skeleton>
        </el-card>

        <!-- 快捷入口 -->
        <el-card shadow="never" class="mt-8px">
          <template #header>
            <div class="h-3 flex justify-between">
              <span>{{ t('workplace.shortcutOperation') }}</span>
            </div>
          </template>
          <el-skeleton :loading="loading" animated>
            <el-row :gutter="12">
              <el-col
                v-for="item in shortcutList"
                :key="item.name"
                :xs="12"
                :sm="8"
                :md="6"
                :lg="6"
                :xl="4"
                class="mb-8px"
              >
                <div
                  class="flex items-center gap-2 p-3 rounded cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="handleShortcutClick(item)"
                >
                  <Icon :icon="item.icon" :size="22" :style="{ color: item.color }" />
                  <span class="text-14px">{{ item.name }}</span>
                </div>
              </el-col>
            </el-row>
          </el-skeleton>
        </el-card>

        <!-- 模块三：个人统计（简化） -->
        <el-card shadow="never" class="mt-8px">
          <template #header>
            <span>流程办理统计</span>
          </template>
          <el-skeleton :loading="loading" animated>
            <Echart :options="processChartOptions" :height="240" />
          </el-skeleton>
        </el-card>
      </el-col>

      <!-- 右列：公告 + 常用文档 -->
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24" class="mb-8px">
        <!-- 模块四：最新公告 -->
        <el-card shadow="never">
          <template #header>
            <div class="h-3 flex justify-between">
              <span>{{ t('workplace.notice') }}</span>
              <el-link type="primary" :underline="false" @click="goToNotice">
                {{ t('action.more') }}
              </el-link>
            </div>
          </template>
          <el-skeleton :loading="loading" animated>
            <div v-if="noticeList.length === 0" class="py-8 text-center text-gray-400">
              暂无公告
            </div>
            <ul v-else>
              <li
                v-for="item in noticeList"
                :key="item.id"
                class="flex items-start py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2"
                @click="handleNoticeClick(item)"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-14px truncate">{{ item.title }}</div>
                  <div class="mt-1 text-12px text-gray-400 flex items-center gap-2">
                    <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="item.type" size="small" />
                    {{ formatTime(item.createTime, 'yyyy-MM-dd') }}
                  </div>
                </div>
              </li>
            </ul>
          </el-skeleton>
        </el-card>

        <!-- 常用文档/制度（占位，可配置） -->
        <el-card shadow="never" class="mt-8px">
          <template #header>
            <span>常用文档</span>
          </template>
          <el-skeleton :loading="loading" animated>
            <div class="text-14px text-gray-500">
              <p class="mb-2">· 请假制度</p>
              <p class="mb-2">· 报销制度</p>
              <p class="mb-0">· 考勤管理办法</p>
              <p class="mt-4 text-12px text-gray-400">
                以上为示例，可在系统中配置实际文档链接
              </p>
            </div>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告详情弹窗 -->
    <el-dialog v-model="noticeDetailVisible" title="公告详情" width="600px">
      <el-descriptions v-if="noticeDetail" :column="1" border size="small">
        <el-descriptions-item label="公告标题">
          {{ noticeDetail.title }}
        </el-descriptions-item>
        <el-descriptions-item label="公告类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="noticeDetail.type" />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="noticeDetail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(noticeDetail.createTime, 'yyyy-MM-dd HH:mm:ss') }}
        </el-descriptions-item>
        <el-descriptions-item label="公告内容">
          <div class="mt-2 max-h-400 overflow-auto" v-html="noticeDetail.content"></div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { formatTime } from '@/utils'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { useRouter } from 'vue-router'
import * as TaskApi from '@/api/bpm/task'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as NoticeApi from '@/api/system/notice'
import { useDateTime } from './useDateTime'
import { useMenuPath } from '@/hooks/web/useMenuPath'
import { getWuxiWeather } from '@/api/infra/weather'
import * as PersonalCenterApi from '@/api/system/personalCenter'

defineOptions({ name: 'Index' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { resolveShortcutPath } = useMenuPath()
const loading = ref(true)
const avatar = userStore.getUser.avatar
const username = userStore.getUser.nickname

// 实时日期时间（无锡滨湖区）
const { currentTime, weekDay, solarDate, lunarDate } = useDateTime()
const weather = ref<{ temp: string; desc: string; text: string } | null>(null)
getWuxiWeather().then((w) => {
  weather.value = w
})

// 模块一：统计数
const totalState = reactive({
  todo: 0,
  done: 0,
  running: 0
})

// 模块二：待办列表
const todoList = ref<any[]>([])
const TODO_PAGE_SIZE = 5

// 模块四：公告列表
const noticeList = ref<any[]>([])
const NOTICE_PAGE_SIZE = 5

// 快捷入口（根据权限过滤，路径从后端菜单动态解析避免 404）
const shortcutList = computed(() => {
  const all: { name: string; icon: string; url: string; color: string; perm?: string[] }[] = [
    { name: '发起流程', icon: 'ep:plus', url: resolveShortcutPath('processInstanceCreate'), color: '#409EFF' },
    { name: '待办任务', icon: 'ep:clock', url: resolveShortcutPath('taskTodo'), color: '#E6A23C' },
    { name: '已办任务', icon: 'ep:circle-check', url: resolveShortcutPath('taskDone'), color: '#909399' },
    { name: '抄送我的', icon: 'ep:document-copy', url: resolveShortcutPath('taskCopy'), color: '#909399' },
    { name: '我的流程', icon: 'ep:list', url: resolveShortcutPath('processInstanceMy'), color: '#409EFF' },
    {
      name: '用户管理',
      icon: 'ep:user',
      url: resolveShortcutPath('systemUser'),
      color: '#1fdaca',
      perm: ['system:user:query']
    },
    {
      name: '部门管理',
      icon: 'ep:office-building',
      url: resolveShortcutPath('systemDept'),
      color: '#3fb27f',
      perm: ['system:dept:query']
    },
    {
      name: '公告管理',
      icon: 'ep:bell',
      url: resolveShortcutPath('systemNotice'),
      color: '#ff6b6b',
      perm: ['system:notice:query']
    },
    {
      name: '签到打卡',
      icon: 'ep:check',
      url: 'clock',
      color: '#67C23A',
      perm: ['system:attendance-record:clock']
    }
  ]
  return all.filter((item) => {
    if (!item.perm) return true
    return checkPermi(item.perm)
  })
})

// 流程办理统计图（近7天，使用已办数据或 mock）
const processChartOptions = reactive<EChartsOption>({
  tooltip: { trigger: 'axis' },
  grid: { left: 50, right: 20, bottom: 30, top: 20 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisTick: { alignWithLabel: true }
  },
  yAxis: { type: 'value', name: '数量' },
  series: [
    { name: '已办任务', type: 'bar', data: [0, 0, 0, 0, 0, 0, 0], itemStyle: { color: '#67C23A' } }
  ]
})

/** 获取待办、已办、进行中数量 */
const fetchCounts = async () => {
  try {
    const [todoRes, doneRes, runningRes] = await Promise.all([
      TaskApi.getTaskTodoPage({ pageNo: 1, pageSize: 1 }),
      TaskApi.getTaskDonePage({ pageNo: 1, pageSize: 1 }),
      ProcessInstanceApi.getProcessInstanceMyPage({ pageNo: 1, pageSize: 1, status: 1 })
    ])
    totalState.todo = todoRes.total ?? 0
    totalState.done = doneRes.total ?? 0
    totalState.running = runningRes.total ?? 0
  } catch {
    totalState.todo = 0
    totalState.done = 0
    totalState.running = 0
  }
}

/** 获取待办列表 */
const fetchTodoList = async () => {
  try {
    const res = await TaskApi.getTaskTodoPage({
      pageNo: 1,
      pageSize: TODO_PAGE_SIZE
    })
    todoList.value = res.list ?? []
  } catch {
    todoList.value = []
  }
}

/** 获取公告列表 */
const fetchNoticeList = async () => {
  try {
    const res = await NoticeApi.getNoticePage({
      pageNo: 1,
      pageSize: NOTICE_PAGE_SIZE
    })
    noticeList.value = res.list ?? []
  } catch {
    noticeList.value = []
  }
}

/** 初始化流程图（简化：用已办总数分摊到近7天） */
const initProcessChart = async () => {
  try {
    const res = await TaskApi.getTaskDonePage({ pageNo: 1, pageSize: 100 })
    const list = res.list ?? []
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    const now = new Date()
    list.forEach((item: any) => {
      const ct = item.endTime || item.createTime
      if (!ct) return
      const d = new Date(ct)
      const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
      if (diff >= 0 && diff < 7) {
        const idx = 6 - diff
        if (idx >= 0) dayCounts[idx] = (dayCounts[idx] || 0) + 1
      }
    })
    set(processChartOptions, 'series', [
      {
        name: '已办任务',
        type: 'bar',
        data: dayCounts,
        itemStyle: { color: '#67C23A' }
      }
    ])
  } catch {
    // 保持默认
  }
}

const getAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchCounts(),
      fetchTodoList(),
      fetchNoticeList(),
      initProcessChart()
    ])
  } finally {
    loading.value = false
  }
}

const goToTodo = () => {
  router.push(resolveShortcutPath('taskTodo'))
}

const goToNotice = () => {
  router.push(resolveShortcutPath('systemNotice'))
}

const handleTodoClick = (item: any) => {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: item.processInstance?.id,
      taskId: item.id
    }
  })
}

const noticeDetailVisible = ref(false)
const noticeDetail = ref<NoticeApi.NoticeVO | null>(null)

const handleNoticeClick = async (item: NoticeApi.NoticeVO) => {
  try {
    const data = await NoticeApi.getNotice(item.id as number)
    noticeDetail.value = data
    noticeDetailVisible.value = true
  } catch {}
}

const handleShortcutClick = async (item: { url: string; name?: string }) => {
  if (item.url === 'clock') {
    handleClockIn()
    return
  }
  if (item.url.startsWith('/')) {
    router.push(item.url)
  } else {
    router.push(item.url)
  }
}

// 今日打卡
const clockCardVisible = ref(false)
const todayClockIn = ref(false)
const todayClockOut = ref(false)
const clockLoading = ref(false)

const fetchClockStatus = async () => {
  try {
    const data = await PersonalCenterApi.getPersonalCenterPanel()
    clockCardVisible.value = !!data
    todayClockIn.value = data?.todayClockIn ?? false
    todayClockOut.value = data?.todayClockOut ?? false
  } catch {
    clockCardVisible.value = false
  }
}

const handleClockIn = async () => {
  clockLoading.value = true
  try {
    await PersonalCenterApi.personalCenterClockIn()
    useMessage().success('签到成功')
    await fetchClockStatus()
  } catch (e: any) {
    useMessage().error(e?.message || '签到失败')
  } finally {
    clockLoading.value = false
  }
}

const handleClockOut = async () => {
  clockLoading.value = true
  try {
    await PersonalCenterApi.personalCenterClockOut()
    useMessage().success('签退成功')
    await fetchClockStatus()
  } catch (e: any) {
    useMessage().error(e?.message || '签退失败')
  } finally {
    clockLoading.value = false
  }
}

getAllData()
fetchClockStatus()
</script>
