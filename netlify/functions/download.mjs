const BASE = 'https://nexabot.id';

export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({ error: 'Gunakan GET.' }, { status: 405 });
  const expected = process.env.SITE_ACCESS_CODE || '';
  const supplied = request.headers.get('x-site-access-code') || '';
  if (expected && supplied !== expected) return Response.json({ error: 'Kode akses studio tidak valid. Klik ikon kunci di bagian atas untuk memasukkannya.' }, { status: 401 });
  const key = process.env.NEXABOT_API_KEY;
  if (!key) return Response.json({ error: 'Studio belum dikonfigurasi. Tambahkan NEXABOT_API_KEY di Netlify → Site configuration → Environment variables.' }, { status: 503 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-zA-Z0-9_-]{5,100}$/.test(id)) return Response.json({ error: 'ID job tidak valid.' }, { status: 400 });
  try {
    const upstream = await fetch(`${BASE}/api/v1/jobs/${encodeURIComponent(id)}/download`, { headers: { 'x-api-key': key }, cache: 'no-store' });
    if (!upstream.ok) {
      let message = `Nexabot mengembalikan status ${upstream.status}.`;
      try { const payload = await upstream.json(); message = payload.error || payload.message || message; } catch (_) {}
      return Response.json({ error: message }, { status: upstream.status });
    }
    return new Response(upstream.body, { status: 200, headers: { 'content-type': upstream.headers.get('content-type') || 'video/mp4', 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message || 'Gagal mengunduh video.' }, { status: 502 });
  }
}
