import * as db from '../func/db.js';
import * as groq from '../func/groq.js';

/**
 * COMMAND: .remindme
 * SPECIALIST: Chronos-v1 (Temporal Decoder)
 * -----------------------------------------
 * Menyetel pengingat menggunakan bahasa natural. Zoe akan memproses waktu
 * dan menyimpan pesan ke dalam database permanen.
 */

export const name = 'remindme';
export const aliases = ['remind', 'ingetin'];
export const description = 'Menyetel pengingat neural (Mendukung bahasa natural).';
export const category = 'Neural Logic';

export default async function run(sock, m, { args, helper }) {
    const remoteJid = helper.getSender(m);
    
    // 1. Validasi Input Dasar
    if (args.length < 1) {
        const jutekMsg = await groq.getZoeDirective('Beritahu user kalau dia harus kasih tau apa yang mau diingetin dan kapan. Contoh: .remindme 1 jam lagi angkat jemuran. SINGKAT & JUTEK.', remoteJid);
        await sock.sendMessage(remoteJid, { text: jutekMsg }, { quoted: m.messages[0] });
        throw new Error('User did not provide remindme arguments');
    }

    const userInput = args.join(' ');
    helper.coolLog('CHRONOS', `Decoding temporal intent: "${userInput}"`);

    // 2. Decode Waktu via AI (Chronos-v1 Specialist)
    // Menghasilkan JSON: { success, timestamp, message }
    const result = await groq.parseReminderIntent(userInput);

    if (!result.success) {
        const errorMsg = await groq.getZoeDirective(`Kasih tau user kalau lu gagal ngerti waktunya. Alasan: ${result.error || 'Pola waktu aneh'}. Gaya lu yang paling nyebelin.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: errorMsg }, { quoted: m.messages[0] });
        throw new Error(`Failed to parse temporal intent: ${result.error || 'Unknown pattern'}`);
    }

    // 3. Simpan ke Database (Persistence)
    try {
        await db.saveReminder(remoteJid, m.messages[0].pushName, result.message, result.timestamp);
        
        // 4. Konfirmasi via AI Zoe (Persona Sync)
        const targetDate = new Date(result.timestamp).toLocaleString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const confirmPrompt = `TUGAS: Lu baru aja nyatet jadwal buat user. 
        PESAN DARI USER: "${result.message}". 
        WAKTU TARGET: ${targetDate}.
        Konfirmasi ke user kalau jadwalnya udah lu simpan di memori permanen lu.
        Pake gaya bicara lu (ZOE) yang paling ELIT, SOMBONG, tapi tetep profesional.
        Sindir dia dikit karena pelupa sampe harus minta bantuan mesin kayak lu.
        JANGAN gunakan tanda kutip untuk menyebut pesannya, buatlah mengalir dalam kalimat lu (Misal: "Sip, ntar gue ingetin lu buat mandi jam 4...").
        MAKSIMAL 1-2 KALIMAT. JANGAN CERAMAH.`;

        const confirmText = await groq.getZoeDirective(confirmPrompt, remoteJid);
        
        await sock.sendMessage(remoteJid, { text: confirmText }, { quoted: m.messages[0] });
        helper.coolLog('SUCCESS', `Reminder synched to database for ${targetDate}`);

    } catch (error) {
        console.error('[Reminder] Database Error:', error.message);
        await sock.sendMessage(remoteJid, { text: "[Neural Error]: Saraf memori jangka panjang sedang tersumbat." });
    }
}
