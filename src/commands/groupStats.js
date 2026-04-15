/**
 * COMMAND: Neural Group Inspector (.inspect)
 * -----------------------------------------
 * Audit mendalam terhadap metadata dan ekosistem grup.
 * Akses: Owner atau Admin Grup.
 */

export const name = 'inspect';
export const aliases = [];
export const hiddenAliases = ['ginfo', 'groupinfo'];
export const description = 'Neural Group Intelligence (Admin Only).';
export const category = 'Group Control';

export default async function run(sock, m, { command, args, helper, isOwner, isGroup, groq }) {
    const remoteJid = helper.getSender(m);
    const participantJid = helper.getParticipant(m);

    // 1. Deteksi Target (Link, JID, atau Grup saat ini)
    const input = args[0] || "";
    const inviteLinkRegex = /chat\.whatsapp\.com\/([0-9a-zA-Z]{20,26})/;
    const isLink = inviteLinkRegex.test(input);
    const inviteCode = isLink ? input.match(inviteLinkRegex)[1] : null;

    let targetJid = !isLink ? (input || (isGroup ? remoteJid : null)) : null;

    if (!targetJid && !inviteCode) {
        return await sock.sendMessage(remoteJid, { 
            text: '⚠️ *Neural Input Needed*: Kirim link grup atau JID-nya boss. Kalau di grup, tinggal ketik `.inspect` aja.' 
        });
    }

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        let meta = null;
        let isRemote = false;

        // 2. Rute Pengambilan Intelijen
        if (isLink) {
            // RUTE A: Peeking lewat Link Undangan
            meta = await sock.groupGetInviteInfo(inviteCode);
            isRemote = true;
        } else {
            // RUTE B: Audit lewat JID (Grup yang sudah diikuti)
            if (!targetJid.endsWith('@g.us')) targetJid += '@g.us';
            meta = await sock.groupMetadata(targetJid);
        }

        // 3. Verifikasi Otoritas
        // Private Chat: Harus Owner | Group: Admin/Owner
        if (!isGroup && !isOwner) {
            const rejection = await groq.getZoeDirective('User mencoba mengintip intelijen grup via Private Chat. Usir dengan gaya Zoe yang sarkas.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: rejection });
        }

        const admins = meta.participants?.filter(p => p.admin).map(p => p.id) || [];
        const isAdmin = admins.includes(participantJid);

        if (isGroup && !isAdmin && !isOwner) {
            const rejection = await groq.getZoeDirective('User bukan admin mencoba mengintip intelijen grup. Usir dengan gaya Zoe yang sarkas.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: rejection });
        }

        // 4. Analisis & Olah Data
        const creationTime = meta.creation || meta.groupCreatedTime;
        const creationDate = creationTime ? new Date(creationTime * 1000).toLocaleString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }) : 'Data terkunci';
        
        const owner = meta.owner || meta.subjectOwner || 'Tidak terdeteksi';
        const membersCount = meta.size || meta.participants?.length || 'N/A';
        const description = meta.desc || 'Tidak ada deskripsi neural.';

        // 5. Ekstraksi & Stabilisator Foto Profil (Neural Visual)
        let groupPP = null;
        try {
            const axios = (await import('axios')).default;
            const sharp = (await import('sharp')).default;
            const path = await import('path');
            const fs = await import('fs');

            // Ambil URL Foto Profil (HD)
            const ppUrl = await sock.profilePictureUrl(meta.id || targetJid, 'image').catch(() => null);
            
            if (ppUrl) {
                const response = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 4000 });
                // Resize & Kompres agar WA mau nampilin (300x300 JPEG)
                groupPP = await sharp(Buffer.from(response.data))
                    .resize(300, 300)
                    .jpeg({ quality: 80 })
                    .toBuffer();
                helper.coolLog('SYSTEM', `Neural Image Synced for ${meta.subject}`);
            } else {
                // Fallback ke portret Zoe jika grup nggak ada foto
                const fallbackPath = path.resolve('./zoe/zoe.png');
                if (fs.existsSync(fallbackPath)) {
                    groupPP = await sharp(fallbackPath).resize(300, 300).jpeg({ quality: 80 }).toBuffer();
                    helper.coolLog('SYSTEM', 'Using Zoe portrait as preview fallback.');
                }
            }
        } catch (e) {
            console.error('[Inspector PP Error]:', e.message);
        }

        // 6. Neural Synthesis (Format Laporan)
        let report = `🛰️ *NEURAL GROUP INSPECTION* ${isRemote ? '📡' : '🔍'}\n` +
                     `──────────────────────\n` +
                     `📝 *Subject*: ${meta.subject}\n` +
                     `🆔 *JID*: ${meta.id || 'Hidden (Link Scan)'}\n` +
                     `🏗️ *Architect*: @${owner.split('@')[0]}\n` +
                     `📅 *Created*: ${creationDate}\n` +
                     `──────────────────────\n` +
                     `👥 *Synapses (Members)*: ${membersCount}\n`;

        if (!isRemote) {
            report += `🛡️ *Admin Caste*: ${admins.length}\n`;
        }

        report += `──────────────────────\n` +
                  `🖋️ *Directive/Desc*:\n${description}\n` +
                  `──────────────────────\n` +
                  (isRemote ? `💡 _Link Scan Berhasil. Zoe belum masuk ke grup ini._` : `💡 _Audit Lokal Berhasil._`);

        await sock.sendMessage(remoteJid, { 
            text: report,
            contextInfo: {
                externalAdReply: {
                    title: meta.subject,
                    body: `Neural Population: ${membersCount} Synapses`,
                    mediaType: 1,
                    thumbnail: groupPP,
                    sourceUrl: isLink ? input : null,
                    renderLargerThumbnail: true,
                    showAdAttribution: false
                }
            },
            mentions: [owner, ...admins]
        }, { quoted: m.messages[0] });

        helper.coolLog('SUCCESS', `Neural Intel + Visual Dispatched: ${meta.subject}`);

        helper.coolLog('SUCCESS', `Neural Intel: ${meta.subject} (${isRemote ? 'Remote Link' : 'Local JID'})`);

    } catch (err) {
        console.error('[Inspector Error]:', err);
        const errorMsg = await groq.getZoeDirective(`Gagal melakukan inspeksi grup karena: ${err.message}. Lapor ke Boss dengan gaya Zoe.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: `❌ *Inspection Failed*: ${errorMsg}` });
    }
}
