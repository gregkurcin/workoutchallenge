'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PERSON_NAMES, WORKOUT_TYPES, WorkoutType, PersonName, Workout } from '@/types/workout'
import { LogOut, Save, Camera, Upload, Sparkles, Edit3, FileSpreadsheet, Download, Eye, EyeOff, Database } from 'lucide-react'

interface AIWorkoutData {
  workoutType: WorkoutType
  startTime: string
  endTime: string
  duration: number
  date: string
  confidence: number
  extractedText: string
}

interface CSVWorkout {
  personName: PersonName
  workoutType: WorkoutType
  startTime: string
  endTime: string
  duration: number
  date: string
  isValid: boolean
  errors: string[]
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'image' | 'csv' | 'data'>('manual')
  const [formData, setFormData] = useState({
    personName: PERSON_NAMES[0] as PersonName,
    workoutType: WORKOUT_TYPES[0] as WorkoutType,
    startTime: '',
    endTime: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  
  // Image processing states
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [aiWorkoutData, setAiWorkoutData] = useState<AIWorkoutData | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // CSV processing states
  const [selectedCSV, setSelectedCSV] = useState<File | null>(null)
  const [csvWorkouts, setCsvWorkouts] = useState<CSVWorkout[]>([])
  const [isProcessingCSV, setIsProcessingCSV] = useState(false)
  const [showCSVPreview, setShowCSVPreview] = useState(false)
  const [csvStats, setCsvStats] = useState({ valid: 0, invalid: 0, total: 0 })

  // Data management states
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([])
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false)
  const [filters, setFilters] = useState({
    personName: '',
    workoutType: '',
    date: '',
    search: ''
  })
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Workout>>({})

  // Load all workouts when data tab is active
  useEffect(() => {
    if (activeTab === 'data' && isAuthenticated) {
      loadAllWorkouts()
    }
  }, [activeTab, isAuthenticated])

  // Filter workouts when filters change
  useEffect(() => {
    filterWorkouts()
  }, [allWorkouts, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllWorkouts = async () => {
    setIsLoadingWorkouts(true)
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        const data = await response.json()
        // Add IDs to workouts if they don't have them (for demo mode)
        const workoutsWithIds = (data.workouts || data || []).map((workout: Workout, index: number) => ({
          ...workout,
          id: workout.id || `workout-${index}`,
          startTime: workout.startTime || '09:00',
          endTime: workout.endTime || '10:00'
        }))
        setAllWorkouts(workoutsWithIds)
      } else {
        setMessage('Failed to load workout data')
      }
    } catch (error) {
      console.error('Error loading workouts:', error)
      setMessage('Error loading workout data')
    } finally {
      setIsLoadingWorkouts(false)
    }
  }

  const filterWorkouts = () => {
    let filtered = [...allWorkouts]

    if (filters.personName) {
      filtered = filtered.filter(w => w.personName === filters.personName)
    }
    if (filters.workoutType) {
      filtered = filtered.filter(w => w.workoutType === filters.workoutType)
    }
    if (filters.date) {
      filtered = filtered.filter(w => w.date === filters.date)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(w => 
        w.personName.toLowerCase().includes(searchLower) ||
        w.workoutType.toLowerCase().includes(searchLower) ||
        w.date.includes(searchLower) ||
        (w.name && w.name.toLowerCase().includes(searchLower))
      )
    }

    setFilteredWorkouts(filtered)
  }

  const startEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout)
    setEditFormData({
      personName: workout.personName,
      workoutType: workout.workoutType,
      startTime: workout.startTime,
      endTime: workout.endTime,
      duration: workout.duration,
      date: workout.date,
      name: workout.name
    })
  }

  const cancelEdit = () => {
    setEditingWorkout(null)
    setEditFormData({})
  }

  const saveEditWorkout = async () => {
    if (!editingWorkout) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/workouts/${editingWorkout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setMessage('Workout updated successfully!')
        loadAllWorkouts()
        cancelEdit()
      } else {
        setMessage('Failed to update workout')
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      setMessage('Error updating workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage('Workout deleted successfully!')
        loadAllWorkouts()
      } else {
        setMessage('Failed to delete workout')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      setMessage('Error deleting workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    
    // Handle both HH:MM:SS and HH:MM formats
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(':')
      if (parts.length === 2) {
        // HH:MM format
        const [hour, min] = parts.map(Number)
        return hour * 60 + min
      } else if (parts.length === 3) {
        // HH:MM:SS format
        const [hour, min, sec] = parts.map(Number)
        return hour * 60 + min + (sec / 60) // Convert seconds to fraction of minutes
      }
      return 0
    }
    
    const startMinutes = parseTime(startTime)
    const endMinutes = parseTime(endTime)
    
    return Math.round(endMinutes - startMinutes)
  }

  const handleEditTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newEditData = { ...editFormData, [field]: value }
    
    if (field === 'startTime' || field === 'endTime') {
      const duration = calculateDuration(
        field === 'startTime' ? value : editFormData.startTime || '',
        field === 'endTime' ? value : editFormData.endTime || ''
      )
      newEditData.duration = duration
    }
    
    setEditFormData(newEditData)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production, use proper authentication
    if (password === 'aitookmyjob') {
      setIsAuthenticated(true)
      setMessage('')
    } else {
      setMessage('Invalid password')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setAiWorkoutData(null)
      setShowConfirmation(false)
    }
  }

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setSelectedCSV(file)
      setCsvWorkouts([])
      setShowCSVPreview(false)
      setMessage('')
    } else {
      setMessage('Please select a valid CSV file')
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent = `personName,workoutType,startTime,endTime,duration,date
Greg,Gym,09:00:00,09:45:00,45,2024-01-15
Cortese,HIIT,18:00:00,18:30:00,30,2024-01-15
Greg,Cardio,07:00:00,08:00:00,60,2024-01-16
Cortese,Activity,12:00:00,12:25:00,25,2024-01-16`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workout_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const validateCSVRow = (row: Record<string, string>): CSVWorkout => {
    const errors: string[] = []
    
    // Validate person name (plain text - any value allowed)
    if (!row.personName || row.personName.trim() === '') {
      errors.push(`Person name is required`)
    }
    
    // Validate workout type (plain text - any value allowed)
    if (!row.workoutType || row.workoutType.trim() === '') {
      errors.push(`Workout type is required`)
    }
    
    // Validate start time (HH:MM:SS format)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
    if (!row.startTime || !timeRegex.test(row.startTime)) {
      errors.push(`Invalid start time: ${row.startTime} (use HH:MM:SS format, e.g., 09:00:00)`)
    }
    
    // Validate end time (HH:MM:SS format)
    if (!row.endTime || !timeRegex.test(row.endTime)) {
      errors.push(`Invalid end time: ${row.endTime} (use HH:MM:SS format, e.g., 10:30:00)`)
    }
    
    // Validate duration (plain text - any value allowed)
    if (!row.duration || row.duration.trim() === '') {
      errors.push(`Duration is required`)
    }
    
    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!row.date || !dateRegex.test(row.date)) {
      errors.push(`Invalid date format: ${row.date} (use YYYY-MM-DD)`)
    }

    // Convert duration to number for internal use, but keep original as string
    const durationNum = parseInt(row.duration) || 0

    return {
      personName: row.personName?.trim() as PersonName || '',
      workoutType: row.workoutType?.trim() as WorkoutType || 'Activity',
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      duration: durationNum,
      date: row.date || '',
      isValid: errors.length === 0,
      errors
    }
  }

  const processCSV = async () => {
    if (!selectedCSV) return

    setIsProcessingCSV(true)
    setMessage('')

    try {
      const text = await selectedCSV.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setMessage('CSV file must contain at least a header row and one data row')
        setIsProcessingCSV(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const expectedHeaders = ['personName', 'workoutType', 'startTime', 'endTime', 'duration', 'date']
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        setMessage(`Missing required columns: ${missingHeaders.join(', ')}`)
        setIsProcessingCSV(false)
        return
      }

      const workouts: CSVWorkout[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        
        workouts.push(validateCSVRow(row))
      }

      const validWorkouts = workouts.filter(w => w.isValid)
      const invalidWorkouts = workouts.filter(w => !w.isValid)

      setCsvWorkouts(workouts)
      setCsvStats({
        valid: validWorkouts.length,
        invalid: invalidWorkouts.length,
        total: workouts.length
      })
      setShowCSVPreview(true)
      setMessage(`Processed ${workouts.length} rows: ${validWorkouts.length} valid, ${invalidWorkouts.length} invalid`)

    } catch (error) {
      console.error('Error processing CSV:', error)
      setMessage('Error processing CSV file. Please check the format.')
    } finally {
      setIsProcessingCSV(false)
    }
  }

  const uploadCSVWorkouts = async () => {
    const validWorkouts = csvWorkouts.filter(w => w.isValid)
    
    if (validWorkouts.length === 0) {
      setMessage('No valid workouts to upload')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      let successCount = 0
      let errorCount = 0

      for (const workout of validWorkouts) {
        try {
          const response = await fetch('/api/workouts/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personName: workout.personName,
              workoutType: workout.workoutType,
              startTime: workout.startTime,
              endTime: workout.endTime,
              duration: workout.duration,
              date: workout.date,
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }

      if (errorCount === 0) {
        setMessage(`Successfully uploaded ${successCount} workouts!`)
        // Reset CSV states
        setSelectedCSV(null)
        setCsvWorkouts([])
        setShowCSVPreview(false)
        setCsvStats({ valid: 0, invalid: 0, total: 0 })
      } else {
        setMessage(`Uploaded ${successCount} workouts, ${errorCount} failed`)
      }

    } catch (error) {
      console.error('Error uploading workouts:', error)
      setMessage('Error uploading workouts. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const processImage = async () => {
    if (!selectedImage) return

    setIsProcessingImage(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/workouts/process-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setAiWorkoutData(result.workoutData)
        setShowConfirmation(true)
        setMessage(`AI detected workout with ${Math.round(result.workoutData.confidence * 100)}% confidence`)
      } else {
        setMessage(`Failed to process image: ${result.error}`)
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setMessage('Error processing image. Please try again.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  // Update duration when start or end time changes
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value }
    
    if (field === 'startTime' || field === 'endTime') {
      const duration = calculateDuration(
        field === 'startTime' ? value : formData.startTime,
        field === 'endTime' ? value : formData.endTime
      )
      newFormData.duration = duration.toString()
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/workouts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personName: formData.personName,
          workoutType: formData.workoutType,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: parseInt(formData.duration),
          date: formData.date,
        }),
      })

      if (response.ok) {
        setMessage('Workout added successfully!')
        setFormData({
          ...formData,
          startTime: '',
          endTime: '',
          duration: '',
        })
      } else {
        setMessage('Failed to add workout. Please try again.')
      }
    } catch {
      console.error('Error adding workout')
      setMessage('Error adding workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmAIWorkout = async () => {
    if (!aiWorkoutData) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/workouts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personName: formData.personName, // Use selected person
          workoutType: aiWorkoutData.workoutType,
          startTime: aiWorkoutData.startTime,
          endTime: aiWorkoutData.endTime,
          duration: aiWorkoutData.duration,
          date: aiWorkoutData.date,
        }),
      })

      if (response.ok) {
        setMessage('AI-detected workout added successfully!')
        // Reset image states
        setSelectedImage(null)
        setImagePreview(null)
        setAiWorkoutData(null)
        setShowConfirmation(false)
      } else {
        setMessage('Failed to add workout. Please try again.')
      }
    } catch {
      console.error('Error adding workout')
      setMessage('Error adding workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Login
          </h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4 inline mr-2" /> : <Eye className="h-4 w-4 inline mr-2" />}
              {showPassword ? 'Hide Password' : 'Show Password'}
            </button>
            {message && (
              <div className="mb-4 text-red-600 text-sm">{message}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Add workouts manually, with AI, or bulk upload via CSV</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Edit3 className="h-4 w-4 inline mr-2" />
                Manual Entry
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'image'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                AI Image Processing
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'csv'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 inline mr-2" />
                CSV Bulk Upload
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="h-4 w-4 inline mr-2" />
                Data Management
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {activeTab === 'manual' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Workout</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Person
                    </label>
                    <select
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value as PersonName })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {PERSON_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workout Type
                    </label>
                    <select
                      value={formData.workoutType}
                      onChange={(e) => setFormData({ ...formData, workoutType: e.target.value as WorkoutType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {WORKOUT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      min="1"
                      readOnly
                      placeholder="Calculated automatically"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Workout...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Workout
                    </>
                  )}
                </button>
              </form>
            </>
          ) : activeTab === 'image' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Image Processing</h2>
              <p className="text-gray-600 mb-6">
                Upload a screenshot of your workout app (Whoop, Apple Health, etc.) or gym photos, and AI will extract the workout details automatically.
              </p>

              {/* Person Selection for AI */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person (for this workout)
                </label>
                <select
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value as PersonName })}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {PERSON_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Workout Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="mb-4">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={128} height={128} className="mx-auto h-32 w-auto rounded-lg shadow-md object-cover"
                        />
                      </div>
                    ) : (
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Process Image Button */}
              {selectedImage && !showConfirmation && (
                <button
                  onClick={processImage}
                  disabled={isProcessingImage}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6"
                >
                  {isProcessingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Process Image with AI
                    </>
                  )}
                </button>
              )}

              {/* AI Results Confirmation */}
              {showConfirmation && aiWorkoutData && (
                <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
                  <h3 className="text-lg font-medium text-green-900 mb-4">
                    AI Detected Workout Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Type:</span>
                      <p className="text-green-800">{aiWorkoutData.workoutType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Duration:</span>
                      <p className="text-green-800">{aiWorkoutData.duration} minutes</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Start Time:</span>
                      <p className="text-green-800">{aiWorkoutData.startTime}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">End Time:</span>
                      <p className="text-green-800">{aiWorkoutData.endTime}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <p className="text-green-800">{aiWorkoutData.date}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Confidence:</span>
                      <p className="text-green-800">{Math.round(aiWorkoutData.confidence * 100)}%</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">AI Analysis:</span>
                    <p className="text-green-800 text-sm">{aiWorkoutData.extractedText}</p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={confirmAIWorkout}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Confirm & Add Workout'}
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmation(false)
                        setAiWorkoutData(null)
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'csv' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">CSV Bulk Upload</h2>
              <p className="text-gray-600 mb-6">
                Upload historical workout data in CSV format. Perfect for importing year-to-date workouts or migrating from other systems.
              </p>

              {/* Download Template */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">CSV Format Required</h3>
                    <p className="text-sm text-blue-700">
                      Download the template to see the exact format needed
                    </p>
                  </div>
                  <button
                    onClick={downloadCSVTemplate}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </button>
                </div>
                <div className="mt-3 text-xs text-blue-600">
                  <strong>Required columns:</strong> personName, workoutType, startTime, endTime, duration, date<br/>
                  <strong>Person names:</strong> Any plain text (e.g., Greg, Cortese, JP, etc.)<br/>
                  <strong>Workout types:</strong> Any plain text (e.g., Gym, HIIT, Cardio, Activity, etc.)<br/>
                  <strong>Duration:</strong> Any plain text (e.g., 45, 60, 30 minutes, etc.)<br/>
                  <strong>Time format:</strong> HH:MM:SS (e.g., 09:00:00)<br/>
                  <strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15)
                </div>
              </div>

              {/* CSV Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload CSV file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleCSVSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV files only
                    </p>
                    {selectedCSV && (
                      <p className="text-sm text-green-600 font-medium">
                        Selected: {selectedCSV.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Process CSV Button */}
              {selectedCSV && !showCSVPreview && (
                <button
                  onClick={processCSV}
                  disabled={isProcessingCSV}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6"
                >
                  {isProcessingCSV ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing CSV...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Process CSV File
                    </>
                  )}
                </button>
              )}

              {/* CSV Preview and Stats */}
              {showCSVPreview && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                      <div className="text-2xl font-bold text-blue-900">{csvStats.total}</div>
                      <div className="text-sm text-blue-700">Total Rows</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                      <div className="text-2xl font-bold text-green-900">{csvStats.valid}</div>
                      <div className="text-sm text-green-700">Valid Workouts</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                      <div className="text-2xl font-bold text-red-900">{csvStats.invalid}</div>
                      <div className="text-sm text-red-700">Invalid Rows</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Preview (first 10 rows)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvWorkouts.slice(0, 10).map((workout, index) => (
                            <tr key={index} className={workout.isValid ? 'bg-green-50' : 'bg-red-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {workout.isValid ? (
                                  <span className="text-green-800 font-medium">✓ Valid</span>
                                ) : (
                                  <span className="text-red-800 font-medium">✗ Invalid</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.personName}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.workoutType}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.duration}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.date}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.startTime}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.endTime}</td>
                              <td className="px-3 py-2 text-sm text-red-600">
                                {workout.errors.length > 0 && (
                                  <div className="max-w-xs">
                                    {workout.errors.join(', ')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvWorkouts.length > 10 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                        ... and {csvWorkouts.length - 10} more rows
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex space-x-4">
                    <button
                      onClick={uploadCSVWorkouts}
                      disabled={isSubmitting || csvStats.valid === 0}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {csvStats.valid} Valid Workouts
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCSV(null)
                        setCsvWorkouts([])
                        setShowCSVPreview(false)
                        setCsvStats({ valid: 0, invalid: 0, total: 0 })
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
              <p className="text-gray-600 mb-6">
                View and manage all workouts.
              </p>

              {/* Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Workouts
                </label>
                <div className="flex space-x-4">
                  <select
                    value={filters.personName}
                    onChange={(e) => setFilters({ ...filters, personName: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Persons</option>
                    {PERSON_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.workoutType}
                    onChange={(e) => setFilters({ ...filters, workoutType: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    {WORKOUT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Dates</option>
                    {/* Add date options here */}
                  </select>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Workouts Table */}
              {isLoadingWorkouts ? (
                <div className="text-center">Loading workouts...</div>
              ) : (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Workouts</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredWorkouts.map((workout) => (
                          <tr key={workout.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.personName}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.workoutType}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.duration}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{workout.date}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startEditWorkout(workout)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => workout.id && deleteWorkout(workout.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Edit Workout Modal */}
              {editingWorkout && (
                <div className="mt-6 p-4 bg-white rounded-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Workout</h3>
                  <form onSubmit={saveEditWorkout} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Person
                        </label>
                        <select
                          value={editFormData.personName}
                          onChange={(e) => setEditFormData({ ...editFormData, personName: e.target.value as PersonName })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {PERSON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Workout Type
                        </label>
                        <select
                          value={editFormData.workoutType}
                          onChange={(e) => setEditFormData({ ...editFormData, workoutType: e.target.value as WorkoutType })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {WORKOUT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={editFormData.duration}
                          onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                          min="1"
                          readOnly
                          placeholder="Calculated automatically"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={editFormData.startTime}
                        onChange={(e) => handleEditTimeChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={editFormData.endTime}
                        onChange={(e) => handleEditTimeChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Workout...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Workout
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {message && (
            <div className={`mt-6 p-4 rounded-md ${
              message.includes('successfully') || message.includes('confidence') || message.includes('Processed')
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 