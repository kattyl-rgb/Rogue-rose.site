import { getStore, getDeployStore } from '@netlify/blobs';

const CONSENT_VERSION = '2026-10-14';
const CONSENT_TEXT = 'I agree to receive service-related text messages from Rogue Rose Creative LLC, such as responses to my inquiries and updates about services I request. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase. See the Privacy Policy and SMS Messaging Terms. SMS consent and phone numbers will not be shared with third parties or affiliates for their marketing purposes.';
const MAX_BODY_BYTES = 2048;

const getEnv = (name) => process.env[name] || globalThis.Netlify?.env?.get?.(name);
const isProduction = () => globalThis.Netlify?.context?.deploy?.context === 'production';

// Enrollment stays closed on the live site until SMS_CONSENT_ENABLED=true is set,
// so the full flow (including STOP/HELP handling) can be verified on previews first.
const isEnabled = () => !isProduction() || getEnv('SMS_CONSENT_ENABLED') === 'true';

// Production writes to the site-wide store; previews and branch deploys stay isolated.
// Blob stores are private to the site: this function exposes no read or list operations.
const getConsentStore = () => {
  const options = { name: 'rogue-rose-sms-consent', consistency: 'strong' };
  return isProduction() ? getStore(options) : getDeployStore(options);
};

const normalizePhone = (value) => {
  if (typeof value !== 'string' || value.length > 32) return null;
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!hasPlus && digits.length === 10 && /^[2-9]\d{2}[2-9]/.test(digits)) return `+1${digits}`;
  if (!hasPlus && digits.length === 11 && /^1[2-9]\d{2}[2-9]/.test(digits)) return `+${digits}`;
  if (hasPlus && digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0')) return `+${digits}`;
  return null;
};

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export default async (request, context) => {
  if (request.method === 'GET') return json({ enabled: isEnabled() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!isEnabled()) return json({ error: 'SMS enrollment is temporarily unavailable.' }, 503);

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: 'Forbidden.' }, 403);

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.' }, 400); }

    const phone = normalizePhone(body?.phone);
    if (!phone) return json({ error: 'Please enter a valid mobile phone number.' }, 400);
    if (body.consent !== true) return json({ error: 'Please check the consent box to enroll.' }, 400);

    const store = getConsentStore();
    const key = `phones/${phone}`;
    const existing = await store.get(key, { type: 'json' });

    // Repeat submissions under the same wording are already on record; don't grow the history.
    if (existing?.status === 'opted_in' && existing.events?.at(-1)?.consentVersion === CONSENT_VERSION) {
      return json({ ok: true, alreadyEnrolled: true });
    }

    const now = new Date().toISOString();
    const event = {
      type: 'opt_in',
      at: now,
      source: 'sms-consent-page',
      consentVersion: CONSENT_VERSION,
      consentText: CONSENT_TEXT,
      ip: context.ip || null
    };

    await store.setJSON(key, {
      phone,
      status: 'opted_in',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      events: [...(existing?.events || []), event].slice(-50)
    });

    return json({ ok: true });
  } catch (error) {
    console.error('SMS consent function error', error?.message || error);
    return json({ error: 'Your consent could not be saved. Please try again.' }, 500);
  }
};
