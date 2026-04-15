/**
 * COMMAND: Neural Member Control (.kick, .promote, .demote)
 * ---------------------------------------------------------
 * Otoritas moderasi partisipan grup.
 * Akses: Owner atau Admin Grup.
 * Fitur 'Add' ditiadakan demi keamanan.
 */

export const name = 'kick';
export const aliases = ['promote', 'demote', 'listreq', 'approve', 'reject'];
export const hiddenAliases = ['tendang', 'remove', 'admin', 'upkasta', 'unadmin', 'downkasta', 'antrian', 'setujui', 'tolak'];
export const description = 'Neural Member Exekutor (Admin Only).';
export const category = 'Group Control';

export default async function run(sock, m, { command, args, helper, isOwner, isGroup, groq }) {
    // 1. Validasi Konteks Grup
    if (!isGroup) {
        const rejection = await groq.getZoeDirective('User nyoba perintah moderasi grup di Private Chat. Usir pake gaya Zoe yang sarkas & elit.', helper.getSender(m));
        return await sock.sendMessage(helper.getSender(m), { text: rejection });
    }

    const remoteJid = helper.getSender(m);
    const participantJid = helper.getParticipant(m);

    // 2. Tarik Metadata & Intelijen Identitas (Deep Scan)
    const meta = await sock.groupMetadata(remoteJid);
    const myJid = helper.jidNormalize(sock.user.id);
    const myLid = sock.user.lid ? helper.jidNormalize(sock.user.lid) : null;
    const senderJid = helper.jidNormalize(participantJid);

    // Cari status partisipan di meta via Helper
    const senderPart = helper.findParticipant(meta, senderJid);
    const botPart = helper.findParticipant(meta, myJid) || (myLid ? helper.findParticipant(meta, myLid) : null);

    const isAdmin = senderPart?.admin || false;
    const isBotAdmin = botPart?.admin || false;

    // 3. Verifikasi Otoritas Pengirim
    if (!isAdmin && !isOwner) {
        const rejection = await groq.getZoeDirective('User bukan admin nyoba nendang/atur kasta orang. Roasting kasta mereka pake gaya Zoe.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // 4. Verifikasi Otoritas Zoe (Bot)
    if (!isBotAdmin) {
        const botNotAdmin = await groq.getZoeDirective('Zoe diminta eksekusi kasta tapi Zoe sendiri belum jadi Admin di grup ini. Mengeluh ke admin pake gaya Zoe yang dingin.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: botNotAdmin }, { quoted: m.messages[0] });
    }

    // 5. Identifikasi Target
    let target = helper.getQuotedSender(m); // Dari reply
    if (m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid[0]; // Dari tag
    } else if (args[0]) {
        // Dari nomor mentah
        target = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
    }

    if (!target) {
        const missingTarget = await groq.getZoeDirective('Boss/Admin mau eksekusi orang tapi lupa sasaran (nggak ada tag/reply). Kasih tau dengan gaya Zoe.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: missingTarget }, { quoted: m.messages[0] });
    }

    // Normalisasi Target Mutlak (Hapus device suffix agar cocok dengan daftar admin)
    target = helper.jidNormalize(target);

    // 6. Protokol Perlindungan Owner & Self
    const ownerLid = helper.jidNormalize(process.env.OWNER_LID);
    if (target === myJid) {
        const selfKick = await groq.getZoeDirective('User/Boss nyuruh Zoe nendang dirinya sendiri. Jawab dengan gaya Zoe yang sinis dan mempertanyakan kewarasan mereka.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: selfKick }, { quoted: m.messages[0] });
    }
    if (target === ownerLid || target.includes(process.env.OWNER_LID?.split('@')[0])) {
        const protectOwner = await groq.getZoeDirective('User nyoba nendang/demote Boss (Owner). Kasih pembelaan elit buat Boss.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: protectOwner }, { quoted: m.messages[0] });
    }

    // 7. Cabang Eksekusi
    const targetNumber = target.split('@')[0];
    
    // --- KICK (.kick, .tendang, .remove) ---
    if (['kick', 'tendang', 'remove'].includes(command)) {
        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], 'remove');
            const successKick = await groq.getZoeDirective(`Beritahu kalau @${targetNumber} resmi disingkirkan dari grup. Pake gaya Zoe yang dingin & elit.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: successKick, mentions: [target] });
        } catch (e) {
            const failKick = await groq.getZoeDirective(`Gagal nendang @${targetNumber}. Kasih alasan dengan gaya Zoe yang elit (misal: target punya perlindungan atau sistem lagi sibuk).`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: failKick, mentions: [target] });
        }
    }

    // --- PROMOTE (.promote, .admin, .upkasta) ---
    if (['promote', 'admin', 'upkasta'].includes(command)) {
        const targetPart = findParticipant(target);
        if (targetPart?.admin) {
            const alreadyAdmin = await groq.getZoeDirective(`Target @${targetNumber} udah jadi Admin. Sindir yang nyuruh pake gaya Zoe yang elit.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: alreadyAdmin, mentions: [target] }, { quoted: m.messages[0] });
        }
        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], 'promote');
            const successPromote = await groq.getZoeDirective(`Beritahu kalau @${targetNumber} resmi diangkat jadi Admin. Pake gaya Zoe yang mewah & elit.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: successPromote, mentions: [target] }, { quoted: m.messages[0] });
        } catch (e) {
            const failPromote = await groq.getZoeDirective(`Gagal ngangkat @${targetNumber} jadi Admin. Jawab dengan gaya Zoe yang dingin.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: failPromote, mentions: [target] }, { quoted: m.messages[0] });
        }
    }

    // --- DEMOTE (.demote, .unadmin, .downkasta) ---
    if (['demote', 'unadmin', 'downkasta'].includes(command)) {
        const targetPart = findParticipant(target);
        if (!targetPart?.admin) {
            const notAdmin = await groq.getZoeDirective(`Target @${targetNumber} emang bukan admin (rakyat jelata). Sindir pengirimnya pake gaya Zoe.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: notAdmin, mentions: [target] }, { quoted: m.messages[0] });
        }
        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], 'demote');
            const successDemote = await groq.getZoeDirective(`Beritahu kalau kasta admin @${targetNumber} resmi dicopot. Sindir dikit pake gaya Zoe yang dingin.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: successDemote, mentions: [target] }, { quoted: m.messages[0] });
        } catch (e) {
            const failDemote = await groq.getZoeDirective(`Gagal mencopot jabatan @${targetNumber}. Jawab dengan gaya Zoe.`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: failDemote, mentions: [target] }, { quoted: m.messages[0] });
        }
    }

    // --- LIHAT ANTRIAN BERGABUNG (.listreq, .antrian) ---
    // Menampilkan daftar orang yang menunggu persetujuan untuk masuk grup.
    if (['listreq', 'antrian'].includes(command)) {
        try {
            const requests = await sock.groupRequestParticipantsList(remoteJid);

            if (!requests || requests.length === 0) {
                const emptyQueue = await groq.getZoeDirective(
                    'Antrian bergabung grup kosong, tidak ada yang menunggu persetujuan. Lapor ke Boss/Admin dengan gaya Zoe yang singkat dan sarkas.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: emptyQueue }, { quoted: m.messages[0] });
            }

            let listText = `⏳ *ANTRIAN BERGABUNG*\n`;
            listText += `📊 Total Menunggu: *${requests.length} orang*\n`;
            listText += `──────────────────────\n\n`;

            const mentions = [];
            requests.forEach((req, i) => {
                const no = String(i + 1).padStart(2, '0');
                const jid = req.jid || req.id || req;
                const nomor = jid.split('@')[0].split(':')[0];
                listText += `${no}. @${nomor}\n`;
                mentions.push(jid);
            });

            listText += `\n💡 Gunakan \`.setujui all\` atau \`.tolak all\` untuk eksekusi massal.\n`;
            listText += `Atau \`.setujui @nomor\` / \`.tolak @nomor\` untuk satu per satu.`;

            await sock.sendMessage(remoteJid, { text: listText, mentions }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Request List Fetched: ${requests.length} pending.`);
        } catch (err) {
            const failList = await groq.getZoeDirective(
                `Gagal mengambil daftar antrian bergabung karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failList}` }, { quoted: m.messages[0] });
        }
    }

    // --- SETUJUI / TOLAK PERMINTAAN (.setujui, .approve, .tolak, .reject) ---
    // Menyetujui atau menolak permintaan bergabung grup secara satuan atau massal.
    if (['setujui', 'approve', 'tolak', 'reject'].includes(command)) {
        const action = ['setujui', 'approve'].includes(command) ? 'approve' : 'reject';
        const actionLabel = action === 'approve' ? 'disetujui' : 'ditolak';
        const input = (args[0] || '').toLowerCase().trim();

        try {
            // Ambil daftar antrian terlebih dahulu
            const requests = await sock.groupRequestParticipantsList(remoteJid);

            if (!requests || requests.length === 0) {
                const emptyQueue = await groq.getZoeDirective(
                    'Tidak ada antrian bergabung yang perlu diproses. Antrian sudah kosong. Lapor dengan gaya Zoe yang sarkas.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: emptyQueue }, { quoted: m.messages[0] });
            }

            let targets = [];

            if (input === 'all' || input === 'semua' || input === '') {
                // Eksekusi MASSAL — semua yang ada di antrian
                targets = requests.map(r => r.jid || r.id || r);
            } else {
                // Eksekusi SATUAN — cari berdasarkan tag atau nomor
                const mentionedJid = m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const rawNumber = input.replace(/[^\d]/g, '');
                const targetJid = mentionedJid || (rawNumber ? rawNumber + '@s.whatsapp.net' : null);

                if (!targetJid) {
                    const hintTarget = await groq.getZoeDirective(
                        'Boss/Admin mau approve/reject orang tapi tidak kasih targetnya. Kasih tau cara pakainya: tag nomor atau ketik all untuk semua. Pake gaya Zoe yang sarkas.',
                        remoteJid
                    );
                    return await sock.sendMessage(remoteJid, { text: hintTarget }, { quoted: m.messages[0] });
                }

                // Cek apakah target ada di antrian
                const found = requests.find(r => {
                    const jid = r.jid || r.id || r;
                    return helper.jidNormalize(jid) === helper.jidNormalize(targetJid);
                });

                if (!found) {
                    const notFound = await groq.getZoeDirective(
                        'Nomor yang dicari tidak ada di antrian bergabung grup. Beritahu Boss/Admin dengan gaya Zoe yang sarkas.',
                        remoteJid
                    );
                    return await sock.sendMessage(remoteJid, { text: notFound }, { quoted: m.messages[0] });
                }

                targets = [found.jid || found.id || found];
            }

            // Eksekusi update
            await sock.groupRequestParticipantsUpdate(remoteJid, targets, action);

            const jumlah = targets.length;
            const directive = action === 'approve'
                ? `${jumlah} orang berhasil disetujui masuk ke grup. Umumkan dengan gaya Zoe yang berwibawa dan tegas.`
                : `${jumlah} orang berhasil ditolak dan disingkirkan dari antrian bergabung. Umumkan dengan gaya Zoe yang dingin dan sarkas.`;

            const successMsg = await groq.getZoeDirective(directive, remoteJid);
            await sock.sendMessage(remoteJid, { text: successMsg }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Request ${actionLabel}: ${jumlah} participants.`);

        } catch (err) {
            const failMsg = await groq.getZoeDirective(
                `Gagal memproses permintaan bergabung karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
    }
}
