import * as memory from '../func/memory.js';

/**
 * COMMAND: User Tiering Control (Owner Only)
 * ----------------------------------------
 * Memberikan otoritas kepada Owner untuk mengatur kasta user.
 * Fitur: .addprem, .addvip, .delkasta
 */

export const name = 'addprem';
export const aliases = ['addvip', 'delkasta', 'addprime'];
export const description = 'Neural Tiering Control (Boss Only).';
export const category = 'Owner';

export default async function run(sock, m, { command, args, helper, isOwner }) {
    // 1. Otoritas Mutlak
    if (!isOwner) {
        await sock.sendMessage(helper.getSender(m), { text: `🙄 *Zoe Sarcasm*: Lu pikir lu siapa mau ngatur kasta orang? Cuma Boss gue yang bisa.` });
        throw new Error('Unauthorized access');
    }

    const remoteJid = helper.getSender(m);
    
    // 2. Ekstraksi Target (Mention / Reply / JID / Raw ID)
    let target = helper.getQuotedSender(m) || args[0];
    if (m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    if (!target) {
        await sock.sendMessage(remoteJid, { text: `Tag orangnya atau tempel ID-nya boss. Contoh: .addprem 1400xxx atau .addprem @user 30` });
        throw new Error('No target provided');
    }

    // Auto-Fix: Jika input ID mentah (tanpa @), asumsikan @lid sebagai default v3.2.2
    if (!target.includes('@')) {
        target = target.trim() + '@lid';
    }

    const targetNumber = target.split('@')[0];

    // --- LOGIC BRANCHING ---

    // 3. ADD PREMIUM (.addprem)
    if (command === 'addprem') {
        const days = parseInt(args[args.length - 1]) || 30;
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() + days);

        await memory.updateUserConfig(target, { 
            tier: 'premium', 
            premiumUntil: expiredDate 
        });

        return await sock.sendMessage(remoteJid, { 
            text: `✅ *Neural Upgrade*: @${targetNumber} resmi diangkat jadi **PREMIUM** untuk ${days} hari.`,
            mentions: [target]
        });
    }

    // 4. ADD VIP (.addvip)
    if (command === 'addvip') {
        await memory.updateUserConfig(target, { 
            tier: 'vip', 
            premiumUntil: null 
        });

        return await sock.sendMessage(remoteJid, { 
            text: `💎 *Eternal VIP*: @${targetNumber} sekarang adalah **LEGENDARY VIP** (Tanpa Batas).`,
            mentions: [target]
        });
    }

    // 5. DELETE KASTA (.delkasta)
    if (command === 'delkasta') {
        await memory.updateUserConfig(target, { 
            tier: 'free', 
            premiumUntil: null 
        });

        return await sock.sendMessage(remoteJid, { 
            text: `📉 *Neural Downgrade*: Kasta @${targetNumber} dicabut habiss. Balik jadi rakyat jelata!`,
            mentions: [target]
        });
    }
}
