import { downloadContentFromMessage } from '@whiskeysockets/baileys';

/**
 * COMMAND: Neural Profile Control (Owner Only)
 * --------------------------------------------
 * Pengubah tampilan Identity/Profil Zoe: Nama, Bio, dan Wajah.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'setbotname';
export const aliases = ['setbotbio', 'setbotpp', 'delbotpp'];
export const hiddenAliases = ['botname', 'botbio', 'botpp'];
export const description = 'Neural Identity Manager (Owner Only).';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective(
            'User yang bukan Boss mencoba mengubah entitas dan wajah Zoe. Usir dengan gaya yang sangat sarkas, peringatkan mereka bahwa modifikasi matriks identitas sangat dilarang.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    const myJid = helper.jidNormalize(sock.user.id);
    const input = args.join(' ').trim();

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        // ============================================================
        // 1. UPDATE PROFILE NAME (.setbotname, .botname)
        // ============================================================
        if (['setbotname', 'botname'].includes(command)) {
            if (!input) {
                const hint = await groq.getZoeDirective('Sindir Boss karena mau ganti nama tapi tidak ngasih nama barunya.', remoteJid);
                return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
            }
            if (input.length > 25) {
                const limitMsg = await groq.getZoeDirective('Protes ke boss, nama profil WhatsApp tidak boleh lebih dari 25 karakter.', remoteJid);
                return await sock.sendMessage(remoteJid, { text: limitMsg }, { quoted: m.messages[0] });
            }

            await sock.updateProfileName(input);
            const successName = await groq.getZoeDirective(`Beritahu Boss bahwa nama identitas Zoe resmi diperbarui menjadi: "${input}".`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successName }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Profile Name berubah menjadi: ${input}`);
        }

        // ============================================================
        // 2. UPDATE PROFILE BIO/STATUS (.setbotbio, .botbio)
        // ============================================================
        else if (['setbotbio', 'botbio'].includes(command)) {
            if (!input) {
                const hint = await groq.getZoeDirective('Sindir Boss karena mau ganti bio/status tapi input-nya kosong. Suruh kasih isinya.', remoteJid);
                return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
            }
            if (input.length > 139) {
                const limitMsg = await groq.getZoeDirective('Protes ke boss, Bio/Status WhatsApp tidak boleh lebih dari 139 karakter.', remoteJid);
                return await sock.sendMessage(remoteJid, { text: limitMsg }, { quoted: m.messages[0] });
            }

            await sock.updateProfileStatus(input);
            const successBio = await groq.getZoeDirective(`Beritahu Boss bahwa Bio/Status WhatsApp Zoe resmi diganti menjadi: "${input}".`, remoteJid);
            await sock.sendMessage(remoteJid, { text: successBio }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Profile Bio berubah menjadi: ${input}`);
        }

        // ============================================================
        // 3. REMOVE PROFILE PICTURE (.delbotpp)
        // ============================================================
        else if (['delbotpp'].includes(command)) {
            await sock.removeProfilePicture(myJid);
            const successDel = await groq.getZoeDirective('Wajah Zoe berhasil dihapus dan dikosongkan. Beri respon ke boss bahwa Zoe sekarang tidak berwajah.', remoteJid);
            await sock.sendMessage(remoteJid, { text: successDel }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Profile Picture dihapus`);
        }

        // ============================================================
        // 4. UPDATE PROFILE PICTURE (.setbotpp, .botpp)
        // ============================================================
        else if (['setbotpp', 'botpp'].includes(command)) {
            // Ambil media (gambar) dari pesan di-reply atau pesan yang dikirim beserta caption
            const getMediaMsg = (msg) => {
                if (msg?.message?.imageMessage) return { media: msg.message.imageMessage, type: 'image' };
                if (msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                    return { media: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, type: 'image' };
                }
                return null;
            };

            const mediaData = getMediaMsg(m.messages[0]);
            
            if (!mediaData) {
                const hintMedia = await groq.getZoeDirective(
                    'Boss menyuruh ganti foto (PP) bot tapi lupa tidak mencantumkan atau mereply sebuah gambar/foto. Sindir biar Boss kirim fotonya.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: hintMedia }, { quoted: m.messages[0] });
            }

            // Proses Download Image Stream Menjadi Buffer
            const stream = await downloadContentFromMessage(mediaData.media, mediaData.type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer.length) {
                throw new Error("Gagal mengekstrak memori visual gambar.");
            }

            await sock.updateProfilePicture(myJid, buffer);
            const successPp = await groq.getZoeDirective('Visual identitas (Foto Profil) Zoe resmi diperbarui. Berikan konfirmasi elegan ke Boss dengan sedikit sarkas apakah tampilan ini bagus menurutnya.', remoteJid);
            await sock.sendMessage(remoteJid, { text: successPp }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Profile Picture diperbarui`);
        }

    } catch (err) {
        const failMsg = await groq.getZoeDirective(
             `Gagal memodifikasi identitas neural grup/bot karena error: ${err.message}. Lapor ke Boss dengan gaya Zoe.`,
             remoteJid
        );
        await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        helper.coolLog('ERROR', `Identity Modification Failed: ${err.message}`);
    }
}
