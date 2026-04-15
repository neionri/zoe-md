/**
 * COMMAND: Neural Block Control (Owner Only)
 * -----------------------------------------
 * Tindakan eksekusi blokir dan buka blokir untuk 
 * menangkal ancaman atau spammer pada nomor bot.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'block';
export const aliases = ['unblock', 'listblock'];
export const hiddenAliases = ['blokir', 'buka', 'daftarblock'];
export const description = 'Neural Defense System (Owner Only).';
export const category = 'Owner';

export default async function run(sock, m, { command, args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective(
            'User awam mencoba memakai sistem pertahanan (blokir/unblock) milik Zoe. Usir dengan gaya elit dan sarkas.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // ============================================================
    // --- LIST BLOCK (.listblock, .daftarblock) ---
    // ============================================================
    if (['listblock', 'daftarblock'].includes(command)) {
        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            const blockedUsers = await sock.fetchBlocklist();

            if (!blockedUsers || blockedUsers.length === 0) {
                const emptyMsg = await groq.getZoeDirective(
                    'Boss minta daftar blacklist, tapi ternyata daftarnya kosong (tidak ada yang diblokir satupun). Lapor dengan gaya Zoe yang lega atau nyindir.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: emptyMsg }, { quoted: m.messages[0] });
            }

            let report = `🛡️ *NEURAL BLACKLIST — ZOE DEFENSE*\n`;
            report += `📊 Total Ancaman Diblokir: *${blockedUsers.length} Nomor*\n`;
            report += `──────────────────────\n\n`;

            const mentions = [];
            blockedUsers.forEach((jid, i) => {
                const num = jid.split('@')[0];
                const no = String(i + 1).padStart(2, '0');
                report += `${no}. @${num}\n`;
                mentions.push(jid);
            });

            await sock.sendMessage(remoteJid, { text: report, mentions }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Fetched Blocklist: ${blockedUsers.length}`);
        } catch (err) {
            const failMsg = await groq.getZoeDirective(
                `Gagal mengambil daftar blacklist karena error: ${err.message}. Lapor ke Boss.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
        return; // Hentikan eksekusi setelah command blocklist
    }

    // ============================================================
    // --- BLOCK / UNBLOCK EKSEKUTIF ---
    // ============================================================
    let target = helper.getQuotedSender(m);
    if (!target && m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (!target && args[0]) {
        target = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
    }

    if (!target || target === '@s.whatsapp.net') {
        const missTargetMsg = await groq.getZoeDirective(
            'Boss nyuruh eksekusi blokir/unblock tapi tidak nyebutin sasarannya siapa (nggak ada tag atau nomor). Sindir dikit biar lebih teliti.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: missTargetMsg }, { quoted: m.messages[0] });
    }

    target = helper.jidNormalize(target);
    const targetNumber = target.split('@')[0];

    // 3. Protokol Anti-Senjata Makan Tuan
    const myJid = helper.jidNormalize(sock.user.id);
    if (target === myJid) {
        const selfBlockMsg = await groq.getZoeDirective(
            'Boss malah masukin nomor Zoe sendiri buat diblokir. Protes ke Boss dengan gaya sarkas kenapa mau blokir sistemnya sendiri.',
            remoteJid 
        );
        return await sock.sendMessage(remoteJid, { text: selfBlockMsg }, { quoted: m.messages[0] });
    }

    // Identifikasi tindakan berdasarkan command yang dipanggil
    const action = ['unblock', 'buka'].includes(command) ? 'unblock' : 'block';

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);
        
        // Mengeksekusi aksi blokir/cabut blokir di server WA
        await sock.updateBlockStatus(target, action);

        let directive;
        if (action === 'block') {
            directive = `Berhasil memblokir permanen nomor +${targetNumber}. Kasih tau Boss dengan gaya Zoe yang dingin, elit, dan tanpa ampun.`;
        } else {
            directive = `Berhasil mencabut blokir / memulihkan nomor +${targetNumber}. Kasih tau Boss dengan gaya Zoe bahwa orang ini diberi kesempatan kedua.`;
        }

        const successMsg = await groq.getZoeDirective(directive, remoteJid);
        
        await sock.sendMessage(remoteJid, { text: successMsg }, { quoted: m.messages[0] });
        helper.coolLog('SUCCESS', `Defensive Action: target ${targetNumber} has been ${action}ed`);

    } catch (err) {
        const failMsg = await groq.getZoeDirective(
             `Gagal melakukan aksi ${action} pada target +${targetNumber} karena error: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
             remoteJid
        );
        await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        helper.coolLog('ERROR', `Defense System Failed: ${err.message}`);
    }
}
