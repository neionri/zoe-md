/**
 * COMMAND: BOUNCER
 * -----------------
 * Mengelola fitur Satpam AI (Shadow Bouncer) di dalam grup.
 * Perintah ini hanya bisa digunakan oleh Admin grup atau Owner bot.
 * 100% Neural Response: Semua jawaban diproses lewat otak AI Zoe.
 */

export const name = 'bouncer';
export const description = 'Mengelola fitur Satpam AI (Shadow Bouncer)';
export const category = 'Admin';
export const aliases = ['satpam', 'guard'];
export const isOwnerOnly = false;

export default async function run(sock, m, { args, helper, memory, groq, isOwner, isGroup }) {
    const remoteJid = helper.getSender(m);

    // 1. Validasi: Harus di dalam grup
    if (!isGroup) {
        const res = await groq.getZoeDirective('Beri tahu user bahwa fitur bouncer cuma buat grup. Bilang dengan nada meremehkan.', remoteJid);
        await sock.sendMessage(remoteJid, { text: res });
        throw new Error('Command can only be used in groups');
    }

    // 2. Validasi: Harus Admin atau Owner
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const isAdmin = groupMetadata.participants.find(p => p.id === m.messages[0].key.participant && (p.admin === 'admin' || p.admin === 'superadmin'));
    
    if (!isAdmin && !isOwner) {
        const res = await groq.getZoeDirective('Ada user biasa sok asik mau nyuruh bouncer padahal dia bukan admin. Bacoti dia dengan sangat sarkas.', remoteJid);
        await sock.sendMessage(remoteJid, { text: res });
        throw new Error('Permission denied: requires admin');
    }

    const subCommand = args[0]?.toLowerCase();

    // 3. Logika Sub-Command
    if (subCommand === 'on') {
        await memory.updateGroupConfig(remoteJid, { bouncerMode: true });
        const res = await groq.synthesizeCommandResult('bouncer', 'Feature ACTIVATED', remoteJid, 'Beritahu grup bahwa bouncer sekarang aktif memantau link berbahaya. Nada: Sultan & Waspada.');
        return sock.sendMessage(remoteJid, { text: res });
    } 
    
    else if (subCommand === 'off') {
        await memory.updateGroupConfig(remoteJid, { bouncerMode: false });
        const res = await groq.synthesizeCommandResult('bouncer', 'Feature DEACTIVATED', remoteJid, 'Beritahu grup bahwa bouncer sekarang istirahat. Nada: Santai tapi jutek.');
        return sock.sendMessage(remoteJid, { text: res });
    } 
    
    else {
        // Tampilkan Status & Panduan secara Neural
        const config = await memory.getGroupConfig(remoteJid);
        const status = config.bouncerMode ? 'AKTIF 🛡️' : 'NON-AKTIF 💤';
        
        const directive = `Jelaskan status Satpam AI (Bouncer) saat ini: [${status}]. 
        Lalu jelaskan cara pakainya:
        - .bouncer on (buat aktifin)
        - .bouncer off (buat matiin)
        Sampaikan dengan gaya Sultan yang asik tapi to the point.`;
        
        const res = await groq.getZoeDirective(directive, remoteJid);
        return sock.sendMessage(remoteJid, { text: res });
    }
}
