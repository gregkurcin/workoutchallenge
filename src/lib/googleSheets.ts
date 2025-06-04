import { google } from 'googleapis'
import { Workout, WorkoutType, calculateDayOfWeek } from '@/types/workout'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
// Default to "Workouts" tab - this is the master data tab
// The "Staging" tab is for manual bulk upload preparation and is not used by the app
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Workouts'

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

// Initialize Google Sheets API
const getGoogleSheetsInstance = () => {
  // Decode the base64-encoded private key from Vercel environment
  let privateKey = process.env.GOOGLE_PRIVATE_KEY
  
  console.log('Original private key format check:', {
    hasKey: !!privateKey,
    startsWithBegin: privateKey?.startsWith('-----BEGIN'),
    length: privateKey?.length,
    firstChars: privateKey?.substring(0, 20)
  })
  
  // If the private key is base64 encoded (doesn't start with -----BEGIN), decode it
  if (privateKey && !privateKey.startsWith('-----BEGIN')) {
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8')
      console.log('Decoded base64 private key:', {
        startsWithBegin: privateKey.startsWith('-----BEGIN'),
        endsWithEnd: privateKey.endsWith('-----END PRIVATE KEY-----'),
        length: privateKey.length
      })
    } catch (error) {
      console.error('Error decoding base64 private key:', error)
      throw new Error('Invalid private key format')
    }
  }
  
  // Handle escaped newlines
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
    console.log('Processed escaped newlines in private key')
  }
  
  console.log('Final private key validation:', {
    startsWithBegin: privateKey?.startsWith('-----BEGIN'),
    endsWithEnd: privateKey?.endsWith('-----END PRIVATE KEY-----'),
    hasNewlines: privateKey?.includes('\n'),
    lineCount: privateKey?.split('\n').length
  })
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
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
    console.log('Raw Google Sheets data:', JSON.stringify(rows, null, 2))
    console.log('Number of rows:', rows?.length || 0)
    
    if (!rows || rows.length <= 1) {
      console.log('No data rows found (only headers or empty)')
      return []
    }

    // Skip header row and map data to match user's sheet structure
    const workouts = rows.slice(1).map((row, index): Workout => {
      console.log(`Processing row ${index}:`, row)
      const durationValue = row[4] || '0'
      const parsedDuration = parseDuration(durationValue)
      console.log(`Duration parsing: "${durationValue}" -> ${parsedDuration} minutes`)
      
      return {
        id: `workout-${index}`,
        personName: row[0] || '',
        workoutType: (row[1] as WorkoutType) || 'Gym',
        startTime: row[2] || '',
        endTime: row[3] || '',
        duration: parsedDuration,
        date: row[5] || '',
        dayOfWeek: row[5] ? calculateDayOfWeek(row[5]) : '', // Calculate from date
      }
    })
    
    console.log('Processed workouts:', JSON.stringify(workouts, null, 2))
    return workouts
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