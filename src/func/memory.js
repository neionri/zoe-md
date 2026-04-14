/**
 * ZOE NEURAL MEMORY v2.0 (Hierarchy System)
 * -----------------------------------------
 * Sistem memori berjenjang (Tiered Memory) untuk efisiensi token.
 * SHORT-TERM: Percakapan terbaru yang utuh.
 * LONG-TERM: Ringkasan AI dari percakapan lama.
 * COGNITIVE FACTS: Fakta permanen tentang user.
 */

import { getGroupConfig, updateGroupConfig, checkGalleryHash, getUserConfig, updateUserConfig } from './db.js';
export { getGroupConfig, updateGroupConfig, checkGalleryHash, getUserConfig, updateUserConfig };
import { coolLog } from './helper.js';

// Konfigurasi ambang batas memori
const MAX_SHORT_TERM = 5;   // Jumlah pesan yang tetap utuh (Short-term)
const COMPRESS_AT    = 20;  // Batas pemicu kompresi (Summary)
const MAX_FACTS      = 6;   // Batas fakta unik per user

/**
 * Pengambil Riwayat (Neural Retrieval)
 * Mengambil data Memori Jangka Pendek, Jangka Panjang (Summary), dan Fakta.
 * 
 * @param {string} jid - ID WhatsApp unik pengirim.
 * @returns {Promise<Object>} Mengembalikan objek { messages, summary, facts }.
 */
export async function getHistory(jid) {
    try {
        const config = await getGroupConfig(jid);
        const count = config.history?.length || 0;
        coolLog('MEMORY', `Synced ${count} neural pathways for ${jid.split('@')[0]}`);
        return {
            messages : config.history  || [],
            summary  : config.summary  || '',
            facts    : config.facts    || []
        };
    } catch (e) {
        console.error('[Memory] Gagal baca history:', e);
        return { messages: [], summary: '', facts: [] };
    }
}

/**
 * Penambah Pesan (Neural Inscription)
 * Menyimpan pesan baru dan melakukan kompresi otomatis (Summary) 
 * jika ambang batas memori terlampaui.
 * 
 * @param {string} jid - ID pengirim.
 * @param {string} role - Peran ('user' atau 'assistant').
 * @param {string} content - Teks pesan.
 */
export async function addMessage(jid, role, content) {
    try {
        const config = await getGroupConfig(jid);
        let history = config.history || [];

        history.push({ role, content });

        // Trigger Logika Kompresi (Sinaptik)
        if (history.length > COMPRESS_AT) {
            const toCompress = history.slice(0, history.length - MAX_SHORT_TERM);
            history = history.slice(-MAX_SHORT_TERM);

            // Jalankan kompresi di Background agar respons bot tidak lag
            _compressInBackground(jid, config.summary || '', toCompress).catch(e =>
                console.error('[Memory] Background compress error:', e)
            );
        }

        await updateGroupConfig(jid, { history, lastActive: new Date() });
        coolLog('MEMORY', `State updated for ${jid.split('@')[0]}`);
    } catch (e) {
        console.error('[Memory] Gagal simpan pesan:', e);
    }
}

/**
 * Penambah Fakta (Cognitive Absorption)
 * Menyimpan fakta permanen tentang user agar Zoe 'mengenali' profil user.
 * 
 * @param {string} jid - ID pengirim.
 * @param {string} fact - Teks fakta baru.
 */
export async function addFact(jid, fact) {
    try {
        if (!fact || fact.trim().length < 5) return;
        const config = await getGroupConfig(jid);
        let facts = config.facts || [];

        // Deteksi Duplikasi (Cegah fakta yang sama tersimpan berulang)
        const isDuplicate = facts.some(f => f.toLowerCase().includes(fact.toLowerCase().slice(0, 10)));
        if (isDuplicate) return;

        facts.push(fact.trim());
        if (facts.length > MAX_FACTS) facts.shift(); // Buang fakta tertua jika penuh

        await updateGroupConfig(jid, { facts });
        coolLog('MEMORY', `Cognitive fact absorbed: "${fact}"`);
    } catch (e) {
        console.error('[Memory] Gagal simpan fakta:', e);
    }
}

/**
 * Penghapus History (Neural Pruning)
 * Hanya menghapus pesan terbaru, tapi tetap mengingat Summary dan Fakta.
 */
export async function clearHistory(jid) {
    try {
        await updateGroupConfig(jid, { history: [] });
        console.log(`[Memory] History percakapan dihapus untuk: ${jid}`);
    } catch (e) {
        console.error('[Memory] Gagal clear history:', e);
    }
}

/**
 * Reset Total (Full Wipe)
 * Membersihkan seluruh jejak memori user (History, Summary, dan Fakta).
 */
export async function clearAll(jid) {
    try {
        await updateGroupConfig(jid, { history: [], summary: '', facts: [] });
        console.log(`[Memory] Semua memori dihapus untuk: ${jid}`);
    } catch (e) {
        console.error('[Memory] Gagal clear all:', e);
    }
}

/**
 * INTERNAL: Kompresi Sinaptik (Analisa AI)
 * Mengubah kumpulan percakapan lama menjadi satu ringkasan padat melalui AI.
 */
async function _compressInBackground(jid, oldSummary, oldMessages) {
    try {
        // Impor Groq secara dinamis untuk menghindari Circular Dependency
        const { generateSummary } = await import('./groq.js');
        const newSummary = await generateSummary(oldSummary, oldMessages);
        if (newSummary) {
            await updateGroupConfig(jid, { summary: newSummary });
            coolLog('MEMORY', `Synaptic compression successful for ${jid.split('@')[0]}`);
        }
    } catch (e) {
        console.error('[Memory] Kompresi gagal (non-fatal):', e.message);
    }
}
