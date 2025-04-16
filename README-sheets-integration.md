# Google Sheets Integration for Student Authentication

This system fetches student credentials from a Google Sheet to authenticate students in the application. Only students in the Google Sheet can sign in to the platform.

## Setup Instructions

### 1. Google Cloud Platform Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API for your project:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create credentials" > "Service account"
3. Enter a name for your service account and optionally a description
4. Click "Create and continue"
5. For role, select "Project" > "Viewer" (minimum required role)
6. Click "Continue" and then "Done"

### 3. Create and Download Service Account Key

1. In the service accounts list, find the one you just created
2. Click the three dots menu (Actions) > "Manage keys"
3. Click "Add key" > "Create new key"
4. Select "JSON" as the key type
5. Click "Create"
6. The key file will be downloaded to your computer

### 4. Share Google Sheet with Service Account

1. Take the service account email (it should look like `service-account-name@project-id.iam.gserviceaccount.com`)
2. Open your Google Sheet [https://docs.google.com/spreadsheets/d/1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo/edit](https://docs.google.com/spreadsheets/d/1fkXcAsoZUIpu56XjyKQv2S5OTboYhVhwttGQCCadiFo/edit)
3. Click the "Share" button
4. Add the service account email and give it "Viewer" access
5. Click "Share"

### 5. Configure Your Sheet Format

1. Make sure your Google Sheet has a sheet named "Students" 
2. In this sheet, column A should contain email addresses
3. Column B should contain passwords
4. The first row should be headers (e.g., "Email", "Password")

### 6. Add Service Account Credentials to Your App

1. Replace the placeholder content in `app/api/auth/sheets-credentials.json` with the content from your downloaded service account key JSON file
2. Make sure this file is added to your `.gitignore` to keep your credentials secure
3. The app is now configured to fetch student data from your Google Sheet

## How It Works

- The integration uses a 1-minute cache to minimize API calls to Google Sheets
- When a student tries to log in, the system checks their credentials against the data from the sheet
- Any changes to the Google Sheet will be reflected in the app within 1 minute
- Mentor authentication still uses the hardcoded mock data

## Security Considerations

- This implementation is for demonstration purposes
- In a production environment, you should:
  - Store credentials in environment variables or a secret manager
  - Never store plaintext passwords in a Google Sheet
  - Implement proper encryption and hashing for passwords
  - Add rate limiting to prevent brute force attacks 