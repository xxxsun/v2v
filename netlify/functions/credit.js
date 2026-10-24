const { json, accessError, apiKey, missingKey, upstream, upstreamError } = require('../_shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Gunakan GET.' });
  const locked = accessError(event); if (locked) return locked;
  if (!apiKey()) return missingKey();
  try {
    const response = await upstream('/api/v1/api/credit');
    if (!response.ok) return upstreamError(response);
    return json(response.status, await response.json());
  } catch (error) { return json(502, { error: error.message || 'Gagal memeriksa kredit.' }); }
};
