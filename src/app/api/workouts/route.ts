import { NextResponse } from 'next/server'
import { getWorkouts } from '@/lib/googleSheets'
import { demoWorkouts } from '@/lib/demoData'

export async function GET() {
  try {
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Google Sheets not configured, using demo data')
      return NextResponse.json(demoWorkouts)
    }

    const workouts = await getWorkouts()
    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    console.log('Falling back to demo data')
    return NextResponse.json(demoWorkouts)
  }
} 