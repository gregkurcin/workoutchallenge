'use client'

import { useState, useEffect } from 'react'
import { Workout, PERSON_NAMES, PersonStats, LeaderboardEntry } from '@/types/workout'
import { calculatePersonStats, calculateLeaderboard, getCumulativeWorkoutData } from '@/lib/workoutStats'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Trophy, Activity, Calendar, TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  [key: string]: string | number
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedPerson, setSelectedPerson] = useState<string>(PERSON_NAMES[0])
  const [personStats, setPersonStats] = useState<PersonStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [cumulativeData, setCumulativeData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  useEffect(() => {
    if (workouts.length > 0) {
      const stats = calculatePersonStats(workouts, selectedPerson)
      setPersonStats(stats)
      setLeaderboard(calculateLeaderboard(workouts))
      setCumulativeData(getCumulativeWorkoutData(workouts))
    }
  }, [workouts, selectedPerson])

  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts')
      const data = await response.json()
      setWorkouts(data)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPersonColor = (person: string) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb']
    const index = PERSON_NAMES.findIndex(name => name === person)
    return colors[index] || '#8884d8'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading workout data...</div>
      </div>
    )
  }

  // Empty state when no workouts exist
  if (workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Workout Challenge Dashboard</h1>
            <p className="text-gray-600">Track your fitness journey and compete with friends</p>
          </header>
          
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workouts yet!</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first workout. Use the admin panel to add workouts manually, 
              with AI image processing, or bulk upload via CSV.
            </p>
            <a
              href="/admin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Activity className="h-5 w-5 mr-2" />
              Add Your First Workout
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Workout Challenge Dashboard</h1>
          <p className="text-gray-600">Track your fitness journey and compete with friends</p>
        </header>

        {/* Person Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Person
          </label>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {PERSON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        {personStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workouts</p>
                  <p className="text-2xl font-bold text-gray-900">{personStats.totalWorkouts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(personStats.workoutsByMonth).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorite Type</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.entries(personStats.workoutsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Leaderboard Rank</p>
                  <p className="text-2xl font-bold text-gray-900">
                    #{leaderboard.find(entry => entry.personName === selectedPerson)?.rank || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cumulative Progress Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {PERSON_NAMES.map((person) => (
                  <Line
                    key={person}
                    type="monotone"
                    dataKey={person}
                    stroke={getPersonColor(person)}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Workout Types Chart */}
          {personStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedPerson}&apos;s Workout Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(personStats.workoutsByType).map(([type, count]) => ({ type, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {leaderboard.map((entry) => (
                <div
                  key={entry.personName}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    entry.personName === selectedPerson ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-orange-600' : 'bg-gray-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <span className="ml-4 text-lg font-medium text-gray-900">
                      {entry.personName}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {entry.totalWorkouts} workouts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
