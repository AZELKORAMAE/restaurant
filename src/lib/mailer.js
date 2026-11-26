// Transactional e-mails through Resend (https://resend.com) when RESEND_API_KEY and MAIL_FROM are set.
// Without them nothing is sent and the admin shares the access link by WhatsApp / e-mail / copy.
export const mailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function layout(title, body, cta) {
    return `<!doctype html><html><body style="margin:0;background:#f6f4f0;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="font-weight:900;font-size:20px;margin-bottom:24px">Menu<span style="color:#e0a21b">3D</span></div>
<div style="background:#fff;border-radius:16px;padding:28px">
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>
${body}
${cta ? `<p style="margin:28px 0 8px"><a href="${esc(cta.url)}" style="background:#FFC244;color:#1a1a1a;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;display:inline-block">${esc(cta.label)}</a></p>
<p style="font-size:12px;color:#888;word-break:break-all">${esc(cta.url)}</p>` : ''}
</div></div></body></html>`;
}

export async function sendMail({ to, subject, title, paragraphs = [], cta }) {
    if (!mailEnabled() || !to) return false;
    const html = layout(title || subject, paragraphs.map((p) => `<p style="line-height:1.6;margin:0 0 12px">${esc(p)}</p>`).join(''), cta);
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, html }),
        });
        if (!res.ok) console.warn('mail not sent:', res.status, await res.text().catch(() => ''));
        return res.ok;
    } catch (e) {
        console.warn('mail not sent:', e.message);
        return false;
    }
}

/** Message the admin can paste in WhatsApp / e-mail when no mail service is configured. */
export function accessMessage({ managerName, restaurantName, loginUrl, email }) {
    return `Bonjour ${managerName},\n\nBonne nouvelle : votre restaurant « ${restaurantName} » est validé sur Menu3D.\n`
        + `Connectez-vous pour gérer votre menu, vos plats en 3D et vos QR codes :\n${loginUrl}\n\n`
        + `Identifiant : ${email}\nMot de passe : celui choisi lors de votre demande.\n\nÀ bientôt !`;
}

/** wa.me link; local numbers (0XXXXXXXXX) get the platform country code. */
export function whatsappLink(phone, text, countryCode = '212') {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = countryCode + digits.slice(1);
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
