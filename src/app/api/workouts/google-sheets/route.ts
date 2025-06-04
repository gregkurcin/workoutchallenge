import { NextResponse } from 'next/server'
import { getWorkouts } from '@/lib/googleSheets'

export async function GET() {
  try {
    // Load workouts from Google Sheets "Workouts" tab
    const workouts = await getWorkouts()
    
    // Add debugging information
    console.log('Raw workouts from Google Sheets:', JSON.stringify(workouts, null, 2))
    
    return NextResponse.json({
      success: true,
      workouts,
      message: `Loaded ${workouts.length} workouts from Google Sheets`,
      debug: {
        totalWorkouts: workouts.length,
        firstWorkout: workouts[0] || null
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
        workouts: []
      },
      { status: 500 }
    )
  }
} 