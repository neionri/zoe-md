/**
 * COMMAND: Neural Chat Control (Owner Only)
 * -----------------------------------------
 * Manajemen chat personal Zoe: arsip, pin, hapus, dan
 * pengaturan pesan sementara default untuk semua chat baru.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'arsip';
export const aliases = ['pin', 'unpin', 'hapuschat', 'defaulthilang'];
export const hiddenAliases = ['archive', 'deletechat', 'defaultdisappear'];
export const description = 'Neural Chat Manager (Owner Only).';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, isGroup, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective(
            'User lancang nyoba ngatur-ngatur chat internal Zoe. Usir dengan gaya Zoe yang sarkas dan dingin.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // ============================================================
    // --- ARSIP CHAT (.arsip, .archive) ---
    // Mengarsipkan atau membuka arsip chat.
    // ============================================================
    if (['arsip', 'archive'].includes(command)) {
        const input = (args[0] || '').toLowerCase().trim();
        const shouldArchive = input !== 'buka' && input !== 'off' && input !== 'open';

        // Tentukan target: dari args JID, atau chat saat ini
        let targetJid = remoteJid;
        if (args[0] && args[0].includes('@')) targetJid = args[0];
        else if (args[0]?.match(/^\d+$/)) targetJid = args[0] + '@s.whatsapp.net';

        try {
            await sock.chatModify({ archive: shouldArchive }, targetJid);
            const status = shouldArchive ? 'diarsipkan' : 'dikeluarkan dari arsip';
            const successMsg = await groq.getZoeDirective(
                `Chat ${targetJid.split('@')[0]} berhasil ${status}. Lapor ke Boss dengan gaya Zoe yang profesional dan singkat.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successMsg }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Chat ${status}: ${targetJid}`);
        } catch (err) {
            const failMsg = await groq.getZoeDirective(
                `Gagal mengarsipkan chat karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
    }

    // ============================================================
    // --- PIN CHAT (.pin, .unpin) ---
    // Pin atau unpin chat agar muncul di bagian paling atas.
    // ============================================================
    if (['pin', 'unpin'].includes(command)) {
        const shouldPin = command === 'pin';

        // Tentukan target JID
        let targetJid = remoteJid;
        if (args[0] && args[0].includes('@')) targetJid = args[0];
        else if (args[0]?.match(/^\d+$/)) targetJid = args[0] + '@s.whatsapp.net';

        try {
            await sock.chatModify(
                shouldPin
                    ? { pin: Date.now() }       // Pin: timestamp sekarang
                    : { pin: null },             // Unpin: null
                targetJid
            );
            const status = shouldPin ? 'dipinned ke atas' : 'di-unpin';
            const successPin = await groq.getZoeDirective(
                `Chat ${targetJid.split('@')[0]} berhasil ${status}. Lapor ke Boss dengan gaya Zoe yang tegas dan singkat.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successPin }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Chat ${status}: ${targetJid}`);
        } catch (err) {
            const failPin = await groq.getZoeDirective(
                `Gagal ${shouldPin ? 'pin' : 'unpin'} chat karena: ${err.message}. Lapor ke Boss.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failPin}` }, { quoted: m.messages[0] });
        }
    }

    // ============================================================
    // --- HAPUS CHAT (.hapuschat, .deletechat) ---
    // Menghapus riwayat chat dari sisi bot (TIDAK menghapus dari HP pengguna lain).
    // HANYA bisa di Private Chat (bukan di dalam grup yang sama).
    // ============================================================
    if (['hapuschat', 'deletechat'].includes(command)) {
        let targetJid = remoteJid;
        if (args[0] && args[0].includes('@')) targetJid = args[0];
        else if (args[0]?.match(/^\d+$/)) targetJid = args[0] + '@s.whatsapp.net';

        try {
            // Perlu menyertakan pesan terakhir untuk penanda posisi hapus
            const lastMsg = m.messages[0];
            await sock.chatModify(
                {
                    delete: true,
                    lastMessages: [{
                        key: lastMsg.key,
                        messageTimestamp: lastMsg.messageTimestamp
                    }]
                },
                targetJid
            );
            const successDel = await groq.getZoeDirective(
                `Riwayat chat ${targetJid.split('@')[0]} berhasil dihapus dari sisi Zoe. Beritahu Boss dengan gaya Zoe yang dingin dan sarkas.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successDel }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Chat History Deleted: ${targetJid}`);
        } catch (err) {
            const failDel = await groq.getZoeDirective(
                `Gagal menghapus riwayat chat karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failDel}` }, { quoted: m.messages[0] });
        }
    }

    // ============================================================
    // --- DEFAULT PESAN SEMENTARA (.defaulthilang, .defaultdisappear) ---
    // Mengatur durasi pesan sementara default untuk semua chat BARU.
    // ============================================================
    if (['defaulthilang', 'defaultdisappear'].includes(command)) {
        const input = (args[0] || '').toLowerCase().trim();

        const durasiMap = {
            'off': 0, 'mati': 0, 'nonaktif': 0,
            '1d': 86400, '1hari': 86400,
            '7d': 604800, '7hari': 604800,
            '90d': 7776000, '90hari': 7776000,
        };

        if (!input || !(input in durasiMap)) {
        const hintMsg = await groq.getZoeDirective(
                'Boss minta atur default pesan sementara tapi tidak kasih durasinya. Kasih tau pilihan yang tersedia: 1d, 7d, 90d, atau off. Pake gaya Zoe yang sarkas tapi informatif.',
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintMsg }, { quoted: m.messages[0] });
        }

        const durasi = durasiMap[input];

        try {
            await sock.updateDefaultDisappearingMode(durasi);

            let statusLabel;
            if (durasi === 0) statusLabel = 'dimatikan — semua chat baru pakai mode normal';
            else if (durasi === 86400) statusLabel = 'diset 1 hari untuk semua chat baru';
            else if (durasi === 604800) statusLabel = 'diset 7 hari untuk semua chat baru';
            else statusLabel = 'diset 90 hari untuk semua chat baru';

            const successDefault = await groq.getZoeDirective(
                `Mode pesan sementara default Zoe resmi ${statusLabel}. Beritahu Boss dengan gaya Zoe yang tegas dan berwibawa.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successDefault }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Default Disappearing Mode: ${durasi}s`);
        } catch (err) {
            const failDefault = await groq.getZoeDirective(
                `Gagal mengubah default pesan sementara karena: ${err.message}. Lapor ke Boss.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failDefault}` }, { quoted: m.messages[0] });
        }
    }
}
