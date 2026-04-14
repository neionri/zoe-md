/**
 * COMMAND: Manual Subscription Info
 * -------------------------------
 * Memberikan informasi harga dan cara upgrade kasta secara manual.
 */

export const name = 'langganan';
export const aliases = ['premium', 'vip', 'beli', 'buy', 'payment'];
export const description = 'Neural Kasta Upgrade Information.';
export const category = 'Utility';

export default async function run(sock, m, { helper, groq }) {
    const remoteJid = helper.getSender(m);
    const participantJid = helper.getParticipant(m);
    const isGroup = remoteJid.endsWith('@g.us');
    
    const ownerName = process.env.OWNER_NAME || 'Neionri';
    const ownerNumber = process.env.OWNER_NUMBER || '6285606926619';
    const myId = participantJid;

    const message = `
*UPGRADE KASTA MATRIX* 🧬💎
──────────────
Zoe denger lu lagi butuh "Evolusi" di Matrix? Ini jatah yang bisa lu ambil:

🥈 *PREMIUM (30 Hari)* - *Rp 10.000*
• Prioritas Respon: Tinggi (No Delay)
• Downloader: 200 MB / Hari
• Sticker: 50 Foto / 25 Video Harian

🥇 *VIP (Eternal)* - *Rp 25.000*
• Prioritas Respon: ULTRA FAST (Lampu Hijau)
• Downloader: UNLIMITED (Power)
• Sticker: UNLIMITED

──────────────
🆔 *ID LU*: \`${myId}\`
(Salin ID di atas dan kirim ke Owner bareng bukti bayar)

──────────────
💳 *Pembayaran Manual*:
Hubungi Owner Matrix untuk konfirmasi & aktivasi kasta:
wa.me/${ownerNumber} (${ownerName})
    `.trim();

    if (isGroup) {
        // Kirim ke PC User
        await sock.sendMessage(participantJid, { text: message });
        
        // --- NEURAL REDIRECT MESSAGE (v3.2.3) ---
        const res = await groq.getZoeDirective(`Beri tahu user kalau detail paket langganan/evolusi kasta sudah Zoe kirim lewat (jalur pribadi). Gunakan gaya sarkas Zoe.`, remoteJid);
        
        // Kasih tahu di Grup (Reply)
        return await sock.sendMessage(remoteJid, { 
            text: `${res}` 
        }, { quoted: m.messages[0] });
    }

    // Jika di PC, kirim seperti biasa
    return await sock.sendMessage(remoteJid, { 
        text: message
    });
}
