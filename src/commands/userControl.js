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

export default async function run(sock, m, { command, args, helper, groq, isOwner }) {
    // 1. Otoritas Mutlak
    if (!isOwner) {
        const rejection = await groq.getZoeDirective('User nyoba ngatur kasta orang tanpa izin. Usir pake gaya Zoe yang sarkas, singkat, dan dingin.', helper.getSender(m));
        await sock.sendMessage(helper.getSender(m), { text: rejection });
        throw new Error('Unauthorized access');
    }

    const remoteJid = helper.getSender(m);
    
    // 2. Ekstraksi Target (Mention / Reply / JID / Raw ID)
    let target = helper.getQuotedSender(m) || args[0];
    if (m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    if (!target) {
        const targetError = await groq.getZoeDirective('Boss lupa nyebut siapa yang mau diatur kastanya. Sindir Boss dikit biar teliti.', remoteJid);
        await sock.sendMessage(remoteJid, { text: targetError });
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

        const successPrem = await groq.getZoeDirective(`Beritahu kalau @${targetNumber} resmi jadi PREMIUM selama ${days} hari. Pake gaya Zoe yang elit.`, remoteJid);
        return await sock.sendMessage(remoteJid, { 
            text: successPrem,
            mentions: [target]
        });
    }

    // 4. ADD VIP (.addvip)
    if (command === 'addvip') {
        const prevTier = (await memory.getUserConfig(target)).tier;
        await memory.updateUserConfig(target, { 
            tier: 'vip', 
            premiumUntil: null 
        });

        const successVip = await groq.getZoeDirective(`Beritahu kalau @${targetNumber} resmi diangkat jadi VIP ETERNAL. Pake gaya Zoe yang mewah & elit.`, remoteJid);
        return await sock.sendMessage(remoteJid, { 
            text: successVip,
            mentions: [target]
        });
    }

    // 5. DELETE KASTA (.delkasta)
    if (command === 'delkasta') {
        await memory.updateUserConfig(target, { 
            tier: 'free', 
            premiumUntil: null 
        });

        const successDel = await groq.getZoeDirective(`Beritahu kalau kasta @${targetNumber} sudah dicabut dan balik jadi rakyat jelata. Sindir pake gaya Zoe yang dingin.`, remoteJid);
        return await sock.sendMessage(remoteJid, { 
            text: successDel,
            mentions: [target]
        });
    }
}
