import { google } from 'googleapis'
import { Workout, WorkoutType } from '@/types/workout'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
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

export const getWorkouts = async (): Promise<Workout[]> => {
  try {
    const sheets = getGoogleSheetsInstance()
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`, // Assuming columns A-F contain the data
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return []
    }

    // Skip header row and map data
    return rows.slice(1).map((row): Workout => ({
      dayOfWeek: row[0] || '',
      personName: row[1] || '',
      workoutType: (row[2] as WorkoutType) || 'Gym',
      duration: parseInt(row[3]) || 0,
      date: row[4] || '',
      name: row[5] || '',
    }))
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return []
  }
}

export const addWorkout = async (workout: Omit<Workout, 'dayOfWeek'>): Promise<boolean> => {
  try {
    const sheets = getGoogleSheetsInstance()
    
    // Get day of week from date
    const date = new Date(workout.date)
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
    
    const values = [
      [
        dayOfWeek,
        workout.personName,
        workout.workoutType,
        workout.duration,
        workout.date,
        workout.name || '',
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