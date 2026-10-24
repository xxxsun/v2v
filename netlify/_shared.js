const BASE = 'https://nexabot.id';

function json(statusCode, payload) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify(payload) };
}
function accessError(event) {
  const expected = process.env.SITE_ACCESS_CODE;
  if (!expected) return null;
  const supplied = event.headers?.['x-site-access-code'] || event.headers?.['X-Site-Access-Code'] || '';
  if (supplied !== expected) return json(401, { error: 'Kode akses studio tidak valid. Klik ikon kunci di bagian atas untuk memasukkannya.' });
  return null;
}
function apiKey() { return process.env.NEXABOT_API_KEY || ''; }
function missingKey() { return json(503, { error: 'Studio belum dikonfigurasi. Tambahkan NEXABOT_API_KEY di Netlify → Site configuration → Environment variables.' }); }
async function upstream(path, options = {}) {
  const key = apiKey();
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'x-api-key': key, ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) },
    cache: 'no-store'
  });
  return response;
}
async function upstreamError(response) {
  let message = `Nexabot mengembalikan status ${response.status}.`;
  try { const payload = await response.clone().json(); message = payload.error || payload.message || message; } catch (_) {}
  return json(response.status >= 400 && response.status < 600 ? response.status : 502, { error: message });
}
module.exports = { json, accessError, apiKey, missingKey, upstream, upstreamError };
