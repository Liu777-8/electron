<template>
  <div class="calendar-container">
    <!-- 日历头部 -->
    <div class="calendar-header">
      <button class="nav-btn" @click="previousMonth">
        <span>‹</span>
      </button>
      <h3 class="month-year">{{ currentYear }}年{{ currentMonth }}月</h3>
      <button class="nav-btn" @click="nextMonth">
        <span>›</span>
      </button>
    </div>

    <!-- 星期标题 -->
    <div class="weekdays">
      <div class="weekday" v-for="day in weekdays" :key="day">
        {{ day }}
      </div>
    </div>

    <!-- 日期网格 -->
    <div class="calendar-grid">
      <div
        v-for="date in calendarDates"
        :key="date.key"
        :class="[
          'calendar-date',
          {
            'other-month': !date.isCurrentMonth,
            today: date.isToday,
            'has-festival': date.festival,
          },
        ]"
        @click="selectDate(date)"
      >
        <span class="date-number">{{ date.day }}</span>
        <div v-if="date.festival" class="festival-info">
          <span class="festival-name">{{ date.festival }}</span>
        </div>
      </div>
    </div>

    <!-- 节日详情已整合到天气弹窗中 -->

    <!-- 天气信息弹窗 -->
    <div
      v-if="showWeatherModal"
      class="weather-modal"
      @click="closeWeatherModal"
    >
      <div class="weather-content" @click.stop>
        <div
          class="weather-header"
          :class="{ 'festival-header-style': selectedDate?.festival }"
        >
          <h4>
            <span class="weather-icon">{{
              selectedDate?.festival ? "🎉" : "🌤️"
            }}</span>
            {{ selectedDate?.year }}年{{ selectedDate?.month }}月{{
              selectedDate?.day
            }}日 天气预报
          </h4>
          <div class="header-buttons">
            <button 
              class="refresh-btn" 
              @click="refreshWeatherData" 
              :disabled="isLoadingWeather"
              title="刷新天气数据"
            >
              🔄
            </button>
            <button class="close-btn" @click="closeWeatherModal">×</button>
          </div>
        </div>

        <div class="weather-body">
          <!-- 节日信息 -->
          <div v-if="selectedDate?.festival" class="festival-info-section">
            <div class="festival-title">
              <span class="festival-icon">🎊</span>
              <h3>{{ selectedDate.festival }}</h3>
            </div>
            <p class="festival-description">
              {{ getFestivalDescription(selectedDate.festival) }}
            </p>
            <div class="festival-divider"></div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoadingWeather" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在获取天气信息...</p>
          </div>

          <!-- 天气数据 -->
          <div v-else-if="weatherData" class="weather-data">
            <div class="weather-location" @click="openCitySelector">
              <span class="location-icon">📍</span>
              <span class="city-name-clickable"
                >{{ weatherData.province }} {{ weatherData.city }}</span
              >
              <span class="change-city-hint">点击切换城市</span>
            </div>

            <div class="weather-forecast">
              <div
                v-for="(cast, index) in weatherData.casts"
                :key="index"
                class="forecast-item"
              >
                <div class="forecast-date">
                  <span class="date-text">{{ cast.date }}</span>
                  <span class="weekday-text">{{ getWeekDay(cast.date) }}</span>
                </div>

                <div class="forecast-weather">
                  <div class="weather-icon-large">
                    {{ getWeatherIcon(cast.dayweather) }}
                  </div>
                  <div class="weather-desc">
                    <div class="day-weather">{{ cast.dayweather }}</div>
                    <div class="night-weather">{{ cast.nightweather }}</div>
                  </div>
                </div>

                <div class="forecast-temp">
                  <span class="temp-high">{{ cast.daytemp }}°</span>
                  <span class="temp-low">{{ cast.nighttemp }}°</span>
                </div>

                <div class="forecast-wind">
                  <div class="wind-info">
                    {{ cast.daywind }} {{ cast.daypower }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 错误状态 -->
          <div v-else class="error-state">
            <div class="error-icon">⚠️</div>
            <p>获取天气信息失败，请稍后重试</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 城市选择器弹窗 -->
    <div v-if="showCitySelector" class="city-modal" @click="closeCitySelector">
      <div class="city-content" @click.stop>
        <div class="city-header">
          <h4>
            <span class="city-icon">🏙️</span>
            选择城市
          </h4>
          <button class="close-btn" @click="closeCitySelector">×</button>
        </div>

        <div class="city-body">
          <div class="city-search">
            <input
              type="text"
              placeholder="搜索城市名称..."
              class="city-search-input"
              v-model="citySearchQuery"
            />
          </div>

          <div class="city-list">
            <div
              v-for="city in filteredCityList"
              :key="city.adcode"
              class="city-item"
              :class="{ selected: city.name === selectedCity }"
              @click="selectCity(city.name)"
            >
              <span class="city-name">{{ city.name }}</span>
              <span v-if="city.name === selectedCity" class="selected-icon"
                >✓</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getWeatherForecast } from "../api/weather.js";

