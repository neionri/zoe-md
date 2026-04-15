import * as db from '../func/db.js';

/**
 * COMMAND: Group Moderation Center
 * -------------------------------
 * Memberikan otoritas kepada admin untuk mengontrol fungsionalitas bot.
 * Fitur: .bcmd (Ban Command), .ubcmd (Unban), .listbcmd
 */

export const name = 'bcmd';
export const aliases = ['ubcmd', 'listbcmd'];
export const description = 'Neural Command Moderation (Admin Only).';
export const category = 'Group Control';

export default async function run(sock, m, { command, args, helper, isOwner, isGroup }) {
    const remoteJid = helper.getSender(m);
    const participantJid = helper.getParticipant(m);
    
    let targetJid = remoteJid;
    let authName = "Admin";

    // 1. OTORISASI & IDENTIFIKASI KONTEKS
    if (!isGroup) {
        // Konteks Private: Hanya Owner yang bisa kontrol (GLOBAL BAN)
        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: `🙄 *Zoe Sarcasm*: Lu mimpi apa semalem nyoba ngatur-ngatur gue di private? Balik sana ke emak lu.` });
            throw new Error('Unauthorized access');
        }
        targetJid = 'GLOBAL'; // Masuk ke database internasioal
        authName = "Owner (Global)";
    } else {
        // Konteks Grup: Admin atau Owner bisa kontrol (LOCAL BAN)
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        const isAdmin = admins.includes(participantJid);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: `🛡️ *Zoe Access Denied*: Fitur ini cuma buat para kasta tinggi (Admin), bukan buat rakyat jelata kayak lu.` });
            throw new Error('Permission denied: requires admin');
        }
    }

    // Pastikan database sinkron
    const config = await db.getGroupConfig(targetJid);
    const bannedCommands = config.bannedCommands || [];

    // --- LOGIC BRANCHING BERDASARKAN COMMAND ---

    // 2. BAN COMMAND (.bcmd)
    if (command === 'bcmd') {
        const cmdToBan = args[0]?.toLowerCase()?.trim()?.replace(/^\./, '');
        if (!cmdToBan) {
            await sock.sendMessage(remoteJid, { text: `Tentukan perintahnya boss. Contoh: .bcmd sticker` });
            throw new Error('No command provided to ban');
        }

        if (bannedCommands.includes(cmdToBan)) {
            await sock.sendMessage(remoteJid, { text: `Perintah .${cmdToBan} udah masuk daftar cekal ${authName.toLowerCase()}, pikun ya?` });
            throw new Error('Command is already banned');
        }

        // Gunakan pendekatan immutable (Buat array baru) untuk memastikan database mendeteksi perubahan
        const newBanned = [...bannedCommands, cmdToBan];
        await db.updateGroupConfig(targetJid, { bannedCommands: newBanned });
        
        const scope = isGroup ? "grup ini" : "seluruh Matrix (GLOBAL)";
        return await sock.sendMessage(remoteJid, { text: `✅ *Neural Lockdown*: Perintah .${cmdToBan} resmi dilarang di ${scope}. Otoritas: ${authName}.` });
    }

    // 3. UNBAN COMMAND (.ubcmd)
    if (command === 'ubcmd') {
        const cmdToUnban = args[0]?.toLowerCase()?.trim()?.replace(/^\./, '');
        if (!cmdToUnban) {
            await sock.sendMessage(remoteJid, { text: `Mana perintah yang mau dibebasin? Contoh: .ubcmd sticker` });
            throw new Error('No command provided to unban');
        }

        if (!bannedCommands.includes(cmdToUnban)) {
            await sock.sendMessage(remoteJid, { text: `Perintah .${cmdToUnban} emang nggak dilarang di ${isGroup ? 'grup ini' : 'Global'}, lu mabok oli?` });
            throw new Error('Command is not banned');
        }

        // Hapus dari array dengan filter
        const newBanned = bannedCommands.filter(c => c !== cmdToUnban);
        await db.updateGroupConfig(targetJid, { bannedCommands: newBanned });
        
        const scope = isGroup ? "grup ini" : "seluruh Matrix (GLOBAL)";
        return await sock.sendMessage(remoteJid, { text: `🔓 *Lockdown Lifted*: Sip, perintah .${cmdToUnban} dibuka lagi untuk ${scope}.` });
    }

    // 4. LIST BANNED COMMANDS (.listbcmd)
    if (command === 'listbcmd') {
        const scopeTitle = isGroup ? "Grup Ini" : "Seluruh Matrix (GLOBAL)";
        const emptyMsg = isGroup ? "Grup ini masih \"suci\", nggak ada perintah yang dilarang lokal." : "Belum ada perintah yang dilarang secara internasional (Global).";

        if (bannedCommands.length === 0) {
            return await sock.sendMessage(remoteJid, { text: `🛡️ *Zoe Clean State*: ${emptyMsg}` });
        }

        const listText = bannedCommands.map(c => `• .${c}`).join('\n');
        return await sock.sendMessage(remoteJid, { text: `🚫 *Daftar Cekal ${scopeTitle}*:\n\n${listText}` });
    }
}
