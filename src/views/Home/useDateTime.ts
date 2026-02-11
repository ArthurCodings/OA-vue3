import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { Solar } from 'lunar-javascript'

dayjs.locale('zh-cn')

const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function useDateTime() {
  const currentTime = ref('')
  const weekDay = ref('')
  const solarDate = ref('')
  const lunarDate = ref('')

  const update = () => {
    const now = new Date()
    currentTime.value = dayjs(now).format('HH:mm:ss')
    weekDay.value = WEEK_DAYS[now.getDay()]
    solarDate.value = dayjs(now).format('YYYY年MM月DD日')
    try {
      const solar = Solar.fromDate(now)
      lunarDate.value = solar.getLunar().toString()
    } catch {
      lunarDate.value = ''
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    update()
    timer = setInterval(update, 1000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { currentTime, weekDay, solarDate, lunarDate }
}