// 响应式数据
const currentDate = ref(new Date());
const selectedDate = ref(null);
const weatherData = ref(null);
const isLoadingWeather = ref(false);
const showWeatherModal = ref(false);
const showCitySelector = ref(false); // 城市选择器显示状态
const selectedCity = ref("嘉兴市"); // 当前选择的城市
const cityList = ref([]); // 城市列表数据
const citySearchQuery = ref(""); // 城市搜索关键词

// 天气数据缓存相关
const weatherCache = ref(new Map()); // 天气数据缓存 Map<cityName, {data, timestamp}>
const CACHE_DURATION = 60 * 60 * 1000; // 缓存时长：1小时（毫秒）

// 星期标题
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

// 节日数据（包含传统节日和现代节日）
const festivals = {
  "1-1": "元旦",
  "2-14": "情人节",
  "3-8": "妇女节",
  "3-12": "植树节",
  "4-1": "愚人节",
  "4-5": "清明节",
  "5-1": "劳动节",
  "5-4": "青年节",
  "6-1": "儿童节",
  "7-1": "建党节",
  "8-1": "建军节",
  "9-10": "教师节",
  "10-1": "国庆节",
  "12-25": "圣诞节",
};

// 节日描述
const festivalDescriptions = {
  元旦: "新年的第一天，象征着新的开始和希望。",
  情人节: "表达爱意的浪漫节日，情侣们互赠礼物表达爱意。",
  妇女节: "庆祝女性在社会、经济、文化和政治等领域贡献的节日。",
  植树节: "倡导植树造林，保护环境的节日。",
  愚人节: "西方传统节日，人们会开一些无伤大雅的玩笑。",
  清明节: "中国传统节日，祭祖扫墓，踏青赏春的日子。",
  劳动节: "庆祝劳动者贡献的国际性节日。",
  青年节: "纪念五四运动，弘扬青年精神的节日。",
  儿童节: "关爱儿童，保护儿童权益的节日。",
  建党节: "中国共产党成立纪念日。",
  建军节: "中国人民解放军建军纪念日。",
  教师节: "感谢教师辛勤付出的节日。",
  国庆节: "庆祝中华人民共和国成立的节日。",
  圣诞节: "基督教纪念耶稣诞生的节日，现已成为国际性节日。",
};

// 计算属性
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

// 过滤后的城市列表
const filteredCityList = computed(() => {
  if (!citySearchQuery.value.trim()) {
    return cityList.value;
  }
  return cityList.value.filter((city) =>
    city.name.toLowerCase().includes(citySearchQuery.value.toLowerCase())
  );
});

