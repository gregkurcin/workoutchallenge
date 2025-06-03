export interface Workout {
  dayOfWeek: string
  personName: string
  workoutType: 'Gym' | 'HIIT' | 'Cardio' | 'Activity'
  duration: number
  date: string
  name?: string
}

export interface WorkoutStats {
  totalWorkouts: number
  workoutsByWeek: { [week: string]: number }
  workoutsByMonth: { [month: string]: number }
  workoutsByQuarter: { [quarter: string]: number }
  workoutsByYear: { [year: string]: number }
  workoutsByType: { [type: string]: number }
}

export interface PersonStats extends WorkoutStats {
  personName: string
}

export interface LeaderboardEntry {
  personName: string
  totalWorkouts: number
  rank: number
}

export const PERSON_NAMES = [
  'Cortese',
  'Greg', 
  'JP',
  'Kyle',
  'Nick',
  'Amanda',
  'Niki',
  'Stu'
] as const

export type PersonName = typeof PERSON_NAMES[number]

export const WORKOUT_TYPES = ['Gym', 'HIIT', 'Cardio', 'Activity'] as const
export type WorkoutType = typeof WORKOUT_TYPES[number] 