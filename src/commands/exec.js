import { exec } from 'child_process';
import util from 'util';

/**
 * COMMAND: Neural Override (Executive Exec)
 * -----------------------------------------
 * Memberikan akses tingkat rendah (JS/Shell) langsung dari chat.
 * KHUSUS OWNER. NO EXCEPTION.
 */

export const name = 'exec';
export const aliases = ['eval'];
export const hiddenAliases = ['>', '$'];
export const description = 'Neural Override Console (Boss Only)';
export const category = 'Owner';
export const isOwnerOnly = true;

export default async function run(sock, m, { command, args, helper, isOwner, groq }) {
    // 1. Otoritas Mutlak
    if (!isOwner) {
        const rejection = await groq.getZoeDirective('User nyoba akses konsol dilarang ($ atau >). Kasih tau mereka dengan gaya Zoe yang dingin & berbahaya.', helper.getSender(m));
        return await sock.sendMessage(helper.getSender(m), { text: rejection });
    }

    const remoteJid = helper.getSender(m);
    const text = args.join(' ');

    if (!text) return await sock.sendMessage(remoteJid, { text: '⚠️ Masukkan kodenya boss.' });

    // --- JS EVAL OVERRIDE (>) ---
    if (command === '>' || command === 'eval') {
        try {
            let evaled = eval(text);
            if (typeof evaled !== 'string') evaled = util.format(evaled);
            await sock.sendMessage(remoteJid, { text: evaled });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ *JS Error*:\n${util.format(err)}` });
        }
    }

    // --- SHELL EXEC OVERRIDE ($) ---
    else if (command === '$' || command === 'exec') {
        exec(text, async (error, stdout, stderr) => {
            if (error) {
                return await sock.sendMessage(remoteJid, { text: `❌ *Shell Error*:\n${error.message}` });
            }
            if (stderr) {
                return await sock.sendMessage(remoteJid, { text: `⚠️ *Stderr*:\n${stderr}` });
            }
            await sock.sendMessage(remoteJid, { text: stdout || '✅ Command executed (no output).' });
        });
    }
}
