import type { VercelRequest, VercelResponse } from '@vercel/node';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_EMAIL || 'Info@WasteConnection.nl';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@wasteconnection.nl';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://wasteconnection.nl,https://wasteconnection.vercel.app,http://localhost:4321,http://localhost:4322').split(',');

// Rate limiting (per Vercel function instance)
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (submissions.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (times.length >= RATE_LIMIT) return true;
  times.push(now);
  submissions.set(ip, times);
  return false;
}

function sanitize(str: string, maxLen = 1000): string {
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Origin check
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.some(a => origin.startsWith(a.trim()))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body;

  // Honeypot — if filled, silently succeed (don't tip off bots)
  if (body.website) {
    return res.status(200).json({ success: true });
  }

  // Time check — submissions under 3 seconds are bots
  const elapsed = Date.now() - parseInt(body._gotcha_time || '0');
  if (elapsed < 3000) {
    return res.status(200).json({ success: true });
  }

  // Rate limit by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Te veel verzoeken. Probeer het over 15 minuten opnieuw.' });
  }

  // Validate required fields
  const firstName = sanitize(body.firstName || '', 200);
  const lastName = sanitize(body.lastName || '', 200);
  const email = (body.email || '').trim().slice(0, 254);
  const message = sanitize(body.message || '', 5000);

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: 'Vul alle verplichte velden in.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Voer een geldig e-mailadres in.' });
  }

  // Optional fields
  const phone = sanitize(body.phone || '', 30);
  const serviceType = sanitize(body.serviceType || '', 100);
  const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`;

  // Send email via Resend
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Contactformulier tijdelijk niet beschikbaar.' });
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `Contactformulier: ${fullName}`,
        reply_to: email,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
            <h2 style="color: #2d3a1a; border-bottom: 2px solid #85a71e; padding-bottom: 8px;">Nieuw bericht via contactformulier</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; width: 120px;">Naam</td><td style="padding: 8px 0; font-weight: 600;">${fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">E-mail</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #666;">Telefoon</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
              ${serviceType ? `<tr><td style="padding: 8px 0; color: #666;">Interesse in</td><td style="padding: 8px 0;">${serviceType}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f5f5f0; border-left: 3px solid #85a71e;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Bericht</p>
              <p style="margin: 8px 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 24px; color: #999; font-size: 12px;">Verzonden via wasteconnection.nl contactformulier</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      return res.status(500).json({ error: 'Verzenden mislukt. Probeer het opnieuw.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Verzenden mislukt. Probeer het opnieuw of bel ons.' });
  }
}
