// Neural Downloader dependency will be loaded dynamically to avoid caching issues

export const name = 'dl';
export const aliases = ['ytdl', 'igdl', 'ttdl'];
export const hiddenAliases = ['download'];
export const description = 'Universal Neural Media Downloader';
export const category = 'Neural Specialist';

export default async (sock, m, { args, helper, groq }) => {
    const remoteJid = helper.getSender(m);

    if (args.length === 0) {
        const errorRes = await groq.getZoeDirective('User mau download tapi pelit amat nggak bagi link. Sindir dia biar pinteran dikit.', remoteJid);
        await sock.sendMessage(remoteJid, { text: errorRes }, { quoted: m.messages[0] });
        throw new Error('User did not provide a URL');
    }

    const timestamp = Date.now();
    const { detectPlatform, createSession } = await import(`../func/downloader.js?t=${timestamp}`);

    const url = args[0];
    const platform = detectPlatform(url);

    if (!platform) {
        const invalidRes = await groq.getZoeDirective(`User ngasih link yang Zoe nggak kenal: ${url}. Kasih tau link yang Zoe dukung cuma YouTube, TikTok, sama Instagram.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: invalidRes }, { quoted: m.messages[0] });
        throw new Error(`Unsupported platform for URL: ${url}`);
    }

    helper.coolLog('NETWORK', `Synapse Linked to ${platform}: ${url}`);

    helper.coolLog('NETWORK', `Synapse Linked to ${platform}: ${url}`);

    // Fetch Metadata (Hanya Judul untuk penamaan file)
    await sock.sendPresenceUpdate('composing', remoteJid);

    // Inisialisasi Sesi
    createSession(remoteJid, url, platform);

    // Minta Zoe buat bikin menu pilihan sendiri
    const menuPrompt = `Zoe sudah dapet link ${platform}: ${url}. \n` +
                       `Berikan menu pilihan ke user (pake gaya lo yang sarkas & singkat): \n` +
                       `1. Video (.mp4)\n` +
                       `2. Audio (.mp3)\n` +
                       `3. Dokumen (File)\n` +
                       `4. Batal\n` +
                       `Ingatkan user buat balas pake angka pilihannya.`;

    const menu = await groq.getZoeDirective(menuPrompt, remoteJid);

    await sock.sendMessage(remoteJid, { text: menu }, { quoted: m.messages[0] });
};
