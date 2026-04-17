import { synthesizeCommandResult } from '../func/groq.js';

export const name = 'ping';
export const aliases = [];
export const hiddenAliases = ['p'];
export const description = 'Cek latensi saraf Zoe';
export const category = 'Misc';

export default async (sock, m, { args, helper }) => {
    const start = Date.now();
    const remoteJid = helper.getSender(m);
    
    // Kirim placeholder dulu biar dapet feeling "real-time"
    const { key } = await sock.sendMessage(remoteJid, { text: '🔄 *Menghitung latensi saraf...*' }, { quoted: m.messages[0] });
    
    const latency = Date.now() - start;
    const rawData = `Latency: ${latency}ms | Server: Node.js ${process.version} | OS: ${process.platform}`;

    // Gunakan AI untuk ngomong "Premium"
    const response = await synthesizeCommandResult('ping', rawData, remoteJid);
    // Update pesan tadi
    await sock.sendMessage(remoteJid, { text: response, edit: key });

};
