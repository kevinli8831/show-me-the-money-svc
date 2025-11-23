# Google OAuth Manual Verification Guide

This guide explains how to manually verify the Google OAuth implementation.

## Prerequisites

1.  **Google Cloud Project**: You need a project in [Google Cloud Console](https://console.cloud.google.com/).
2.  **Credentials**: Create OAuth 2.0 Client ID credentials.
    *   **Authorized JavaScript origins**: `http://localhost:3000` (or your frontend URL)
    *   **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
3.  **Environment Variables**: Update your `.env` file with the credentials:
    ```env
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
    ```

## Verification Steps

### Method 1: Browser Direct Test

1.  Start the server: `pnpm run dev`
2.  Open your browser and visit: `http://localhost:3000/auth/google`
3.  You should be redirected to the Google Sign-In page.
4.  Sign in with your Google account.
5.  You should be redirected back to `http://localhost:3000/auth/google/callback`.
6.  The browser should display a JSON response similar to:
    ```json
    {
      "message": "Login successful",
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "email": "your_email@gmail.com",
        "provider": "google",
        ...
      }
    }
    ```

### Method 2: Simple HTML Client

Create a file named `google-login.html` with the following content and open it in your browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Google OAuth Test</title>
</head>
<body>
    <h1>Google OAuth Test</h1>
    <a href="http://localhost:3000/auth/google">Login with Google</a>
</body>
</html>
```

## Troubleshooting

*   **Redirect URI Mismatch**: Ensure `GOOGLE_CALLBACK_URL` matches exactly what is in Google Cloud Console.
*   **401 Unauthorized**: If you get this immediately, check your Client ID and Secret.
*   **Database Error**: Ensure your database is running and migrations are applied (`pnpm run db:push`).
