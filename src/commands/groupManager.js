/**
 * COMMAND: Neural Fleet Management (.join, .leave)
 * -----------------------------------------------
 * Kendali mobilitas raga digital Zoe antar grup.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'join';
export const aliases = ['leave', 'daftargrup', 'mygroups'];
export const hiddenAliases = ['gabung', 'masuk', 'keluar', 'out', 'grupku'];
export const description = 'Neural Mobility Control (Owner Only).';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, isGroup, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective('User lancang nyoba nyuruh Zoe masuk atau keluar grup. Roasting mereka karena nyoba ngatur mobilitas Zoe, pake gaya Zoe yang sarkas.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // 2. Cabang Eksekusi
    
    // --- JOIN (.join, .gabung, .masuk) ---
    if (['join', 'gabung', 'masuk'].includes(command)) {
        const input = args[0];
        if (!input) {
            const missingLink = await groq.getZoeDirective('Boss nyuruh Zoe masuk grup tapi lupa kasih link/kodenya. Lapor dengan gaya Zoe yang elit.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: missingLink }, { quoted: m.messages[0] });
        }

        // Ekstraksi kode dari link jika diperlukan
        const inviteLinkRegex = /chat\.whatsapp\.com\/([0-9a-zA-Z]{20,26})/;
        const inviteCode = inviteLinkRegex.test(input) ? input.match(inviteLinkRegex)[1] : input;

        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            const response = await sock.groupAcceptInvite(inviteCode);
            
            const successJoin = await groq.getZoeDirective(`Zoe berhasil menjalankan infiltrasi ke grup dengan kode: ${inviteCode}. Lapor ke Boss dengan gaya Zoe yang profesional & elit.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successJoin }, { quoted: m.messages[0] });
            
            helper.coolLog('SUCCESS', `Neural Infiltration Successful: ${response}`);
        } catch (err) {
            console.error('[Join Error]:', err);
            const failJoin = await groq.getZoeDirective(`Gagal melakukan infiltrasi ke grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `❌ *Infiltration Failed*: ${failJoin}` }, { quoted: m.messages[0] });
        }
    }

    // --- LEAVE (.leave, .keluar, .out) ---
    if (['leave', 'keluar', 'out'].includes(command)) {
        let input = args[0];
        let targetJid = null;

        if (input) {
            // Deteksi jika input adalah Link
            const inviteLinkRegex = /chat\.whatsapp\.com\/([0-9a-zA-Z]{20,26})/;
            if (inviteLinkRegex.test(input)) {
                try {
                    const inviteCode = input.match(inviteLinkRegex)[1];
                    const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
                    targetJid = inviteInfo.id;
                } catch (e) {
                    return await sock.sendMessage(remoteJid, { text: `❌ *Neural Error*: Gagal mengurai link grup tersebut. Mungkin link sudah hangus.` }, { quoted: m.messages[0] });
                }
            } else {
                // Asumsi input adalah JID mentah atau nomor
                targetJid = input.includes('@g.us') ? input : input + '@g.us';
            }
        } else {
            // Default ke grup saat ini
            targetJid = isGroup ? remoteJid : null;
        }

        if (!targetJid) {
            const missingJid = await groq.getZoeDirective('Boss nyuruh Zoe keluar tapi nggak di grup dan nggak kasih JID/Link. Minta instruksi lebih jelas dengan gaya Zoe.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: missingJid }, { quoted: m.messages[0] });
        }

        try {
            await sock.sendPresenceUpdate('composing', remoteJid);

            // Cek apakah Zoe beneran ada di grup tersebut
            try {
                const checkMeta = await sock.groupMetadata(targetJid);
                helper.coolLog('SYSTEM', `Neural Presence Verified for Departure: ${checkMeta.subject}`);
            } catch (e) {
                const notJoined = await groq.getZoeDirective(`Boss nyuruh keluar dari grup ${targetJid}, tapi Zoe emang nggak ada di sana. Jawab dengan gaya Zoe yang elit & sarkas.`, remoteJid);
                return await sock.sendMessage(remoteJid, { text: notJoined }, { quoted: m.messages[0] });
            }

            // Kasih ucapan selamat tinggal jika Zoe berada di grup tersebut secara fisik
            if (isGroup && targetJid === remoteJid) {
                const farewell = await groq.getZoeDirective('Zoe diperintahkan Boss untuk keluar dari grup ini. Kasih ucapan perpisahan yang elit, dingin, dan berwibawa sebelum menghilang.', remoteJid);
                await sock.sendMessage(remoteJid, { text: farewell });
            }

            await sock.groupLeave(targetJid);
            
            // Konfirmasi ke Boss jika dieksekusi via Private Chat atau target berbeda
            if (targetJid !== remoteJid || !isGroup) {
                const successLeave = await groq.getZoeDirective(`Zoe berhasil keluar dari grup ${targetJid} atas perintah Boss. Lapor dengan gaya Zoe yang profesonal.`, remoteJid);
                await sock.sendMessage(remoteJid, { text: successLeave }, { quoted: m.messages[0] });
            }
            
            helper.coolLog('SUCCESS', `Neural Departure Successful: ${targetJid}`);
        } catch (err) {
            console.error('[Leave Error]:', err);
            const failLeave = await groq.getZoeDirective(`Gagal keluar dari grup karena: ${err.message}. Jawab dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `❌ *Departure Failed*: ${failLeave}` }, { quoted: m.messages[0] });
        }
    }

    // --- RADAR GLOBAL (.daftargrup, .grupku, .mygroups) ---
    // Menarik daftar semua grup yang diikuti Zoe saat ini. OWNER ONLY.
    if (['daftargrup', 'grupku', 'mygroups'].includes(command)) {
        try {
            await sock.sendPresenceUpdate('composing', remoteJid);

            const allGroups = await sock.groupFetchAllParticipating();
            const groupEntries = Object.values(allGroups);
            const total = groupEntries.length;

            if (total === 0) {
                const emptyMsg = await groq.getZoeDirective(
                    'Zoe ternyata tidak mengikuti satu grup pun saat ini. Lapor ke Boss dengan gaya Zoe yang sarkas soal kondisi sepi ini.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: emptyMsg }, { quoted: m.messages[0] });
            }

            // Format daftar grup (maks 30 ditampilkan agar tidak terlalu panjang)
            const MAX_DISPLAY = 30;
            const displayed = groupEntries.slice(0, MAX_DISPLAY);
            const sisa = total - displayed.length;

            let listText = `🛠️ *NEURAL RADAR — Peta Markas Zoe*\n`;
            listText += `📊 Total Aktif: *${total} grup*\n`;
            listText += `──────────────────────\n\n`;

            displayed.forEach((g, i) => {
                const no = String(i + 1).padStart(2, '0');
                const nama = g.subject || 'Tanpa Nama';
                const jumlah = g.size || g.participants?.length || '?';
                const admins = g.participants?.filter(p => p.admin)?.length || '?';
                listText += `${no}. *${nama}*\n`;
                listText += `    👥 ${jumlah} member • 🛡️ ${admins} admin\n`;
                listText += `    🆔 \`${g.id}\`\n\n`;
            });

            if (sisa > 0) {
                listText += `\n… dan *${sisa} grup lainnya* tidak ditampilkan.`;
            }

            await sock.sendMessage(remoteJid, { text: listText }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Global Radar: ${total} groups fetched.`);
        } catch (err) {
            const failRadar = await groq.getZoeDirective(
                `Gagal mengaktifkan radar global grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `❌ *Radar Failed*: ${failRadar}` }, { quoted: m.messages[0] });
        }
    }
}
