export const authenticateRequest = (event) => {
    const origin = event.headers.origin || event.headers.referer;
    const authHeader = event.headers.authorization;

    // Production domains - these can be public
    const allowedOrigins = [
        'https://fensterchess.com',
        'https://fensterchess.netlify.app',
        'http://localhost:8888', // dev
        'http://localhost:5173', // vite dev
    ];

    if (allowedOrigins.some((allowed) => origin?.includes(allowed))) {
        return true;
    }

    // Secret token for other access - stored in env vars
    const validToken = process.env.VITE_API_SECRET_TOKEN; // Never commit this
    if (authHeader === `Bearer ${validToken}`) {
        return true;
    }

    console.error(JSON.stringify({AuthFailure: {origin, authHeader}}))
    return false;
};

export const authFailureResponse = {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Unauthorized' }),
};
