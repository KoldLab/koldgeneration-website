import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Get the API URL from environment variable, with fallback
  const apiBaseUrl =
    process.env.EXERCISEDB_API_URL ||
    'https://kold-exercisedb-api-git-develop-sami-steenhauts-projects.vercel.app';

  // Get the path from the URL
  // The rewrite sends /api/exercisedb/:path* to /api/proxy-exercisedb?path=...
  // Or we can use the original URL if available
  let path = '';
  if (req.query.path) {
    // If path is in query params (from rewrite)
    path = Array.isArray(req.query.path) 
      ? req.query.path.join('/') 
      : req.query.path;
  } else if (req.url) {
    // Extract path from URL
    const urlPath = req.url.replace('/api/proxy-exercisedb', '');
    path = urlPath.split('?')[0]; // Remove query string
  }
  
  // Construct the full URL with query string
  const queryString = req.url?.includes('?') ? '?' + req.url.split('?')[1] : '';
  const targetUrl = `${apiBaseUrl}/api/${path}${queryString}`;

  try {
    // Forward the request to the ExerciseDB API
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any relevant headers if needed
        ...(req.headers['content-type'] && {
          'Content-Type': req.headers['content-type'] as string,
        }),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await response.json();

    // Forward the response with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to proxy request to ExerciseDB API',
    });
  }
}

