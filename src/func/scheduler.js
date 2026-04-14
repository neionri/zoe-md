import * as db from './db.js';
import * as groq from './groq.js';
import { coolLog } from './helper.js';

let schedulerInterval;

/**
 * Neural Scheduler Initialization
 * Sinkronisasi sirkuit waktu Zoe dengan basis data pengingat.
 * Mengecek setiap 60 detik untuk pengingat yang jatuh tempo.
 * 
 * @param {Object} sock - Koneksi WhatsApp Socket.
 */
export function initNeuralScheduler(sock) {
    if (schedulerInterval) return;

    coolLog('SYSTEM', 'Neural Scheduler synchronized with timeline.');

    schedulerInterval = setInterval(async () => {
        try {
            // Ambil pengingat yang sudah lewat/saat ini
            const dueReminders = await db.getDueReminders();
            
            if (dueReminders.length === 0) return;

            coolLog('SCHEDULER', `Syncing timeline: Dispatching ${dueReminders.length} neural alerts.`);

            for (const reminder of dueReminders) {
                try {
                    // Sintesis Pesan Pengingat via AI Zoe (Persona Sync)
                    const prompt = `TUGAS: Ingatkan user tentang jadwal ini: "${reminder.message}". 
                    Gunakan gaya bicara lu (ZOE) yang SARKAS, ELIT, dan MENYENTIL. 
                    JANGAN gunakan tanda kutip untuk isi jadwalnya, buatlah seolah lu lagi ngomong langsung (Misal: "Woi pelupa, buruan mandi dah jam 4 nih...").
                    MAKSIMAL 1-2 KALIMAT TAJAM. JANGAN CERAMAH.`;

                    const aiMsg = await groq.getZoeDirective(prompt, reminder.jid);
                    
                    // Kirim ke JID tujuan
                    await sock.sendMessage(reminder.jid, { text: aiMsg });
                    
                    // Hapus dari database setelah sukses dikirim
                    await db.deleteReminder(reminder._id);
                } catch (sendErr) {
                    console.error(`[Scheduler] Gagal kirim ke ${reminder.jid}:`, sendErr.message);
                }
            }
        } catch (error) {
            console.error('[Scheduler] Critical Error:', error.message);
        }
    }, 60000); // Interval 1 Menit
}
