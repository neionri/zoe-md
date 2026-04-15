/**
 * COMMAND: User Status / ID Card
 * ----------------------------
 * Menampilkan kasta user, masa aktif, dan sisa kuota harian.
 * Fitur: .me, .status
 */

export const name = 'me';
export const aliases = ['bisnis', 'cekpp', 'cekwa'];
export const hiddenAliases = ['status', 'kasta', 'cek', 'cekbisnis', 'colongpp', 'getpp'];
export const description = 'Check your neural hierarchy status.';
export const category = 'Utility';

export default async function run(sock, m, { command, args, helper, userConfig, isOwner, groq }) {
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

    // Tampilkan ID card HANYA untuk command profil
    if (['me', 'status', 'kasta', 'cek'].includes(command)) {
        return await sock.sendMessage(remoteJid, { 
            text: message
        });
    }

    // --- CEK PROFIL BISNIS (.cekbisnis, .bisnis) ---
    if (['cekbisnis', 'bisnis'].includes(command)) {
        // Ambil target: dari reply, tag, atau argumen nomor
        let targetJid = helper.getQuotedSender(m)
            || m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || null;

        if (!targetJid && args[0]) {
            const rawNum = args[0].replace(/[^\d]/g, '');
            if (rawNum) targetJid = rawNum + '@s.whatsapp.net';
        }

        if (!targetJid) {
            return await sock.sendMessage(remoteJid, {
                text: `🏪 *Neural Bisnis Check*: Reply pesan orangnya, tag, atau ketik nomornya boss.\nContoh: \`.cekbisnis 628xxx\``
            }, { quoted: m.messages[0] });
        }

        targetJid = helper.jidNormalize(targetJid);

        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            const profile = await sock.getBusinessProfile(targetJid);

            if (!profile || Object.keys(profile).length === 0) {
                const notBisnis = await groq.getZoeDirective(
                    `Nomor ${targetJid.split('@')[0]} bukan akun WhatsApp Business atau tidak punya profil bisnis. Beritahu dengan gaya Zoe yang sarkas.`,
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: notBisnis }, { quoted: m.messages[0] });
            }

            const nomor = targetJid.split('@')[0];
            let report = `🏪 *NEURAL BISNIS PROFILE*\n`;
            report += `──────────────────────\n`;
            report += `📞 *Nomor*: +${nomor}\n`;
            if (profile.description) report += `📝 *Deskripsi*: ${profile.description}\n`;
            if (profile.category) report += `🏷️ *Kategori*: ${profile.category}\n`;
            if (profile.email) report += `📧 *Email*: ${profile.email}\n`;
            if (profile.website?.length) report += `🌐 *Website*: ${profile.website.join(', ')}\n`;
            if (profile.address) report += `📍 *Alamat*: ${profile.address}\n`;

            await sock.sendMessage(remoteJid, { text: report }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Business Profile Fetched: ${nomor}`);
        } catch (err) {
            const failMsg = await groq.getZoeDirective(
                `Gagal mengambil profil bisnis karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
        return;
    }

    // --- CEK FOTO PROFIL (.cekpp, .colongpp, .getpp) ---
    if (['cekpp', 'colongpp', 'getpp'].includes(command)) {
        // Ambil target
        let targetJid = helper.getQuotedSender(m)
            || m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || null;

        if (!targetJid && args[0]) {
            const rawNum = args[0].replace(/[^\d]/g, '');
            if (rawNum) targetJid = rawNum + '@s.whatsapp.net';
        }

        if (!targetJid) {
            const hintMsg = await groq.getZoeDirective(
                `Boss minta cek/colong poto profil tapi tidak ngetag, reply, atau nyantumin nomor orangnya. Sindir biar Boss lebih spesifik.`,
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintMsg }, { quoted: m.messages[0] });
        }

        targetJid = helper.jidNormalize(targetJid);

        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            
            // Ambil URL dengan kualitas 'image' (resolusi HD original)
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image');

            if (!ppUrl) {
                const noPpMsg = await groq.getZoeDirective(
                    `Target ${targetJid.split('@')[0]} tidak memakai foto profil, dihapus, atau di-privasi. Beritahu boss dengan gaya Zoe.`,
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: noPpMsg }, { quoted: m.messages[0] });
            }

            const successMsg = await groq.getZoeDirective(
                `Berhasil membajak / mengambil foto profil target ${targetJid.split('@')[0]} dengan resolusi tinggi. Serahkan fotonya ke Boss dengan gaya pamer skill (sarkas tapi keren).`,
                remoteJid
            );

            // Kirim gambar langsung menggunakan URL (Baileys otomatis akan menarik datanya)
            await sock.sendMessage(remoteJid, { 
                image: { url: ppUrl }, 
                caption: successMsg 
            }, { quoted: m.messages[0] });
            
            helper.coolLog('SUCCESS', `Profile Picture Stolen: ${targetJid.split('@')[0]}`);
        } catch (err) {
            const failMsg = await groq.getZoeDirective(
                `Gagal mengambil / membajak poto profil target karena dicurigai foto diprivasi (atau error: ${err.message}). Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
        return;
    }

    // --- CEK REGISTRASI WHATSAPP (.cekwa) ---
    if (['cekwa'].includes(command)) {
        // Ambil target (melalui list tag koma/spasi atau nomor args)
        // Kita juga bisa mengambil fallback jika yang direply itu ada
        let targets = [];
        
        if (m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targets = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid;
        } else if (args.length > 0) {
            // Gabung jadi satu spasi, lalu pecah dengan regex batas / koma
            targets = args.join(' ').split(/[\s,]+/).map(n => n.replace(/[^\d]/g, '') + '@s.whatsapp.net');
        } else if (helper.getQuotedSender(m)) {
            targets = [helper.getQuotedSender(m)];
        }

        // Filter membuang yang hanya blank @s.whatsapp.net
        targets = targets.filter(t => t.length > 18); // memastikan string tidak kosong sebelum "s.whatsapp.net"

        if (targets.length === 0) {
            const hintMsg = await groq.getZoeDirective(
                `Boss nyuruh ngecek status WA nomor, tapi nggak masukin nomor tujuan. Kasih contoh penggunaan: .cekwa 628xxx, 629xxx (bisa pakai banyak nomor/koma sekaligus).`,
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintMsg }, { quoted: m.messages[0] });
        }

        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            
            // Lakukan pengecekan ke Database API Meta (Baileys)
            const queryResults = await sock.onWhatsApp(...targets);
            
            let statusReport = `📡 *NEURAL NUMBER SCANNER*\n`;
            statusReport += `──────────────────────\n`;

            if (!queryResults || queryResults.length === 0) {
                statusReport += `❌ Sistem gagal menarik kueri dari server.`;
            } else {
                queryResults.forEach((res, i) => {
                    const number = res.jid.split('@')[0];
                    if (res.exists) {
                        statusReport += `✅ +${number} — [ TERDAFTAR WHATSAPP ]\n`;
                    } else {
                        statusReport += `🚫 +${number} — [ TIDAK/BELUM TERDAFTAR ]\n`;
                    }
                });
            }

            const headerZoe = await groq.getZoeDirective(
                `Zoe berhasil melakukan pemindaian sinkronisasi nomor kontak untuk Boss. Sampaikan laporan scanner ini dengan wibawa dan angkuh.`,
                remoteJid
            );

            await sock.sendMessage(remoteJid, { text: `${headerZoe}\n\n${statusReport}` }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Scanned ${targets.length} number(s) registration`);
        } catch (err) {
            const failReq = await groq.getZoeDirective(
                `Gagal melakukan proses inspeksi nomor karena rute dilarang/diblokir oleh server privasi (${err.message}). Kasih alert tipis ke Boss.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: failReq }, { quoted: m.messages[0] });
        }
    }
}
