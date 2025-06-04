import { Workout, WorkoutStats, PersonStats, LeaderboardEntry } from '@/types/workout'
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, parseISO, parse } from 'date-fns'

// Helper function to safely parse dates in M/d/yyyy format
const parseWorkoutDate = (dateString: string): Date => {
  try {
    // First try to parse as M/d/yyyy format (e.g., "1/15/2025")
    const parsed = parse(dateString, 'M/d/yyyy', new Date())
    
    // If the parsed date is valid, return it
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    // Fallback to ISO parsing
    return parseISO(dateString)
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error)
    // Return current date as fallback
    return new Date()
  }
}

// Helper function to parse duration in H:MM format to decimal minutes
const parseDuration = (duration: string | number): number => {
  // If it's already a number, return it
  if (typeof duration === 'number') {
    return duration
  }
  
  // If it's a string, try to parse H:MM format
  if (typeof duration === 'string') {
    const trimmed = duration.trim()
    
    // Check if it's in H:MM or HH:MM format
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10)
      return hours * 60 + minutes
    }
    
    // Try to parse as a plain number
    const numericValue = parseFloat(trimmed)
    if (!isNaN(numericValue)) {
      return numericValue
    }
  }
  
  // Default fallback
  console.warn(`Could not parse duration: ${duration}`)
  return 0
}

export const calculateWorkoutStats = (workouts: Workout[]): WorkoutStats => {
  const stats: WorkoutStats = {
    totalWorkouts: workouts.length,
    workoutsByWeek: {},
    workoutsByMonth: {},
    workoutsByQuarter: {},
    workoutsByYear: {},
    workoutsByType: {},
    totalDuration: 0,
    averageDuration: 0,
  }

  let totalDurationMinutes = 0

  workouts.forEach((workout) => {
    try {
      const date = parseWorkoutDate(workout.date)
      const durationMinutes = parseDuration(workout.duration)
      
      totalDurationMinutes += durationMinutes
      
      // Week stats
      const weekKey = format(startOfWeek(date), 'yyyy-MM-dd')
      stats.workoutsByWeek[weekKey] = (stats.workoutsByWeek[weekKey] || 0) + 1
      
      // Month stats
      const monthKey = format(startOfMonth(date), 'yyyy-MM')
      stats.workoutsByMonth[monthKey] = (stats.workoutsByMonth[monthKey] || 0) + 1
      
      // Quarter stats
      const quarterKey = format(startOfQuarter(date), 'yyyy-QQ')
      stats.workoutsByQuarter[quarterKey] = (stats.workoutsByQuarter[quarterKey] || 0) + 1
      
      // Year stats
      const yearKey = format(startOfYear(date), 'yyyy')
      stats.workoutsByYear[yearKey] = (stats.workoutsByYear[yearKey] || 0) + 1
      
      // Type stats
      stats.workoutsByType[workout.workoutType] = (stats.workoutsByType[workout.workoutType] || 0) + 1
    } catch (error) {
      console.warn(`Error processing workout:`, workout, error)
    }
  })

  // Calculate totals and averages
  stats.totalDuration = totalDurationMinutes
  stats.averageDuration = workouts.length > 0 ? totalDurationMinutes / workouts.length : 0

  return stats
}

export const calculatePersonStats = (workouts: Workout[], personName: string): PersonStats => {
  const personWorkouts = workouts.filter(w => w.personName === personName)
  const stats = calculateWorkoutStats(personWorkouts)
  
  return {
    ...stats,
    personName,
  }
}

export const calculateLeaderboard = (workouts: Workout[]): LeaderboardEntry[] => {
  const personCounts: { [name: string]: number } = {}
  
  workouts.forEach((workout) => {
    personCounts[workout.personName] = (personCounts[workout.personName] || 0) + 1
  })
  
  const entries = Object.entries(personCounts)
    .map(([personName, totalWorkouts]) => ({
      personName,
      totalWorkouts,
      rank: 0, // Will be set below
    }))
    .sort((a, b) => b.totalWorkouts - a.totalWorkouts)
  
  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  return entries
}

export const getWorkoutsByWeekForChart = (workouts: Workout[]) => {
  const weeklyData: { [week: string]: { [person: string]: number } } = {}
  
  workouts.forEach((workout) => {
    try {
      const date = parseWorkoutDate(workout.date)
      const weekKey = format(startOfWeek(date), 'MMM dd')
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {}
      }
      
      weeklyData[weekKey][workout.personName] = (weeklyData[weekKey][workout.personName] || 0) + 1
    } catch (error) {
      console.warn(`Error processing workout for chart:`, workout, error)
    }
  })
  
  return Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      ...data,
    }))
    .sort((a, b) => {
      try {
        return new Date(a.week).getTime() - new Date(b.week).getTime()
      } catch (error) {
        return 0
      }
    })
}

export const getCumulativeWorkoutData = (workouts: Workout[]) => {
  const sortedWorkouts = workouts
    .slice()
    .sort((a, b) => {
      try {
        return parseWorkoutDate(a.date).getTime() - parseWorkoutDate(b.date).getTime()
      } catch (error) {
        return 0
      }
    })
  
  const cumulativeData: { [date: string]: { [person: string]: number } } = {}
  const runningTotals: { [person: string]: number } = {}
  
  sortedWorkouts.forEach((workout) => {
    try {
      const dateKey = format(parseWorkoutDate(workout.date), 'MMM dd')
      runningTotals[workout.personName] = (runningTotals[workout.personName] || 0) + 1
      
      if (!cumulativeData[dateKey]) {
        cumulativeData[dateKey] = { ...runningTotals }
      } else {
        cumulativeData[dateKey] = { ...cumulativeData[dateKey], ...runningTotals }
      }
    } catch (error) {
      console.warn(`Error processing workout for cumulative data:`, workout, error)
    }
  })
  
  return Object.entries(cumulativeData).map(([date, data]) => ({
    date,
    ...data,
  }))
} 