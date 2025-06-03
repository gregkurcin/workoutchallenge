# Workout Challenge Dashboard

A modern web application to track and visualize workout progress for your fitness challenge group. Features a public dashboard for viewing stats and leaderboards, plus an admin panel for adding workouts.

## Features

- **Public Dashboard**: View personal stats, leaderboards, and progress charts
- **Admin Panel**: Secure login to add workouts for team members
- **Google Sheets Integration**: Uses your existing Google Sheet as the data source
- **Real-time Charts**: Cumulative progress and workout type breakdowns
- **Responsive Design**: Works great on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Data Source**: Google Sheets API
- **Deployment**: Vercel (free tier)

## Setup Instructions

### 1. Google Sheets Setup

1. Create a Google Sheet with the following columns (in this exact order):
   - Column A: Day of Week
   - Column B: Person Name
   - Column C: Workout Type (Gym, HIIT, Cardio, Activity)
   - Column D: Duration (minutes)
   - Column E: Date (YYYY-MM-DD format)
   - Column F: Workout Name (optional)

2. Add a header row with these column names.

### 2. Google Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name and description
   - Click "Create and Continue"
   - Skip role assignment for now
   - Click "Done"
5. Generate a key:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format
   - Download the key file
6. Share your Google Sheet with the service account email (found in the JSON file)

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Google Sheets credentials:
   ```
   GOOGLE_SHEET_ID=your_sheet_id_from_url
   GOOGLE_SHEET_NAME=Workouts
   GOOGLE_CLIENT_EMAIL=your_service_account_email
   GOOGLE_PRIVATE_KEY="your_private_key_with_newlines"
   ```

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` for the dashboard and `http://localhost:3000/admin` for the admin panel.

**Admin Password**: `workout2024` (change this in production!)

### 5. Deployment

#### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

#### Option 2: Static Export for GitHub Pages
```bash
# Build static export
npm run build
npm run export

# Deploy the `out` folder to GitHub Pages
```

## Usage

### Dashboard Features
- **Person Selector**: Choose whose stats to view
- **Stats Cards**: Total workouts, monthly count, favorite type, leaderboard rank
- **Cumulative Progress Chart**: See how everyone is pacing throughout the year
- **Workout Types Chart**: Breakdown by exercise type for selected person
- **Leaderboard**: Real-time ranking by total workouts

### Admin Features
- **Secure Login**: Password-protected admin access
- **Quick Entry Form**: Add workouts with person, type, duration, date, and optional name
- **Validation**: Ensures all required fields are filled
- **Success Feedback**: Confirms when workouts are added successfully

## Team Members

The app is configured for these team members:
- Cortese
- Greg
- JP
- Kyle
- Nick
- Amanda
- Niki
- Stu

To modify the team, update the `PERSON_NAMES` array in `src/types/workout.ts`.

## Workout Types

Supported workout types:
- Gym
- HIIT
- Cardio
- Activity

To modify types, update the `WORKOUT_TYPES` array in `src/types/workout.ts`.

## Security Notes

- Change the admin password in `src/app/admin/page.tsx` before deployment
- Keep your Google Service Account credentials secure
- Consider implementing proper authentication for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your own workout challenges!
