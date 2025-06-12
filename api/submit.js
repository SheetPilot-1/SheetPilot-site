export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;

    const googleAppsScriptURL = 'https://script.google.com/macros/s/AKfycbzek_kzijfosGnvebUZiBsyhJAubwdMy2yl8UMtrGnLZD4xWN8rcRpBw16MoelliV4L/exec';

    const response = await fetch(googleAppsScriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failed', message: err.message });
  }
}
