// Neural Downloader dependency will be loaded dynamically to avoid caching issues

export const name = 'dl';
export const aliases = ['download', 'ytdl', 'igdl', 'ttdl'];
export const description = 'Universal Neural Media Downloader';
export const category = 'Neural Specialist';

export default async (sock, m, { args, helper, groq }) => {
    const remoteJid = helper.getSender(m);

    if (args.length === 0) {
        const errorRes = await groq.getZoeDirective('User mau download tapi pelit amat nggak bagi link. Sindir dia biar pinteran dikit.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: errorRes }, { quoted: m.messages[0] });
    }

    const timestamp = Date.now();
    const { detectPlatform, createSession } = await import(`../func/downloader.js?t=${timestamp}`);

    const url = args[0];
    const platform = detectPlatform(url);

    if (!platform) {
        const invalidRes = await groq.getZoeDirective(`User ngasih link yang Zoe nggak kenal: ${url}. Kasih tau link yang Zoe dukung cuma YouTube, TikTok, sama Instagram.`, remoteJid);
        return await sock.sendMessage(remoteJid, { text: invalidRes }, { quoted: m.messages[0] });
    }

    helper.coolLog('NETWORK', `Synapse Linked to ${platform}: ${url}`);

    // Inisialisasi Sesi
    createSession(remoteJid, url, platform);

    // Minta Zoe buat bikin menu pilihan sendiri
    const menuPrompt = `Zoe sudah dapet link ${platform}: ${url}. \n` +
                       `Berikan menu pilihan ke user (pake gaya lo yang elit & singkat): \n` +
                       `1. Video (.mp4)\n` +
                       `2. Audio (.mp3)\n` +
                       `3. Dokumen (File)\n` +
                       `4. Batal\n` +
                       `Ingatkan user buat balas pake angka pilihannya.`;

    const menu = await groq.getZoeDirective(menuPrompt, remoteJid);

    await sock.sendMessage(remoteJid, { 
        text: menu,
        contextInfo: {
            externalAdReply: {
                title: `[ Neural Intake: ${platform} ]`,
                body: 'Waiting for format selection...',
                mediaType: 1, 
                thumbnailUrl: 'https://img.icons8.com/clouds/200/download-from-cloud.png',
                sourceUrl: url,
                showAdAttribution: true
            }
        }
    }, { quoted: m.messages[0] });
};
