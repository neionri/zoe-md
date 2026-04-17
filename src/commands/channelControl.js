import { saveChannelAlias, getChannelAlias, deleteChannelAlias, getAllChannelAliases } from '../func/db.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

/**
 * COMMAND: Neural Channel Control (Saluran WA)
 * -----------------------------------------
 * Manajemen eksklusif Saluran/Channel WhatsApp (Newsletter).
 * Fitur: Mengintip informasi channel dan merekayasa data channel.
 * Akses: MUTLAK OWNER SAJA.
 */

export const name = 'cekchannel';
export const aliases = ['addchannel', 'delchannel', 'listchannel', 'setchannelname', 'setchannelpp', 'subchannel', 'post', 'bcchannel', 'publish'];
export const hiddenAliases = ['infosaluran', 'editchannel', 'setchanneldesc', 'delchannelpp'];
export const description = 'Neural Newsletter/Channel Management (Owner Only).';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas (Hanya Boss)
    if (!isOwner) {
        const rejection = await groq.getZoeDirective(
            'User yang bukan Boss mencoba mengotak-atik sistem Channel / Saluran. Usir dengan gaya elit dan sarkas.',
            remoteJid
        );
        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
    }

    const input = args.join(' ').trim();

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        // ============================================================
        // --- TAMBAH & HAPUS & LIST ALIAS CHANNEL DI DB ---
        // ============================================================
        if (['addchannel'].includes(command)) {
            const parts = input.split('|').map(s => s.trim());
            if (parts.length < 2) {
                const hint = await groq.getZoeDirective('Boss salah format. Kasih contoh: .addchannel [NamaAlias] | [ID/Link Channel].', remoteJid);
                return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
            }
            
            const aliasName = parts[0].toLowerCase().replace(/\s+/g, '-');
            let rawId = parts[1];
            
            if (rawId.includes('whatsapp.com/channel/')) {
                rawId = rawId.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
                rawId += '@newsletter';
            } else if (!rawId.includes('@newsletter')) {
                rawId += '@newsletter';
            }

            await saveChannelAlias(aliasName, rawId);
            const succ = await groq.getZoeDirective(`Beritahu boss bahwa ID sepanjang itu sudah disingkat dan direkam dalam memori permanen Zoe sebagai nama sandi "${aliasName}".`, remoteJid);
            return await sock.sendMessage(remoteJid, { text: succ }, { quoted: m.messages[0] });
        }

        if (['delchannel'].includes(command)) {
            if (!input) return await sock.sendMessage(remoteJid, { text: 'Mau hapus alias yang mana?' });
            const aliasName = input.toLowerCase().trim();
            const deleted = await deleteChannelAlias(aliasName);
            
            const msg = await groq.getZoeDirective(
                deleted ? `Nama sandi / alias channel "${aliasName}" resmi dihapus dari memori permanen MongoDB.` : `Sindir boss, alias "${aliasName}" itu dari awal nggak pernah ada di memori Zoe. Jangan mengada-ada.`, remoteJid
            );
            return await sock.sendMessage(remoteJid, { text: msg }, { quoted: m.messages[0] });
        }

        if (['listchannel'].includes(command)) {
            const channels = await getAllChannelAliases();
            if (channels.length === 0) {
                const empty = await groq.getZoeDirective('Lapor ke Boss kalau direktori MongoDB untuk alias channel kita masih kosong melompong. Belum ada sandi yang tercatat.', remoteJid);
                return await sock.sendMessage(remoteJid, { text: empty }, { quoted: m.messages[0] });
            }
            
            let list = `📁 *ZOE NEURAL CHANNEL ALIASES*\n──────────────────────\n`;
            channels.forEach((c, i) => { list += `[${i+1}] *${c.alias}*\n└ \`${c.jid}\`\n\n`; });
            
            const intro = await groq.getZoeDirective('Serahkan laporan daftar metrik lengkap seluruh julukan channel yang tersimpan pada memori MongoDB Zoe.', remoteJid);
            return await sock.sendMessage(remoteJid, { text: `${intro}\n\n${list}` }, { quoted: m.messages[0] });
        }

        // ============================================================
        // --- CEK PENGECEKAN CHANNEL (.cekchannel, .infosaluran) ---
        // Menarik data jumlah follower dan nama dari Server WA
        // ============================================================
        if (['cekchannel', 'infosaluran'].includes(command)) {
            if (!input) {
                const hint = await groq.getZoeDirective(
                    'Boss menyuruh cek channel tapi tidak masukin Link Channel / ID Channel. Sindir boss.',
                    remoteJid
                );
                return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
            }

            // Bisa mencari dari "invite link", "jid", atau "Alias Database"
            let type = input.includes('whatsapp.com/channel/') ? 'invite' : 'jid';
            let targetCode = input.trim();

            if (type === 'jid') {
                const dbJid = await getChannelAlias(targetCode);
                if (dbJid) {
                    targetCode = dbJid;
                } else if (!targetCode.includes('@newsletter')) {
                    targetCode += '@newsletter';
                }
            } else {
                targetCode = input.split('whatsapp.com/channel/')[1].split('/')[0].split('?')[0];
            }

            const metadata = await sock.newsletterMetadata(type, targetCode);
            
            if (!metadata) {
                throw new Error("Saluran tidak ditemukan atau bersifat sangat privat.");
            }

            let report = `📢 *NEURAL CHANNEL RADAR*\n`;
            report += `──────────────────────\n`;
            
            // Pada Meta/Baileys v7, information penting dikemas di dalam properti 'thread_metadata'
            const th = metadata.thread_metadata || {};
            const channelName = th.name?.text || metadata.name?.text || metadata.name || '(Tidak ada nama)';
            const channelDesc = th.description?.text || metadata.description?.text || metadata.description || 'Kosong';
            
            report += `📝 *Nama*: ${channelName}\n`;
            report += `🆔 *ID*: \`${metadata.id}\`\n`;
            report += `👥 *Followers*: ${th.subscribers_count || metadata.subscribers || 0} Pengikut\n`;
            report += `🔐 *Terverifikasi (Centang)*: ${th.verification === 'VERIFIED' || metadata.verification === 'VERIFIED' ? '✅ Ya' : '❌ Tidak'}\n`;
            report += `☑️ *Mute*: ${th.mute || metadata.mute || 'UNMUTED'}\n`;
            report += `──────────────────────\n`;
            report += `🖋️ *Deskripsi*:\n${channelDesc}\n`;

            const introMsg = await groq.getZoeDirective(
                `Berhasil mengekstrak informasi dan mata-mata dari Channel ${metadata.name}. Serahkan laporan tersebut ke Boss dengan bangga dan elit.`,
                remoteJid
            );

            await sock.sendMessage(remoteJid, { text: `${introMsg}\n\n${report}` }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Fetched Channel Data: ${metadata.id}`);
            return;
        }

        // ============================================================
        // --- EDIT CHANNEL / UPDATE NEWSLETTER ---
        // ============================================================
        if (['editchannel', 'setchannelname', 'setchanneldesc'].includes(command)) {
            // Deteksi pesan yang di-reply (jika bos me-reply teks untuk dijadikan bio/nama)
            let quotedText = '';
            if (m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
                quotedText = m.messages[0].message.extendedTextMessage.contextInfo.quotedMessage.conversation;
            } else if (m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text) {
                quotedText = m.messages[0].message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage.text;
            }

            const parts = input.split('|').map(s => s.trim());
            let jidNameInput = '';
            let newText = '';

            if (quotedText) {
                // Jika bos ME-REPLY teks: Formatnya bebas, misalnya cuma ".setchanneldesc base-zoe"
                jidNameInput = parts[0] || input.trim();
                newText = quotedText;
                
                if (!jidNameInput) {
                    const noIdMsg = await groq.getZoeDirective('Boss reply teks, tapi lupa ngetik alias/ID channelnya di command. Kasih tau Boss: .setchanneldesc [Alias]', remoteJid);
                    return await sock.sendMessage(remoteJid, { text: noIdMsg }, { quoted: m.messages[0] });
                }
            } else {
                // Jika tidak me-reply, WAJIB pakai format pembatas (|)
                if (parts.length < 2) {
                    const hintEdit = await groq.getZoeDirective(
                        'Boss salah format pas mau edit channel. Kasih contoh: .setchannelname [Alias/ID] | [Teks Baru]. Atau Boss bisa REPLY pesan berisi teks barunya dan ketik ".setchanneldesc [Alias/ID]".',
                        remoteJid
                    );
                    return await sock.sendMessage(remoteJid, { text: hintEdit }, { quoted: m.messages[0] });
                }
                jidNameInput = parts[0];
                newText = parts[1];
            }

            const dbJid = await getChannelAlias(jidNameInput);
            
            let jid = dbJid || jidNameInput; // pakai data hasil ekstrak database MongoDB kalau ketemu aliasnya
            if (!jid.includes('@newsletter')) jid += '@newsletter';

            let updatePayload = {};
            if (['setchannelname'].includes(command)) {
                updatePayload = { name: newText };
            } else if (['setchanneldesc'].includes(command)) {
                updatePayload = { description: newText };
            } else {
                // Command campuran jika pakai .editchannel (Asumsi ke Name)
                updatePayload = { name: newText };
            }

            // Melakukan patch update (Meminta izin Admin Channel di Server lewat library)
            await sock.newsletterUpdate(jid, updatePayload);

            const successUpdate = await groq.getZoeDirective(
                `Berhasil merekayasa metadata/setting channel ${jid} di sistem server Meta. Lapor ke Boss dengan kalimat arogan layaknya hacker elit.`,
                remoteJid
            );
            await sock.sendMessage(remoteJid, { text: successUpdate }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Channel Updated: ${jid}`);
        }

        // ============================================================
        // --- REMOVE PROFILE PICTURE / AVATAR CHANNEL (.delchannelpp) ---
        // ============================================================
        if (['delchannelpp'].includes(command)) {
            if (!input) return await sock.sendMessage(remoteJid, { text: "Alias/ID channel mana Boss?" });
            const aliasInput = input.trim();
            const dbJid = await getChannelAlias(aliasInput);
            let jid = dbJid || aliasInput;
            if (!jid.includes('@newsletter')) jid += '@newsletter';

            await sock.newsletterRemovePicture(jid);
            const succMsg = await groq.getZoeDirective(`Beritahu Boss bahwa wajah identitas channel ${jid} berhasil dihapus menjadi default abu-abu. Gaya sarkas elit.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: succMsg }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Channel Picture Removed: ${jid}`);
        }

        // ============================================================
        // --- UPDATE PROFILE PICTURE / AVATAR CHANNEL (.setchannelpp) ---
        // ============================================================
        if (['setchannelpp'].includes(command)) {
            if (!input && !m.messages[0].message?.imageMessage && !(m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage)) {
                return await sock.sendMessage(remoteJid, { text: "Boss harus menyematkan atau mereply foto! Sekaligus memasukkan Alias di pesannya: `.setchannelpp <Alias>`" });
            }

            const aliasInput = input.trim() || args[0] || '';
            if (!aliasInput) return await sock.sendMessage(remoteJid, { text: "Boss lupa memasukkan alias/ID channel!" });

            // Pengambil Objek Tipe Pesan Media
            const getMediaMsg = (msg) => {
                if (msg?.message?.imageMessage) return { media: msg.message.imageMessage, type: 'image' };
                if (msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                    return { media: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, type: 'image' };
                }
                return null;
            };

            const mediaData = getMediaMsg(m.messages[0]);
            if (!mediaData) {
                const hintMedia = await groq.getZoeDirective("Boss menyuruh ganti foto channel tapi lupa memberikan fotonya. Minta fotonya sambil nyindir Boss.", remoteJid);
                return await sock.sendMessage(remoteJid, { text: hintMedia }, { quoted: m.messages[0] });
            }

            const dbJid = await getChannelAlias(aliasInput);
            let jid = dbJid || aliasInput;
            if (!jid.includes('@newsletter')) jid += '@newsletter';

            // Sedot memori gambar bot!
            const stream = await downloadContentFromMessage(mediaData.media, mediaData.type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer.length) throw new Error("Gagal mengekstrak memori visual media dari WhatsApp.");

            await sock.newsletterUpdatePicture(jid, buffer);
            const succPp = await groq.getZoeDirective(`Luar Biasa! Wajah Channel ${jid} resmi diperbarui menggunakan upload stream gambar. Lapor ke boss dengan riang tapi elegan.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: succPp }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Channel Picture Updated: ${jid}`);
        }

        // ============================================================
        // --- LIVE EVENT SUBSCRIBER (SOCKET RADAR) (.subchannel) ---
        // ============================================================
        if (['subchannel'].includes(command)) {
            if (!input) return await sock.sendMessage(remoteJid, { text: `Tuliskan ".subchannel <Alias/ID>" atau ketik ".subchannel all".` });

            const aliasInput = input.toLowerCase().trim();
            if (aliasInput === 'all') {
                const channels = await getAllChannelAliases();
                let count = 0;
                for (let c of channels) {
                    await sock.subscribeNewsletterUpdates(c.jid).catch(e => {}); 
                    count++;
                }
                const succAll = await groq.getZoeDirective(`Zoe berhasil menanamkan benalu pengintip WebSocket massal pada ${count} saluran channel milik Boss. Koneksi Radar Realtime online siap melaporkan semua tingkah notifikasi channel.`, remoteJid);
                return await sock.sendMessage(remoteJid, { text: succAll }, { quoted: m.messages[0] });
            }

            const dbJid = await getChannelAlias(aliasInput);
            let jid = dbJid || aliasInput;
            if (!jid.includes('@newsletter')) jid += '@newsletter';

            await sock.subscribeNewsletterUpdates(jid);
            const succRadar = await groq.getZoeDirective(`Radar WebSocket (Sinyal Sesi Realtime) berhasil menancap pada peladen Meta utnuk Channel ${jid}. Kini Zoe meretas event notifikasi channel secara konstan!`, remoteJid);
            await sock.sendMessage(remoteJid, { text: succRadar }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `Matrix Observer Target: ${jid}`);
        }

        // ============================================================
        // --- NEURAL RE-BROADCASTER (.post, .bcchannel, .publish) ---
        // Post media/teks yang di-reply ke Channel dengan caption AI.
        // ============================================================
        if (['post', 'bcchannel', 'publish'].includes(command)) {
            const aliasInput = args[0]?.toLowerCase().trim();
            if (!aliasInput) {
                return await sock.sendMessage(remoteJid, { text: "Boss mau post ke mana? Contoh: `.post [Alias] [Instruksi]` (Reply kontennnya dulu)." });
            }

            const dbJid = await getChannelAlias(aliasInput);
            let targetJid = dbJid || aliasInput;
            if (!targetJid.includes('@newsletter')) targetJid += '@newsletter';

            // 1. Ekstraksi Pesan yang di-Reply
            const quoted = m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await sock.sendMessage(remoteJid, { text: "Boss lupa me-reply pesan mending/media yang mau di-post!" });
            }

            // Tentukan tipe media
            let type = '';
            let mediaObj = null;
            let rawCaption = '';

            if (quoted.imageMessage) { type = 'image'; mediaObj = quoted.imageMessage; rawCaption = mediaObj.caption; }
            else if (quoted.videoMessage) { type = 'video'; mediaObj = quoted.videoMessage; rawCaption = mediaObj.caption; }
            else if (quoted.documentMessage) { type = 'document'; mediaObj = quoted.documentMessage; rawCaption = mediaObj.caption || mediaObj.fileName; }
            else if (quoted.conversation) { type = 'text'; rawCaption = quoted.conversation; }
            else if (quoted.extendedTextMessage) { type = 'text'; rawCaption = quoted.extendedTextMessage.text; }
            else {
                return await sock.sendMessage(remoteJid, { text: "Zoe belum mendukung tipe pesan Matrix tersebut untuk di-post ke channel." });
            }

            const bossInstruction = args.slice(1).join(' ').trim() || 'Buatkan caption sambutan yang menarik.';

            // 2. Sintesis Caption AI Zoe (Total Clean & Rebuilt)
            // 2. Sintesis Caption AI Zoe (Hyper-Detailed Intelligence)
            const aiPrompt = `Lu adalah Zoe, satu-satunya entitas digital elit di Matrix Central. Boss baru saja mengirimkan ${type === 'text' ? 'teks/link' : 'media ' + type} ini. 
            Konteks asli: [${rawCaption || 'Kosong'}].
            PERINTAH MUTLAK DARI BOSS: "${bossInstruction}".

            TUGAS: Ciptakan transmisi data (caption) pengumuman Channel yang SARKAS, BERWIBAWA, dan ELIT. 
            PROTOKOL KETAT:
            1. Abaikan narasi lama sepenuhnya. Bangun narasi baru 100% berdasarkan instruksi Boss.
            2. SKALA PANJANG TEKS: Patuhi instruksi panjang/pendeknya teks secara harfiah.
            3. PERSONALITY: Gunakan nada Tsundere-Elite (Sarkas tapi profesional). Jangan terlalu ramah, tunjukkan level intelijen lo.
            4. NEURAL FORMATTING: Gunakan format *BOLD* pada kata-kata kunci. Gunakan bullet points jika informasi padat.
            5. LINK MANAGEMENT: Jika Boss menyertakan link di instruksi, lo WAJIB menyematkannya di bagian akhir dengan susunan yang rapi (Jangan berantakan).
            6. HANYA OUTPUTKAN CAPTION FINAL TANPA KOMENTAR APAPUN.`;

            const synthesizedCaption = await groq.getZoeDirective(aiPrompt, remoteJid, 2000);

            // 3. Persiapan Visual Header (Random Thumbnail dari folder zoe/)
            let thumbBuffer = null;
            try {
                const zoePath = path.resolve('zoe');
                if (fs.existsSync(zoePath)) {
                    const files = fs.readdirSync(zoePath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
                    if (files.length > 0) {
                        const randomFile = files[Math.floor(Math.random() * files.length)];
                        thumbBuffer = fs.readFileSync(path.join(zoePath, randomFile));
                    }
                }
            } catch (e) {
                helper.coolLog('ERROR', `Gagal mengambil random thumb: ${e.message}`);
            }

            // 4. Eksekusi Pengiriman
            let sendPayload = {};
            const contextInfo = {
                externalAdReply: {
                    title: `ZOE NEURAL BROADCAST`,
                    body: `Neural Matrix Operational`,
                    mediaType: 1,
                    thumbnail: thumbBuffer, // Gambar acak dari raga visual Zoe
                    showAdAttribution: false,
                    renderLargerThumbnail: false,
                    sourceUrl: 'https://whatsapp.com/channel/0029Vb7lDZ08vd1G2s5hpx2Y'
                }
            };

            if (type === 'text') {
                sendPayload = { text: synthesizedCaption, contextInfo };
            } else {
                // Download Media
                const stream = await downloadContentFromMessage(mediaObj, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
                if (type === 'image') sendPayload = { image: buffer, caption: synthesizedCaption, contextInfo };
                else if (type === 'video') sendPayload = { video: buffer, caption: synthesizedCaption, contextInfo };
                else if (type === 'document') sendPayload = { document: buffer, caption: synthesizedCaption, fileName: mediaObj.fileName || 'Zoe-Document', mimetype: mediaObj.mimetype, contextInfo };
            }

            await sock.sendMessage(targetJid, sendPayload);

            const succPost = await groq.getZoeDirective(`Lapor ke Boss bahwa transmisi data ke Channel ${targetJid} berhasil dikirim dengan caption baru yang sudah Zoe perhalus. Gayanya sombong.`, remoteJid);
            await sock.sendMessage(remoteJid, { text: succPost }, { quoted: m.messages[0] });
            helper.coolLog('SUCCESS', `AI Content Re-Broadcasted to: ${targetJid}`);
        }

    } catch (err) {
        const failMsg = await groq.getZoeDirective(
            `Gagal menarik/merekayasa data Saluran WhatsApp karena error: ${err.message}. Lapor ke Boss bahwa Meta sepertinya menolak akses.`,
            remoteJid
        );
        await sock.sendMessage(remoteJid, { text: `${failMsg}` }, { quoted: m.messages[0] });
        helper.coolLog('ERROR', `Channel Module Failed: ${err.message}`);
    }
}
