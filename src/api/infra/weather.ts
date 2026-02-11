/** 无锡市滨湖区天气 - 使用 wttr.in 免费接口（固定无锡） */
const WUXI_CITY = 'Wuxi'

const WEATHER_DESC_MAP: Record<string, string> = {
  Sunny: '晴',
  Clear: '晴',
  'Partly cloudy': '多云',
  Cloudy: '阴',
  Overcast: '阴',
  Fog: '雾',
  Mist: '雾',
  'Patchy rain': '小雨',
  'Light rain': '小雨',
  Rain: '雨',
  'Heavy rain': '大雨',
  Snow: '雪',
  'Light snow': '小雪',
  'Heavy snow': '大雪',
  Thunder: '雷雨'
}

function mapWeatherDesc(en: string): string {
  for (const [key, value] of Object.entries(WEATHER_DESC_MAP)) {
    if (en.includes(key)) return value
  }
  return en || '--'
}

export interface WeatherInfo {
  temp: string
  desc: string
  text: string
}

export async function getWuxiWeather(): Promise<WeatherInfo | null> {
  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(WUXI_CITY)}?format=j1`,
      { headers: { 'Accept-Language': 'zh-CN' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const cur = data.current_condition?.[0]
    if (!cur) return null
    const temp = cur.temp_C ?? '--'
    const desc = mapWeatherDesc(cur.weatherDesc?.[0]?.value || '')
    return {
      temp: String(temp),
      desc,
      text: `${desc} ${temp}℃`
    }
  } catch {
    return null
  }
}
