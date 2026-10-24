const { json, accessError, apiKey, missingKey, upstream, upstreamError } = require('../_shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Gunakan GET.' });
  const locked = accessError(event); if (locked) return locked;
  if (!apiKey()) return missingKey();
  const id = event.queryStringParameters?.id || '';
  if (!/^[a-zA-Z0-9_-]{5,100}$/.test(id)) return json(400, { error: 'ID job tidak valid.' });
  try {
    const response = await upstream(`/api/v1/jobs/${encodeURIComponent(id)}`);
    if (!response.ok) return upstreamError(response);
    return json(response.status, await response.json());
  } catch (error) { return json(502, { error: error.message || 'Gagal memeriksa status job.' }); }
};
