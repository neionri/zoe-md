/**
 * COMMAND: Neural Privacy Manager (Owner Only)
 * -------------------------------------------
 * Kontrol penuh terhadap eksposur profil Zoe ke publik.
 * Mengatur siapa yang bisa mengundang Zoe ke grup dan
 * siapa yang bisa melihat foto wajah Zoe.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'setprivacy';
export const aliases = ['invitemode', 'fotomode', 'callmode'];
export const hiddenAliases = ['privasi', 'cekprivasi'];
export const description = 'Neural Privacy Settings (Owner Only).';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective(
            'User yang bukan Boss mencoba mengubah pengaturan privasi Zoe. Usir dengan gaya sarkas dan ancam akan blokir jika mencoba lagi.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // ============================================================
    // --- CEK PRIVASI (.cekprivasi) ---
    // Menarik seluruh data konfigurasi privasi dari Server WA
    // ============================================================
    if (command === 'cekprivasi') {
        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            const privacy = await sock.fetchPrivacySettings(true); // true = paksa ambil dari server

            let report = `🔐 *NEURAL PRIVACY STATUS*\n`;
            report += `──────────────────────\n`;
            report += `👤 *Foto Profil*: ${privacy.profile}\n`;
            report += `📞 *Panggilan*: ${privacy.calladd}\n`;
            report += `👁️ *Terakhir Dilihat*: ${privacy.last}\n`;
            report += `🌐 *Status Online*: ${privacy.online}\n`;
            report += `👥 *Grup (Invite)*: ${privacy.groupadd}\n`;
            report += `💬 *Centang Biru*: ${privacy.readreceipts}\n`;

            const intro = await groq.getZoeDirective(
                'Lapor ke Boss bahwa ini adalah laporan utuh tentang status Privasi bot Zoe dari server WA.',
                remoteJid
            );
            
            await sock.sendMessage(remoteJid, { text: `${intro}\n\n${report}` }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Fetched Privacy Settings`);
        } catch (err) {
            const failReq = await groq.getZoeDirective(
                `Gagal menarik status privasi dari server karena error: ${err.message}. Lapor ke Boss.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: failReq }, { quoted: m.messages[0] });
        }
        return; // Hentikan script di sini
    }

    const mode = args[0]?.toLowerCase();
    const value = args[1]?.toLowerCase();

    // Validasi Mode
    if (!mode || (mode !== 'invite' && mode !== 'foto' && mode !== 'call')) {
        const hintMsg = await groq.getZoeDirective(
            'Boss salah format perintah .setprivacy. Jelaskan cara pakainya: .setprivacy invite <semua/kontak/off>, .setprivacy foto <semua/kontak/off>, atau .setprivacy call <semua/known>. Singkat dan jelas.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: hintMsg }, { quoted: m.messages[0] });
    }

    // Pemetaan Nilai
    const valueMap = {
        'all': 'all', 'semua': 'all',
        'contacts': 'contacts', 'kontak': 'contacts',
        'none': 'none', 'off': 'none', 'mati': 'none',
        'known': 'known', 'dikenal': 'known'
    };

    const mappedValue = valueMap[value];

    if (!mappedValue) {
        const hintValueMsg = await groq.getZoeDirective(
            `Boss ngasih nilai referensi yang salah untuk mode ${mode}. Rujuk opsi valid: 'semua', 'kontak', 'off', atau 'known' khusus untuk call. Kasih tau Boss dengan gaya sarkas.`,
            remoteJid
        );
         return await sock.sendMessage(remoteJid, { text: hintValueMsg }, { quoted: m.messages[0] });
    }

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        if (mode === 'invite') {
            // Mengatur siapa yang bisa menginvite Zoe ke grup
            await sock.updateGroupsAddPrivacy(mappedValue);
            
            const successInvite = await groq.getZoeDirective(
                `Beritahu Boss bahwa izin untuk menambahkan Zoe ke grup sekarang disetel ke: ${mappedValue}. Lapor dengan gaya elegan tapi dingin.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successInvite }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Group Add Privacy: ${mappedValue}`);

        } else if (mode === 'foto') {
            // Mengatur siapa yang bisa melihat foto profil Zoe
            await sock.updateProfilePicturePrivacy(mappedValue);
            
            const successFoto = await groq.getZoeDirective(
                `Beritahu Boss bahwa izin untuk melihat foto wajah (profil) Zoe sekarang disetel ke: ${mappedValue}. Lapor dengan nada percaya diri dan elit.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successFoto }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Profile Picture Privacy: ${mappedValue}`);
            
        } else if (mode === 'call') {
            // Mengatur siapa yang bisa menelpon Zoe (hanya all atau known)
            if (mappedValue !== 'all' && mappedValue !== 'known') {
                 const callHintMsg = await groq.getZoeDirective(
                     `Boss masukkin nilai privasi panggilan yang salah. Opsi untuk call cuma: "semua" (all) atau "dikenal" (known). Sindir tipis aja.`,
                     remoteJid
                 );
                 return await sock.sendMessage(remoteJid, { text: callHintMsg }, { quoted: m.messages[0] });
            }
            
            await sock.updateCallPrivacy(mappedValue);
            
            const successCall = await groq.getZoeDirective(
                `Beritahu Boss bahwa izin untuk menelpon Zoe sekarang disetel ke: ${mappedValue}. Lapor dengan gaya Zoe yang profesional.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successCall }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Call Privacy: ${mappedValue}`);
        }

    } catch (err) {
        const failMsg = await groq.getZoeDirective(
            `Gagal mengubah privasi ${mode} karena error: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
             remoteJid
        );
        await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        helper.coolLog('ERROR', `Privacy Update Failed: ${err.message}`);
    }
}
