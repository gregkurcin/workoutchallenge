'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PERSON_NAMES, WORKOUT_TYPES, WorkoutType, PersonName } from '@/types/workout'
import { LogOut, Save, Camera, Upload, Sparkles, Edit3 } from 'lucide-react'

interface AIWorkoutData {
  workoutType: WorkoutType
  duration: number
  date: string
  name: string
  confidence: number
  extractedText: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'manual' | 'image'>('manual')
  const [formData, setFormData] = useState({
    personName: PERSON_NAMES[0] as PersonName,
    workoutType: WORKOUT_TYPES[0] as WorkoutType,
    duration: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  
  // Image processing states
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [aiWorkoutData, setAiWorkoutData] = useState<AIWorkoutData | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production, use proper authentication
    if (password === 'workout2024') {
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
          duration: parseInt(formData.duration),
          date: formData.date,
          name: formData.name,
        }),
      })

      if (response.ok) {
        setMessage('Workout added successfully!')
        setFormData({
          ...formData,
          duration: '',
          name: '',
        })
      } else {
        setMessage('Failed to add workout. Please try again.')
      }
    } catch (err) {
      console.error('Error adding workout:', err)
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
          duration: aiWorkoutData.duration,
          date: aiWorkoutData.date,
          name: aiWorkoutData.name,
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
    } catch (err) {
      console.error('Error adding workout:', err)
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
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
            <p className="text-gray-600">Add workouts manually or with AI image processing</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
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
                    Workout Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Morning Run, Chest Day, HIIT Session"
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
          ) : (
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
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto h-32 w-auto rounded-lg shadow-md"
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
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <p className="text-green-800">{aiWorkoutData.date}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Confidence:</span>
                      <p className="text-green-800">{Math.round(aiWorkoutData.confidence * 100)}%</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Workout Name:</span>
                    <p className="text-green-800">{aiWorkoutData.name}</p>
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
          )}

          {message && (
            <div className={`mt-6 p-4 rounded-md ${
              message.includes('successfully') || message.includes('confidence')
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