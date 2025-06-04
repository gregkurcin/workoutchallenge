import { google } from 'googleapis'
import { Workout, WorkoutType, calculateDayOfWeek } from '@/types/workout'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
// Default to "Workouts" tab - this is the master data tab
// The "Staging" tab is for manual bulk upload preparation and is not used by the app
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Workouts'

// Initialize Google Sheets API
const getGoogleSheetsInstance = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

// Reads from the "Workouts" tab (master data) for dashboard display
export const getWorkouts = async (): Promise<Workout[]> => {
  try {
    const sheets = getGoogleSheetsInstance()
    
    // Read from master data tab: personName, workoutType, startTime, endTime, duration, date
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return []
    }

    // Skip header row and map data to match user's sheet structure
    return rows.slice(1).map((row, index): Workout => ({
      id: `workout-${index}`,
      personName: row[0] || '',
      workoutType: (row[1] as WorkoutType) || 'Gym',
      startTime: row[2] || '',
      endTime: row[3] || '',
      duration: parseInt(row[4]) || 0,
      date: row[5] || '',
      dayOfWeek: row[5] ? calculateDayOfWeek(row[5]) : '', // Calculate from date
    }))
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return []
  }
}

// Writes to the "Workouts" tab (master data) for all app entries
export const addWorkout = async (workout: Omit<Workout, 'dayOfWeek' | 'id'>): Promise<boolean> => {
  try {
    const sheets = getGoogleSheetsInstance()
    
    // Add to master data tab: personName, workoutType, startTime, endTime, duration, date
    const values = [
      [
        workout.personName,
        workout.workoutType,
        workout.startTime || '',
        workout.endTime || '',
        workout.duration,
        workout.date,
      ],
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

    return true
  } catch (error) {
    console.error('Error adding workout:', error)
    return false
  }
} 