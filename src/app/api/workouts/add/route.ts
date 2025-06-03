import { NextRequest, NextResponse } from 'next/server'
import { addWorkout } from '@/lib/googleSheets'
import { Workout } from '@/types/workout'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workout: Omit<Workout, 'dayOfWeek'> = body
    
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Google Sheets not configured, simulating success for demo')
      return NextResponse.json({ success: true, message: 'Demo mode: Workout would be added to Google Sheets' })
    }

    const success = await addWorkout(workout)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to add workout' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error adding workout:', error)
    return NextResponse.json({ error: 'Failed to add workout' }, { status: 500 })
  }
} 