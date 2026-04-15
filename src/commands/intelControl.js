
/**
 * COMMAND: Project Neural Intel
 * ----------------------------
 * Pemanfaatan fungsi level rendah Baileys USync untuk mendeteksi 
 * jumlah perangkat aktif pada suatu nomor WhatsApp.
 * Akses: Owner Only
 */

export const name = 'cekperangkat';
export const aliases = [];
export const hiddenAliases = ['device', 'cekdevice', 'intel'];
export const description = 'Intelijen Perangkat: Mendeteksi jumlah perangkat aktif target via USync.';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { args, helper, isOwner, groq }) {
    const remoteJid = helper.getSender(m);

    // 1. Lockdown Otoritas
    if (!isOwner) {
        const denyMsg = await groq.getZoeDirective("User biasa mencoba mengakses radar perangkat. Usir dia.", remoteJid);
        return await sock.sendMessage(remoteJid, { text: denyMsg }, { quoted: m.messages[0] });
    }

    // ==========================================
    // LOGIKA: DETEKSI PERANGKAT (.cekperangkat)
    // ==========================================
    let target = '';
    const context = m.messages[0]?.message?.extendedTextMessage?.contextInfo;
    
    // Opsi 1: Menarik ID dari pesan yang Boss Balas (Reply)
    if (context && context.participant) {
        target = context.participant;
    }

    // Opsi 2: Boss menggunakan tag lambang @
    const mentioned = context?.mentionedJid || [];
    if (!target && mentioned.length > 0) {
        target = mentioned[0]; 
    }

    // Opsi 3: Jika Boss mengetik angka murni dari args
    if (!target) {
        let rawNum = args[0]?.replace(/[^0-9]/g, '');
        if (rawNum && rawNum.length > 6) {
            target = rawNum + '@s.whatsapp.net';
        }
    }

    if (!target) {
        const h = await groq.getZoeDirective("Beri instruksi ke Boss lewat gaya Zoe: berikan tag orangnya atau ketik nomornya untuk dipindai radarnya.", remoteJid);
        return await sock.sendMessage(remoteJid, { text: h }, { quoted: m.messages[0] });
    }

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);
        helper.coolLog('INTEL', `Scanning device map for: ${target}`);

        // Pemuatan Sinyal USync Devices (Level Rendah)
        const devices = await sock.getUSyncDevices([target], 'devices', true);
        
        // Logika Parsing Data
        const deviceList = devices || [];
        const count = deviceList.length;

        let intelligenceReport = `📊 *Neural Device Status Report*\n`;
        intelligenceReport += `----------------------------\n`;
        intelligenceReport += `📍 *Target:* @${target.split('@')[0]}\n`;
        intelligenceReport += `📱 *Total Active Devices:* ${count} Perangkat\n\n`;

        if (count > 0) {
            intelligenceReport += `🔍 *Analisis Matriks:*\n`;
            if (count === 1) {
                intelligenceReport += `- Target hanya menggunakan 1 perangkat utama (Smartphone Primary).\n`;
            } else {
                intelligenceReport += `- Target terdeteksi menggunakan ${count} sesi paralel.\n`;
                intelligenceReport += `- Kemungkinan besar login di WhatsApp Web / Desktop / Tablet.\n`;
            }
            intelligenceReport += `\n_Data ini diambil langsung dari sinyal USync Meta._`;
        } else {
            intelligenceReport += `❌ Gagal menarik sinyal perangkat. Nomor mungkin tidak aktif atau memblokir query USync.`;
        }

        // PERBAIKAN ENKRIPSI: Hanya tambahkan mentions jika itu tag/LID asli Meta agar mencegah glitch E2EE
        const mentions = (target.includes('@lid') || m.messages[0]?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(target)) ? [target] : [];

        await sock.sendMessage(remoteJid, { 
            text: intelligenceReport,
            mentions: mentions
        }, { quoted: m.messages[0] });

    } catch (err) {
        helper.coolLog('ERROR', `USync Query Failed: ${err.message}`);
        await sock.sendMessage(remoteJid, { text: `⚠️ *Neural Radar Crash*: ${err.message}` });
    }
}
