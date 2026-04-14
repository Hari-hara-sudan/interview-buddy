import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { app_id, app_key, what, results_per_page = '50' } = req.query;

  if (!app_id || !app_key) {
    return res.status(400).json({ error: 'Missing app_id or app_key' });
  }

  try {
    // Extract page number from path if present
    const pathSegments = req.url?.split('/') || [];
    const page = pathSegments[pathSegments.length - 1] || '1';

    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${app_id}&app_key=${app_key}&results_per_page=${results_per_page}&what=${what}&content-type=application/json`;

    const response = await fetch(adzunaUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch jobs from Adzuna' });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'max-age=3600'); // Cache for 1 hour
    return res.status(200).json(data);
  } catch (error) {
    console.error('Adzuna proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
