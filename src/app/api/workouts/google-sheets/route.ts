import { NextResponse } from 'next/server'
import { getWorkouts } from '@/lib/googleSheets'
import { google } from 'googleapis'

// Trigger deployment with updated private key format - v4 (base64)
export async function GET() {
  try {
    // First, let's get the raw data directly to debug
    const SHEET_ID = process.env.GOOGLE_SHEET_ID
    const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Workouts'
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Get raw data for debugging
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
    })

    const rawRows = response.data.values
    
    // Load workouts from Google Sheets "Workouts" tab
    const workouts = await getWorkouts()
    
    return NextResponse.json({
      success: true,
      workouts,
      message: `Loaded ${workouts.length} workouts from Google Sheets`,
      debug: {
        totalWorkouts: workouts.length,
        firstWorkout: workouts[0] || null,
        rawData: rawRows,
        sheetId: SHEET_ID,
        sheetName: SHEET_NAME,
        numberOfRawRows: rawRows?.length || 0
      }
    })
  } catch (error) {
    console.error('Error loading from Google Sheets:', error)
    
    // Provide helpful error messages based on common issues
    let errorMessage = 'Failed to load from Google Sheets'
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = 'Network error - check your internet connection'
      } else if (error.message.includes('credentials') || error.message.includes('authentication')) {
        errorMessage = 'Authentication failed - check your Google service account credentials'
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        errorMessage = 'Permission denied - make sure you shared the sheet with your service account'
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        errorMessage = 'Sheet not found - check your GOOGLE_SHEET_ID and GOOGLE_SHEET_NAME'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        workouts: [],
        debug: {
          sheetId: process.env.GOOGLE_SHEET_ID,
          sheetName: process.env.GOOGLE_SHEET_NAME || 'Workouts'
        }
      },
      { status: 500 }
    )
  }
} 