/**
 * COMMAND: User Status / ID Card
 * ----------------------------
 * Menampilkan kasta user, masa aktif, dan sisa kuota harian.
 * Fitur: .me, .status
 */

export const name = 'me';
export const aliases = ['status', 'kasta', 'cek'];
export const description = 'Check your neural hierarchy status.';
export const category = 'Utility';

export default async function run(sock, m, { helper, userConfig, isOwner }) {
    const remoteJid = helper.getSender(m);
    const pushName = m.messages[0].pushName || 'Seseorang';
    const jid = helper.getParticipant(m);
    const number = jid.split('@')[0];

    const tiers = {
        free: '🥉 Rakyat Jelata (FREE)',
        premium: '🥈 Warga Sipil (PREMIUM)',
        vip: '🥇 Sultan Matrix (VIP)'
    };

    const currentTier = tiers[userConfig.tier] || tiers.free;
    const downloadMB = userConfig.dailyUsage?.get?.('downloadMB') || 0;
    
    // Konfigurasi Limit & Benefit (v3.0.0-Beta)
    const tier = userConfig.tier || 'free';
    const limits = { 
        free: { download: 15, photo: 20, video: 10 }, 
        premium: { download: 200, photo: 50, video: 25 }, 
        vip: { download: '∞', photo: '∞', video: '∞' } 
    };
    
    const benefits = {
        free: { speed: 'Standar' },
        premium: { speed: 'Prioritas' },
        vip: { speed: 'Ultra Fast' }
    };

    const userLimit = limits[tier].download;
    const userBenefit = benefits[tier];
    const roleTitle = isOwner ? '🛠️ SYSTEM ARCHITECT' : '👤 USER';

    // Statistik Media (v3.1.5)
    const sPhoto = userConfig.dailyUsage?.get?.('stickerPhoto') || 0;
    const sVideo = userConfig.dailyUsage?.get?.('stickerVideo') || 0;

    const dispPLimit = limits[tier].photo;
    const dispVLimit = limits[tier].video;

    let expiredInfo = '';
    if (userConfig.tier === 'premium' && userConfig.premiumUntil) {
        const date = new Date(userConfig.premiumUntil).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        expiredInfo = `\n• *Limit Expired*: ${date}`;
    } else if (userConfig.tier === 'vip') {
        expiredInfo = `\n• *Access*: Eternal`;
    }

    const message = `
*NEURAL IDENTITY CARD*
──────────────
• *Role*: ${roleTitle}
• *Nama*: ${pushName}
• *ID*: ${jid}
• *Kasta*: ${currentTier}${expiredInfo}

*NEURAL PRIVILEGES*
• *AI Chat*: Unlimited
• *Response*: ${userBenefit.speed}

*DAILY METRICS (00:00)*
• *Download*: ${downloadMB.toFixed(2)} MB / ${userLimit} MB
• *Sticker (P)*: ${sPhoto} / ${dispPLimit}
• *Sticker (V)*: ${sVideo} / ${dispVLimit}
    `.trim();

    return await sock.sendMessage(remoteJid, { 
        text: message
    });
}
