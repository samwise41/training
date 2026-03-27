export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No authorization code provided.');
    }

    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();

        if (data.access_token) {
            // Success! Send them back to your main app, open the #alpe tab, and pass the token
            res.redirect(`/?token=${data.access_token}#alpe`);
        } else {
            res.status(400).json({ error: 'Failed to get token', details: data });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
