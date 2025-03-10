# Beat Management App with Dropbox & Supabase Integration

This application allows you to manage your beat collection using Dropbox for file storage and Supabase for database management.

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A Dropbox Developer account
- A Supabase account

### 1. Dropbox Setup
1. Go to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Scoped access" -> "Full Dropbox" -> Give it a name
4. In the app settings:
   - Add `http://localhost:3000/auth/dropbox/callback` to "Redirect URIs"
   - Note your "App key" and "App secret"

### 2. Supabase Setup
1. Create a new project in [Supabase](https://app.supabase.com/)
2. Go to the SQL Editor and run the SQL script from `supabase-schema.sql`
3. Get your URL and anon key from Settings > API

### 3. Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Dropbox and Supabase credentials:
```
NEXT_PUBLIC_DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies
```bash
npm install
# or
yarn
# or
pnpm install
```

### 5. Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing the Integration

1. **Connect to Dropbox**
   - Click the "Import from Dropbox" button in the top right corner
   - Authenticate with your Dropbox account
   - You should see your files and folders

2. **Import Beats**
   - Navigate to a folder with audio files
   - Select some files and click "Import Selected"
   - The beats should appear in your library

3. **Play Beats**
   - Click on a beat to select it
   - Use the play/pause button in the player at the bottom
   - The audio should stream directly from Dropbox

4. **Organize Beats**
   - Create tags and collections to organize your beats
   - Add and remove tags from beats
   - Add beats to collections

## Troubleshooting

### CORS Issues
If you encounter CORS issues when trying to stream audio from Dropbox, make sure your Dropbox app has the necessary permissions.

### Authentication Issues
If authentication fails:
1. Check that your redirect URI is correctly set in the Dropbox app settings
2. Verify your app key and secret in the `.env.local` file
3. Check the browser console for error messages

### Database Issues
If you encounter database errors:
1. Make sure you've run the SQL script correctly
2. Check that your Supabase URL and anon key are correct
3. Verify that RLS policies are correctly set up if you're using authentication

## Additional Notes

- The app uses client-side caching for better performance and offline access
- Files are streamed directly from Dropbox, not stored on our servers
- The Supabase database only stores metadata, not the actual audio files