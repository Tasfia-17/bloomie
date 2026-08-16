'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Moon,
  Footprints,
  Droplets,
  Sun,
  Cloud,
  Coffee,
  Music,
  Calendar,
  Utensils,
  Sparkles,
  Check,
} from 'lucide-react'
import { BlurFade } from '@/components/shared/blur-fade'
import { BottomNav } from '@/components/shared/bottom-nav'
import { BloomieChat } from '@/components/shared/bloomie-chat'
import { api } from '@/lib/api'

interface TodayData {
  bodyStats: {
    heartRate: number
    sleepHours: number
    steps: number
    hydrationMl: number
  }
  thoughtOfTheDay: string
  quests: { id: string; title: string; completed: boolean }[]
  musicSuggestion: { title: string; artist: string; mood: string }
  nutritionOptions: string[]
}

interface WeatherData {
  temp: number
  condition: string
  emoji: string
}

interface CalendarData {
  totalEvents: number
  busyHours: number
  wellnessBreaks: { time: string; activity: string }[]
}

interface CaffeineData {
  totalMg: number
  limit: number
  drinks: { name: string; mg: number; time: string }[]
}

export default function TodayPage() {
  const [today, setToday] = useState<TodayData | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [calendar, setCalendar] = useState<CalendarData | null>(null)
  const [caffeine, setCaffeine] = useState<CaffeineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [todayRes, weatherRes, calendarRes, caffeineRes] = await Promise.all([
          api.getToday(),
          api.getWeather(),
          api.getCalendar(),
          api.getCaffeineSummary(),
        ])
        setToday(todayRes as unknown as TodayData)
        setWeather(weatherRes as unknown as WeatherData)
        setCalendar(calendarRes as unknown as CalendarData)
        setCaffeine(caffeineRes as unknown as CaffeineData)
      } catch (err) {
        console.error('Failed to load today data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-violet-500" />
        </motion.div>
      </div>
    )
  }

  const caffeinePercent = caffeine ? Math.min((caffeine.totalMg / caffeine.limit) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <BlurFade delay={0}>
          <div className="flex items-center gap-2">
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🌸
            </motion.span>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                Good Morning!
              </h1>
              <p className="text-sm text-gray-500">Here&apos;s your bloom for today</p>
            </div>
          </div>
        </BlurFade>
      </div>

      <div className="px-5 space-y-4">
        {/* Weather Widget */}
        <BlurFade delay={0.1}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-sky-100/80 to-blue-50/80 backdrop-blur-sm border border-sky-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {weather?.condition?.includes('cloud') ? (
                  <Cloud className="w-6 h-6 text-gray-500" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Weather</p>
                  <p className="text-xs text-gray-400">{weather?.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-sky-700">{weather?.temp}°</span>
                <span className="ml-2 text-2xl">{weather?.emoji}</span>
              </div>
            </div>
          </motion.div>
        </BlurFade>

        {/* Body Stats */}
        <BlurFade delay={0.2}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-br from-rose-50/80 to-pink-50/80 backdrop-blur-sm border border-rose-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="font-semibold text-gray-700">Body Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-white/60 rounded-xl p-3">
                <Heart className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs text-gray-500">Heart Rate</p>
                  <p className="font-bold text-gray-800">{today?.bodyStats.heartRate} bpm</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/60 rounded-xl p-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs text-gray-500">Sleep</p>
                  <p className="font-bold text-gray-800">{today?.bodyStats.sleepHours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/60 rounded-xl p-3">
                <Footprints className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Steps</p>
                  <p className="font-bold text-gray-800">
                    {today?.bodyStats.steps?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/60 rounded-xl p-3">
                <Droplets className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Hydration</p>
                  <p className="font-bold text-gray-800">{today?.bodyStats.hydrationMl}ml</p>
                </div>
              </div>
            </div>
          </motion.div>
        </BlurFade>

        {/* Bloomie's Thought of the Day */}
        <BlurFade delay={0.3}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-violet-100/80 to-purple-50/80 backdrop-blur-sm border border-violet-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h2 className="font-semibold text-gray-700">Bloomie&apos;s Thought</h2>
            </div>
            <motion.p
              className="text-sm text-gray-600 italic leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              &ldquo;{today?.thoughtOfTheDay}&rdquo;
            </motion.p>
            <div className="mt-2 text-right">
              <span className="text-xs text-violet-400">— Bloomie 🌷</span>
            </div>
          </motion.div>
        </BlurFade>

        {/* Calendar Load Summary */}
        <BlurFade delay={0.4}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-700">Today&apos;s Schedule</h2>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/60 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-500">Events</p>
                <p className="font-bold text-gray-800">{calendar?.totalEvents}</p>
              </div>
              <div className="bg-white/60 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-500">Busy Hours</p>
                <p className="font-bold text-gray-800">{calendar?.busyHours}h</p>
              </div>
            </div>
            {calendar?.wellnessBreaks && calendar.wellnessBreaks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-600">🧘 Wellness Breaks</p>
                {calendar.wellnessBreaks.map((wb, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-600 bg-white/40 rounded-lg px-2 py-1.5"
                  >
                    <span className="text-amber-500">{wb.time}</span>
                    <span>—</span>
                    <span>{wb.activity}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </BlurFade>

        {/* Nutrition Quick-Log */}
        <BlurFade delay={0.5}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-700">Quick Log</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(today?.nutritionOptions ?? ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Water']).map(
                (option) => (
                  <motion.button
                    key={option}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 hover:from-green-300 hover:to-emerald-300 transition-all shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option}
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        </BlurFade>

        {/* Caffeine Tracker */}
        <BlurFade delay={0.6}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-700" />
                <h2 className="font-semibold text-gray-700">Caffeine</h2>
              </div>
              <span className="text-xs text-gray-500">
                {caffeine?.totalMg ?? 0}mg / {caffeine?.limit ?? 400}mg
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200/60 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  caffeinePercent > 80
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : caffeinePercent > 50
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-green-400 to-emerald-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${caffeinePercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
              />
            </div>
            {caffeinePercent > 80 && (
              <p className="text-xs text-red-500 mt-2">
                ⚠️ Bloomie says: maybe switch to herbal tea? 🍵
              </p>
            )}
          </motion.div>
        </BlurFade>

        {/* Active Quests */}
        <BlurFade delay={0.7}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-700">Active Quests</h2>
            </div>
            <div className="space-y-2">
              {today?.quests?.map((quest) => (
                <motion.div
                  key={quest.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    quest.completed
                      ? 'bg-green-100/60 border border-green-200/50'
                      : 'bg-white/60 border border-gray-100'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      quest.completed
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300'
                    }`}
                  >
                    {quest.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span
                    className={`text-sm ${
                      quest.completed ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {quest.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </BlurFade>

        {/* Music Moment */}
        <BlurFade delay={0.8}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-r from-fuchsia-50/80 to-pink-50/80 backdrop-blur-sm border border-fuchsia-200/50 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-fuchsia-500" />
              <h2 className="font-semibold text-gray-700">Music Moment</h2>
            </div>
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Music className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className="font-medium text-gray-800">{today?.musicSuggestion?.title}</p>
                <p className="text-xs text-gray-500">{today?.musicSuggestion?.artist}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-fuchsia-100 text-fuchsia-600">
                  {today?.musicSuggestion?.mood}
                </span>
              </div>
            </div>
          </motion.div>
        </BlurFade>
      </div>

      {/* Bloomie Chat & Bottom Nav */}
      <BloomieChat />
      <BottomNav />
    </div>
  )
}