// 生成日历日期数据
const calendarDates = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const today = new Date();

  // 当月第一天和最后一天
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // 计算需要显示的日期范围
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = `${current.getMonth() + 1}-${current.getDate()}`;
    const isCurrentMonth = current.getMonth() === month - 1;
    const isToday =
      current.getFullYear() === today.getFullYear() &&
      current.getMonth() === today.getMonth() &&
      current.getDate() === today.getDate();

    dates.push({
      key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`,
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate(),
      isCurrentMonth,
      isToday,
      festival: festivals[dateKey] || null,
    });

    current.setDate(current.getDate() + 1);
  }

  return dates;
});

// 方法
const previousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
};

const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
};

const selectDate = async (date) => {
  selectedDate.value = date;

  // 统一获取天气信息，无论是否为节日
  await getWeatherInfo(date);
};

// 获取天气信息的方法
const getWeatherInfo = async (date, forceRefresh = false) => {
  try {
    isLoadingWeather.value = true;
    showWeatherModal.value = true;

    // 禁止底部滚动
    document.body.style.overflow = "hidden";

    const cityName = selectedCity.value;
    const now = Date.now();

    // 检查缓存是否存在且未过期（除非强制刷新）
    if (!forceRefresh && weatherCache.value.has(cityName)) {
      const cached = weatherCache.value.get(cityName);
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log("使用缓存的天气数据:", cityName);
        weatherData.value = {
          ...cached.data,
          selectedDate: date,
        };
        return;
      }
    }

    console.log("获取新的天气数据:", cityName);
    // 使用当前选择的城市获取新数据
    const response = await getWeatherForecast(cityName);

    if (response && response.forecasts && response.forecasts.length > 0) {
      const newWeatherData = {
        city: response.forecasts[0].city,
        province: response.forecasts[0].province,
        casts: response.forecasts[0].casts.slice(0, 5), // 只取前5天
      };

      // 缓存新数据
      weatherCache.value.set(cityName, {
        data: newWeatherData,
        timestamp: now,
      });

      weatherData.value = {
        ...newWeatherData,
        selectedDate: date,
      };
    }
  } catch (error) {
    console.error("获取天气信息失败:", error);
    weatherData.value = null;
  } finally {
    isLoadingWeather.value = false;
  }
};

// 刷新天气数据
const refreshWeatherData = async () => {
  if (selectedDate.value) {
    await getWeatherInfo(selectedDate.value, true); // 强制刷新
  }
};

// 关闭天气弹窗
const closeWeatherModal = () => {
  showWeatherModal.value = false;
  weatherData.value = null;
  selectedDate.value = null;

  // 恢复底部滚动
  document.body.style.overflow = "auto";
};

// 打开城市选择器
const openCitySelector = () => {
  showCitySelector.value = true;
};

// 关闭城市选择器
const closeCitySelector = () => {
  showCitySelector.value = false;
  citySearchQuery.value = ""; // 清空搜索关键词
};

// 选择城市
const selectCity = async (cityName) => {
  selectedCity.value = cityName;
  closeCitySelector();

  // 如果天气弹窗已打开，重新获取天气信息（强制刷新以获取新城市数据）
  if (showWeatherModal.value && selectedDate.value) {
    await getWeatherInfo(selectedDate.value, true);
  }
};

// 加载城市数据
const loadCityData = async () => {
  try {
    const response = await fetch("/adcode_citycode.json");
    const data = await response.json();

    // 过滤出主要城市（省会城市和直辖市）
    const majorCities = data
      .filter((item) => {
        // 获取adcode，判断是否为地级市（6位数且后4位为00）
        const adcode = item.adcode.toString();
        return (
          adcode.length === 6 &&
          adcode.endsWith("00") &&
          adcode !== "100000" &&
          item.name.includes("市")
        );
      })
      .map((item) => ({
        name: item.name.replace("市", ""), // 移除"市"字
        adcode: item.adcode,
        citycode: item.citycode,
      }));

    // 添加一些热门城市
    const hotCities = [
      { name: "北京", adcode: 110000, citycode: "010" },
      { name: "上海", adcode: 310000, citycode: "021" },
      { name: "广州", adcode: 440100, citycode: "020" },
      { name: "深圳", adcode: 440300, citycode: "0755" },
      { name: "杭州", adcode: 330100, citycode: "0571" },
      { name: "南京", adcode: 320100, citycode: "025" },
      { name: "成都", adcode: 510100, citycode: "028" },
      { name: "武汉", adcode: 420100, citycode: "027" },
      { name: "西安", adcode: 610100, citycode: "029" },
      { name: "重庆", adcode: 500000, citycode: "023" },
    ];

    // 合并热门城市和其他城市，去重
    const allCities = [...hotCities];
    majorCities.forEach((city) => {
      if (!allCities.find((hot) => hot.name === city.name)) {
        allCities.push(city);
      }
    });

    cityList.value = allCities.sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN")
    );
  } catch (error) {
    console.error("加载城市数据失败:", error);
    // 如果加载失败，使用默认城市列表
    cityList.value = [
      { name: "北京", adcode: 110000, citycode: "010" },
      { name: "上海", adcode: 310000, citycode: "021" },
      { name: "广州", adcode: 440100, citycode: "020" },
      { name: "深圳", adcode: 440300, citycode: "0755" },
      { name: "杭州", adcode: 330100, citycode: "0571" },
      { name: "南京", adcode: 320100, citycode: "025" },
      { name: "成都", adcode: 510100, citycode: "028" },
      { name: "武汉", adcode: 420100, citycode: "027" },
      { name: "西安", adcode: 610100, citycode: "029" },
      { name: "重庆", adcode: 500000, citycode: "023" },
    ];
  }
};

// 格式化天气图标
const getWeatherIcon = (weather) => {
  const weatherIcons = {
    晴: "☀️",
    多云: "⛅",
    阴: "☁️",
    小雨: "🌦️",
    中雨: "🌧️",
    大雨: "⛈️",
    雪: "❄️",
    雾: "🌫️",
    霾: "😷",
  };

  for (const key in weatherIcons) {
    if (weather.includes(key)) {
      return weatherIcons[key];
    }
  }
  return "🌤️"; // 默认图标
};

// 获取星期几
const getWeekDay = (dateStr) => {
  const date = new Date(dateStr);
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekDays[date.getDay()];
};

const getFestivalDescription = (festivalName) => {
  return festivalDescriptions[festivalName] || "暂无描述";
};

// 组件挂载时初始化
onMounted(() => {
  // 加载城市数据
  loadCityData();
});

// 组件卸载时恢复滚动
onUnmounted(() => {
  // 确保页面卸载时恢复滚动
  document.body.style.overflow = "auto";
});
</script>

<style scoped>
.calendar-container {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
}

/* 日历头部 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.nav-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: bold;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
}

.month-year {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* 星期标题 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  padding: 6px 0;
  font-weight: 600;
  color: #5a6c7d;
  background: #f8f9fa;
  border-radius: 3px;
  font-size: 0.8rem;
}

/* 日期网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.calendar-date {
  min-height: 35px;
  padding: 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: #fafbfc;
}

.calendar-date:hover {
  background: #e3f2fd;
  transform: translateY(-1px);
}

.calendar-date.other-month {
  opacity: 0.3;
}

.calendar-date.today {
  color: #667eea;
}

.calendar-date.today .date-number {
  color: #667eea;
  font-weight: bold;
}

.calendar-date.has-festival {
  cursor: pointer;
}

.calendar-date.has-festival:hover {
  background: #e3f2fd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.date-number {
  font-size: 0.8rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 1px;
}

.festival-info {
  text-align: center;
}

.festival-name {
  font-size: 0.55rem;
  font-weight: 500;
  color: #28a745; /* 改为绿色以保持节日的标识性 */
  line-height: 1.1;
}

/* 原节日弹窗样式已移除，节日信息已整合到天气弹窗中 */

/* 天气弹窗样式 */
.weather-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.weather-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden; /* 移除弹窗本身的滚动条 */
}

.weather-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px 16px 0 0;
  transition: background 0.3s ease;
}

/* 节日头部样式 */
.festival-header-style {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.weather-header h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-icon {
  font-size: 1.4rem;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(180deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  font-weight: bold;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.weather-body {
  padding: 24px;
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 在内容区域显示滚动条 */
  min-height: 0; /* 确保flex子元素可以收缩 */
}

/* 节日信息部分 */
.festival-info-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.festival-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.festival-icon {
  font-size: 1.6rem;
}

.festival-title h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #28a745;
}

.festival-description {
  color: #5a6c7d;
  line-height: 1.6;
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  padding-left: 5px;
  border-left: 3px solid #28a745;
  padding-left: 12px;
}

.festival-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(32, 201, 151, 0.5),
    rgba(40, 167, 69, 0.1)
  );
  margin: 16px 0;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4facfe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #666;
  margin: 0;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-state p {
  color: #666;
  margin: 0;
}

/* 自定义滚动条样式 */
.weather-forecast::-webkit-scrollbar {
  width: 6px;
}

.weather-forecast::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.weather-forecast::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.weather-forecast::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 天气数据 */
.weather-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.weather-location:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.location-icon {
  font-size: 1.2rem;
}

.city-name-clickable {
  flex: 1;
}

.change-city-hint {
  font-size: 0.8rem;
  color: #6c757d;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.weather-location:hover .change-city-hint {
  opacity: 1;
}

.weather-forecast {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 8px; /* 为滚动条留出空间 */
}

.forecast-item {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.forecast-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.forecast-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.weekday-text {
  color: #6c757d;
  font-size: 0.8rem;
}

.forecast-weather {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weather-icon-large {
  font-size: 2rem;
}

.weather-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-weather {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.night-weather {
  color: #6c757d;
  font-size: 0.8rem;
}

.forecast-temp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.temp-high {
  font-weight: 600;
  color: #dc3545;
  font-size: 1.1rem;
}

.temp-low {
  color: #007bff;
  font-size: 0.9rem;
}

.forecast-wind {
  text-align: center;
}

.wind-info {
  color: #6c757d;
  font-size: 0.8rem;
  line-height: 1.4;
}

/* 城市选择器样式 */
.city-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001; /* 比天气弹窗更高 */
}

.city-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.city-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px 16px 0 0;
}

.city-header h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-icon {
  font-size: 1.4rem;
}

.city-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.city-search {
  margin-bottom: 16px;
}

.city-search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.city-search-input:focus {
  outline: none;
  border-color: #667eea;
}

.city-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f8f9fa;
}

.city-item:last-child {
  border-bottom: none;
}

.city-item:hover {
  background: #f8f9fa;
}

.city-item.selected {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
}

.city-name {
  flex: 1;
}

.selected-icon {
  color: #1976d2;
  font-weight: bold;
  font-size: 1.2rem;
}

/* 城市列表滚动条样式 */
.city-list::-webkit-scrollbar {
  width: 6px;
}

.city-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.city-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.city-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 10px;
    margin-bottom: 12px;
  }

  .month-year {
    font-size: 1rem;
  }

  .calendar-date {
    min-height: 30px;
    padding: 3px;
  }

  .date-number {
    font-size: 0.75rem;
  }

  .festival-name {
    font-size: 0.5rem;
  }

  .festival-content {
    width: 95%;
  }

  .weather-content {
    width: 95%;
    max-height: 85vh;
  }

  .weather-header {
    padding: 16px 20px;
  }

  .weather-header h4 {
    font-size: 1.1rem;
  }

  .weather-body {
    padding: 20px;
  }

  .weather-forecast {
    /* max-height: 250px; 移动端减小高度 */
    padding-right: 4px; /* 移动端减小滚动条空间 */
  }

  .weather-forecast::-webkit-scrollbar {
    width: 4px; /* 移动端更细的滚动条 */
  }

  .forecast-item {
    grid-template-columns: 1fr;
    gap: 12px;
    text-align: center;
  }

  .forecast-weather {
    justify-content: center;
  }

  .forecast-temp {
    flex-direction: row;
    justify-content: center;
    gap: 8px;
  }

  /* 城市选择器移动端样式 */
  .city-content {
    width: 95%;
    max-height: 80vh;
  }

  .city-header {
    padding: 16px 20px;
  }

  .city-header h4 {
    font-size: 1.1rem;
  }

  .city-body {
    padding: 16px;
  }

  .city-search-input {
    padding: 10px 14px;
    font-size: 0.9rem;
  }

  .city-list {
    max-height: 250px;
  }

  .city-item {
    padding: 10px 14px;
  }

  .change-city-hint {
    display: none; /* 移动端隐藏提示文字 */
  }
}
</style>
