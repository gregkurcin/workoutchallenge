import { Workout, WorkoutStats, PersonStats, LeaderboardEntry } from '@/types/workout'
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, parseISO } from 'date-fns'

export const calculateWorkoutStats = (workouts: Workout[]): WorkoutStats => {
  const stats: WorkoutStats = {
    totalWorkouts: workouts.length,
    workoutsByWeek: {},
    workoutsByMonth: {},
    workoutsByQuarter: {},
    workoutsByYear: {},
    workoutsByType: {},
  }

  workouts.forEach((workout) => {
    const date = parseISO(workout.date)
    
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
  })

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
    const date = parseISO(workout.date)
    const weekKey = format(startOfWeek(date), 'MMM dd')
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {}
    }
    
    weeklyData[weekKey][workout.personName] = (weeklyData[weekKey][workout.personName] || 0) + 1
  })
  
  return Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      ...data,
    }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

export const getCumulativeWorkoutData = (workouts: Workout[]) => {
  const sortedWorkouts = workouts
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const cumulativeData: { [date: string]: { [person: string]: number } } = {}
  const runningTotals: { [person: string]: number } = {}
  
  sortedWorkouts.forEach((workout) => {
    const dateKey = format(parseISO(workout.date), 'MMM dd')
    runningTotals[workout.personName] = (runningTotals[workout.personName] || 0) + 1
    
    if (!cumulativeData[dateKey]) {
      cumulativeData[dateKey] = { ...runningTotals }
    } else {
      cumulativeData[dateKey] = { ...cumulativeData[dateKey], ...runningTotals }
    }
  })
  
  return Object.entries(cumulativeData).map(([date, data]) => ({
    date,
    ...data,
  }))
} 