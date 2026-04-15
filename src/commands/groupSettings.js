/**
 * COMMAND: Neural Group Settings (.setname)
 * -----------------------------------------
 * Kontrol identitas dan konfigurasi internal grup.
 * Akses: Owner atau Admin Grup.
 */

export const name = 'setname';
export const aliases = ['link', 'buka', 'tutup', 'setdesc', 'resetlink', 'ephemeral', 'approval', 'addmode'];
export const hiddenAliases = ['subject', 'gname', 'grouplink', 'invitelink', 'kunci', 'revokelink', 'disappear', 'hilang', 'desc', 'deskripsi', 'joinapproval', 'memberadd', 'editinfo'];
export const description = 'Neural Group Settings & Enforcement.';
export const category = 'Group Control';

export default async function run(sock, m, { command, args, helper, isOwner, isGroup, groq }) {
    // 1. Validasi Konteks Grup
    if (!isGroup) {
        const rejection = await groq.getZoeDirective('User nyoba akses kontrol grup di Private Chat. Usir pake gaya Zoe yang sarkas & elit.', helper.getSender(m));
        return await sock.sendMessage(helper.getSender(m), { text: rejection }, { quoted: m.messages[0] });
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
        const rejection = await groq.getZoeDirective('User bukan admin nyoba utak-atik seting grup. Roasting kasta mereka pake gaya Zoe.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    // 4. Verifikasi Otoritas Zoe (Bot)
    if (!isBotAdmin) {
        const botNotAdmin = await groq.getZoeDirective('Zoe diminta akses kontrol grup tapi Zoe sendiri belum jadi Admin. Eluh ke Boss pake gaya Zoe yang dingin.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: botNotAdmin }, { quoted: m.messages[0] });
    }

    // 5. Cabang Eksekusi

    // --- SETNAME (.setname, .subject, .gname) ---
    if (['setname', 'subject', 'gname'].includes(command)) {
        const newSubject = args.join(' ');
        if (!newSubject) {
            const missingName = await groq.getZoeDirective('Boss/Admin mau ganti nama grup tapi lupa kasih nama barunya. Kasih tau dengan gaya Zoe.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: missingName }, { quoted: m.messages[0] });
        }

        if (newSubject.length > 100) {
            const nameTooLong = await groq.getZoeDirective('Boss ngasih nama grup yang kepanjangan (>100 karakter). Mengadu dengan gaya Zoe yang elit.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: nameTooLong }, { quoted: m.messages[0] });
        }

        try {
            await sock.groupUpdateSubject(remoteJid, newSubject);
            const successMsg = await groq.getZoeDirective(`Beritahu kalau nama grup resmi diganti jadi "${newSubject}". Pake gaya Zoe yang elit dan berwibawa.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successMsg }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Group Subject Updated: ${newSubject}`);
        } catch (err) {
            const failMsg = await groq.getZoeDirective(`Gagal ganti nama grup karena: ${err.message}. Jawab dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        }
    }

    // --- LINK (.link, .grouplink, .invitelink) ---
    if (['link', 'grouplink', 'invitelink'].includes(command)) {
        try {
            const code = await sock.groupInviteCode(remoteJid);
            const fullLink = `https://chat.whatsapp.com/${code}`;
            const successLink = await groq.getZoeDirective(`Berikan link undangan grup ini: ${fullLink}. Pake gaya Zoe yang elit saat membagikan kunci akses.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successLink }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Invite Link Dispatched: ${fullLink}`);
        } catch (err) {
            const failLink = await groq.getZoeDirective(`Gagal ambil link undangan karena: ${err.message}. Jawab dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `${failLink}` }, { quoted: m.messages[0] });
        }
    }

    // --- GROUP OPEN/CLOSE (.group, .buka, .tutup) ---
    if (['group', 'buka', 'tutup'].includes(command)) {
        let setting = null;
        if (command === 'buka' || args[0] === 'open') setting = 'not_announcement';
        if (command === 'tutup' || args[0] === 'close') setting = 'announcement';

        if (!setting) {
            return await sock.sendMessage(remoteJid, { text: '⚠️ *Neural Input*: Pilih mode `open` atau `close` boss.' }, { quoted: m.messages[0] });
        }

        try {
            await sock.groupSettingUpdate(remoteJid, setting);
            const status = setting === 'announcement' ? 'tertutup (Admin Only)' : 'terbuka (Public)';
            const successGroup = await groq.getZoeDirective(`Beritahu kalau gerbang chat grup resmi ${status}. Jelaskan dengan gaya Zoe yang tegas & otoriter.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successGroup }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Group Chat Status Updated: ${setting}`);
        } catch (err) {
            const failGroup = await groq.getZoeDirective(`Gagal merubah status chat grup karena: ${err.message}. Jawab dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `${failGroup}` }, { quoted: m.messages[0] });
        }
    }

    // --- EDITINFO LOCK/UNLOCK (.editinfo, .kunci) ---
    if (['editinfo', 'kunci'].includes(command)) {
        let setting = null;
        if (args[0] === 'unlock') setting = 'unlocked';
        if (command === 'kunci' || args[0] === 'lock') setting = 'locked';

        if (!setting) {
            return await sock.sendMessage(remoteJid, { text: '⚠️ *Neural Input*: Pilih mode `lock` atau `unlock` boss.' }, { quoted: m.messages[0] });
        }

        try {
            await sock.groupSettingUpdate(remoteJid, setting);
            const status = setting === 'locked' ? 'terkunci rapat' : 'terbuka bebas';
            const successInfo = await groq.getZoeDirective(`Beritahu kalau hak edit info grup sekarang ${status} untuk member. Jelaskan dengan gaya Zoe yang elit.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successInfo }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Group Info Access Updated: ${setting}`);
        } catch (err) {
            const failInfo = await groq.getZoeDirective(`Gagal merubah akses info grup karena: ${err.message}. Jawab dengan gaya Zoe.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: `${failInfo}` }, { quoted: m.messages[0] });
        }
    }

    // --- RESET LINK (.resetlink, .revokelink) ---
    if (['resetlink', 'revokelink'].includes(command)) {
        try {
            // Bakar link lama
            await sock.groupRevokeInvite(remoteJid);

            // Ambil link baru yang fresh
            const newCode = await sock.groupInviteCode(remoteJid);
            const newLink = `https://chat.whatsapp.com/${newCode}`;

            const successReset = await groq.getZoeDirective(
                `Link undangan grup lama resmi dibakar dan diganti baru: ${newLink}. Beritahu Boss/Admin dengan gaya Zoe yang tegas, elit, dan sarkas soal operasi keamanan ini.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successReset }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Invite Link Revoked & Refreshed: ${newLink}`);
        } catch (err) {
            const failReset = await groq.getZoeDirective(
                `Gagal membakar link undangan grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe yang sarkas.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failReset}` }, { quoted: m.messages[0] });
        }
    }

    // --- PESAN SEMENTARA (.ephemeral, .disappear, .hilang) ---
    // Durasi: 1d = 86400s | 7d = 604800s (default) | 90d = 7776000s | off = 0
    if (['ephemeral', 'disappear', 'hilang'].includes(command)) {
        const input = (args[0] || '').toLowerCase().trim();

        // Peta durasi yang didukung
        const durasiMap = {
            'off': 0,
            'mati': 0,
            'nonaktif': 0,
            '1d': 86400,
            '1hari': 86400,
            '7d': 604800,
            '7hari': 604800,
            '90d': 7776000,
            '90hari': 7776000,
        };

        // Jika tidak ada input atau input tidak valid, tampilkan panduan
        if (!input || !(input in durasiMap)) {
            const hintEphemeral = await groq.getZoeDirective(
                'Boss/Admin mau aktifkan Pesan Sementara di grup tapi tidak kasih durasinya. Kasih tau pilihan: 1d, 7d, 90d, atau off untuk matikan. Pake gaya Zoe yang sarkas tapi informatif.',
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintEphemeral }, { quoted: m.messages[0] });
        }

        const durasi = durasiMap[input];

        try {
            await sock.groupToggleEphemeral(remoteJid, durasi);

            let statusLabel;
            if (durasi === 0) {
                statusLabel = 'dimatikan. Semua pesan bakal abadi sekarang';
            } else if (durasi === 86400) {
                statusLabel = 'diaktifkan — pesan akan menghilang dalam 24 jam';
            } else if (durasi === 604800) {
                statusLabel = 'diaktifkan — pesan akan menghilang dalam 7 hari';
            } else {
                statusLabel = 'diaktifkan — pesan akan menghilang dalam 90 hari';
            }

            const successEphemeral = await groq.getZoeDirective(
                `Fitur Pesan Sementara (Disappearing Messages) di grup resmi ${statusLabel}. Beritahu Boss/Admin dengan gaya Zoe yang tegas, elit, dan sedikit sarkas soal perubahan mode keamanan ini.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successEphemeral }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Ephemeral Mode: ${durasi}s`);
        } catch (err) {
            const failEphemeral = await groq.getZoeDirective(
                `Gagal mengaktifkan Pesan Sementara karena: ${err.message}. Lapor ke Boss dengan gaya Zoe yang sarkas.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failEphemeral}` }, { quoted: m.messages[0] });
        }
    }

    // --- DESKRIPSI GRUP (.setdesc, .desc, .deskripsi) ---
    if (['setdesc', 'desc', 'deskripsi'].includes(command)) {
        const newDesc = args.join(' ').trim();

        // Cek panjang karakter (batas WA = 512 karakter)
        if (newDesc.length > 512) {
            const tooLong = await groq.getZoeDirective(
                `Boss ngasih deskripsi grup yang kepanjangan (lebih dari 512 karakter). Protes dengan gaya Zoe yang sarkas dan elit.`,
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: tooLong }, { quoted: m.messages[0] });
        }

        try {
            await sock.groupUpdateDescription(remoteJid, newDesc);

            let directive;
            if (!newDesc) {
                directive = `Deskripsi grup resmi dihapus total — sekarang kosong melompong. Beritahu Boss/Admin dengan gaya Zoe yang dingin dan sarkas.`;
            } else {
                directive = `Deskripsi grup resmi diperbarui menjadi: "${newDesc}". Beritahu Boss/Admin dengan gaya Zoe yang tegas dan berwibawa.`;
            }

            const successDesc = await groq.getZoeDirective(directive, remoteJid);
            await sock.sendMessage(remoteJid, { text: successDesc }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Group Description Updated: ${newDesc || '(kosong)'}`);
        } catch (err) {
            const failDesc = await groq.getZoeDirective(
                `Gagal memperbarui deskripsi grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe yang sarkas.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failDesc}` }, { quoted: m.messages[0] });
        }
    }

    // --- MODE PERSETUJUAN BERGABUNG (.approval, .joinapproval) ---
    // Mengaktifkan/menonaktifkan sistem antrian approval saat member mau masuk via link.
    if (['approval', 'joinapproval'].includes(command)) {
        const input = (args[0] || '').toLowerCase().trim();

        if (!['on', 'off', 'aktif', 'nonaktif'].includes(input)) {
            const hintApproval = await groq.getZoeDirective(
                'Boss/Admin mau atur mode approval bergabung grup tapi tidak kasih argumennya. Kasih tau pilihannya: on untuk aktifkan, off untuk nonaktifkan. Pake gaya Zoe yang tegas dan singkat.',
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintApproval }, { quoted: m.messages[0] });
        }

        const mode = (input === 'on' || input === 'aktif') ? 'on' : 'off';

        try {
            await sock.groupJoinApprovalMode(remoteJid, mode);
            const statusLabel = mode === 'on'
                ? 'diaktifkan — semua yang mau masuk via link harus nunggu persetujuan Admin dulu'
                : 'dinonaktifkan — siapapun bisa langsung masuk via link tanpa perlu izin';
            const successApproval = await groq.getZoeDirective(
                `Sistem persetujuan bergabung (Join Approval) grup resmi ${statusLabel}. Beritahu Boss/Admin dengan gaya Zoe yang tegas, otoriter, dan sarkas.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successApproval }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Join Approval Mode: ${mode}`);
        } catch (err) {
            const failApproval = await groq.getZoeDirective(
                `Gagal mengubah mode persetujuan grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failApproval}` }, { quoted: m.messages[0] });
        }
    }

    // --- MODE TAMBAH MEMBER (.addmode, .memberadd) ---
    // Mengatur siapa yang boleh menambahkan member baru ke grup.
    if (['addmode', 'memberadd'].includes(command)) {
        const input = (args[0] || '').toLowerCase().trim();

        if (!['admin', 'all', 'semua'].includes(input)) {
            const hintAddMode = await groq.getZoeDirective(
                'Boss/Admin mau atur siapa yang bisa tambah member grup tapi tidak kasih argumennya. Kasih tau pilihannya: admin untuk kunci hanya admin, all untuk buka ke semua member. Pake gaya Zoe yang tegas dan singkat.',
                remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: hintAddMode }, { quoted: m.messages[0] });
        }

        const mode = input === 'admin' ? 'admin_add' : 'all_member_add';

        try {
            await sock.groupMemberAddMode(remoteJid, mode);
            const statusLabel = mode === 'admin_add'
                ? 'dikunci — hanya Admin yang bisa menambahkan member baru'
                : 'dibuka — semua member bebas mengundang orang baru';
            const successAddMode = await groq.getZoeDirective(
                `Hak tambah member grup resmi ${statusLabel}. Beritahu Boss/Admin dengan gaya Zoe yang tegas dan berwibawa.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successAddMode }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Member Add Mode: ${mode}`);
        } catch (err) {
            const failAddMode = await groq.getZoeDirective(
                `Gagal mengubah mode tambah member karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: `${failAddMode}` }, { quoted: m.messages[0] });
        }
    }
}
