export default function handler(req, res) {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = `${process.env.HOST_URL}/api/callback`;
    const scope = 'read,activity:read';

    // Build the Strava login URL
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;

    // Redirect the user to Strava
    res.redirect(stravaAuthUrl);
}
