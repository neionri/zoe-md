import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

/**
 * COMMAND: Ghost Protocol (Troll & Manipulate)
 * -----------------------------------------
 * Mengeksploitasi fungsi Protobuf 'contextInfo' di dalam relayMessage
 * untuk memalsukan pesan kutipan (Quote) milik orang lain yang aslinya tidak pernah diketik.
 * Akses: Owner Only (Berbahaya jika diakses publik)
 */

export const name = 'fitnah';
export const aliases = [];
export const hiddenAliases = ['fakequote', 'troll', 'pesanhantu'];
export const description = 'Ghost Protocol: Manipulasi Kutipan Obrolan Pesan.';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas
    if (!isOwner) {
        const denyMsg = await groq.getZoeDirective("User biasa sok-sokan makai perintah Ghost Protocol (Pemalsu Chat). Tertawakan dia.", remoteJid);
        return await sock.sendMessage(remoteJid, { text: denyMsg }, { quoted: m.messages[0] });
    }

    const input = args.join(' ').trim();
    if (!input || !input.includes('|')) {
         const hintErr = await groq.getZoeDirective('Sindir Boss karena salah memasukkan format pemalsu chat. Ajarin dia formatnya: `.fitnah @tag/nomor | Tulisan Palsu Dia | Balasan Zoe` memakai pemisah garis vertikal.', remoteJid);
         return await sock.sendMessage(remoteJid, { text: hintErr }, { quoted: m.messages[0] });
    }

    const parts = input.split('|').map(s => s.trim());
    if (parts.length < 3) {
        return await sock.sendMessage(remoteJid, { text: "⚠️ Pemisah garis tegak ( | ) kurang. Syarat murni Ghost Protocol: `Tag Target | Teks Tiruan Target | Teks Respons Bot`" });
    }

    // 2. Mengekstrak Target Rekayasa (Mode Sakti)
    let targetJid = '';
    
    // Opsi 1: Menarik ID dari pesan yang Boss Balas (Reply)
    // Sekarang diizinkan mereply pesan Bot itu sendiri untuk testing!
    const context = m.messages[0]?.message?.extendedTextMessage?.contextInfo;
    if (context && context.participant) {
        targetJid = context.participant;
    }

    // Opsi 2: Boss menggunakan tag lambang @ (Pembuktian LID)
    const mentioned = context?.mentionedJid || [];
    if (!targetJid && mentioned.length > 0) {
        targetJid = mentioned[0]; // Biarkan Meta meresolusi tag LID/Nomor hantu-nya mentah-mentah!
    }

    // Opsi 3: Jika Boss tidak mereply maupun tag, kita ekstrak angka murni dari part 1
    if (!targetJid) {
        let rawNum = parts[0].replace(/[^0-9]/g, '');
        if (rawNum.length > 6 && !parts[0].includes('@')) {
            targetJid = rawNum + '@s.whatsapp.net';
        }
    }

    if (!targetJid || targetJid === '@s.whatsapp.net') {
        const w1 = await groq.getZoeDirective("Target tidak ditemukan. Suruh Boss REPLY / Balas pesan target, atau lakukan TAG manual di parameter awal.", remoteJid);
        return await sock.sendMessage(remoteJid, { text: w1 }, { quoted: m.messages[0] });
    }
    const fakeQuoteText = parts[1];
    const realReplyText = parts[2];

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        // 3. Merangkai Jaringan Biner Ilusi
        let injeksiBiner = {
            extendedTextMessage: {
                text: realReplyText,
                contextInfo: {
                    // Menyematkan Jendela Kutipan Ilusi (Fake Quote Box)
                    quotedMessage: {
                        conversation: fakeQuoteText
                    },
                    participant: targetJid, // Seolah-olah Target yang mengirimkannya
                    // StanzaId harus random berformat standar WA Meta
                    stanzaId: "BBA3" + Date.now().toString().substring(2, 10).toUpperCase() 
                }
            }
        };

        const prepMsg = generateWAMessageFromContent(remoteJid, injeksiBiner, { userJid: sock.user.id });
        
        // 4. Lontarkan Kapsul Tanpa Sensor API Lewat Mesin Relay
        await sock.relayMessage(remoteJid, prepMsg.message, { messageId: prepMsg.key.id });
        
        helper.coolLog('SUCCESS', `Ghost Protocol Deployed for Target: ${targetJid}`);

    } catch (err) {
        helper.coolLog('ERROR', `Ghost Protocol Crash: ${err.message}`);
        const c1 = await groq.getZoeDirective(`Sistem eksperimen biner gagal diproses server: ${err.message}. Laporkan error tersebut dengan elegan.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: c1 });
    }
}
