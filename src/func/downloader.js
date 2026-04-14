import fs from 'fs';
import path from 'path';

// Store sessions globally to survive hot-reloads
if (!global.dlSessions) {
    global.dlSessions = new Map();
}

const tempDir = './scratch/download';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

export const platforms = {
    YOUTUBE: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    TIKTOK: /^(https?:\/\/)?(www\.|vm\.|vt\.)?tiktok\.com\/.+$/,
    INSTAGRAM: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reels|reel)\/.+$/
};

/**
 * Deteksi platform berdasarkan URL
 */
export function detectPlatform(url) {
    if (platforms.YOUTUBE.test(url)) return 'YOUTUBE';
    if (platforms.TIKTOK.test(url)) return 'TIKTOK';
    if (platforms.INSTAGRAM.test(url)) return 'INSTAGRAM';
    return null;
}

/**
 * Inisialisasi Sesi Download
 */
export function createSession(jid, url, platform) {
    global.dlSessions.set(jid, {
        url,
        platform,
        timestamp: Date.now()
    });
}

/**
 * Handle Pilihan User (1, 2, 3, 4)
 */
export async function handleChoice(sock, m, helper, groq) {
    const remoteJid = helper.getSender(m);
    const session = global.dlSessions.get(remoteJid);
    if (!session) return false;

    const text = m.messages[0].message?.conversation || m.messages[0].message?.extendedTextMessage?.text || "";
    const choice = text.trim();

    // Hapus sesi jika user memilih batal atau input tidak valid
    if (choice === '4' || choice.toLowerCase() === 'batal') {
        global.dlSessions.delete(remoteJid);
        const res = await groq.getZoeDirective("User membatalkan download. Berikan respon sarkas tapi sopan ala Zoe.", remoteJid);
        await sock.sendMessage(remoteJid, { text: res }, { quoted: m.messages[0] });
        return true;
    }

    const types = { '1': 'video', '2': 'audio', '3': 'document' };
    const type = types[choice] || (['video', 'audio', 'document'].includes(choice.toLowerCase()) ? choice.toLowerCase() : null);

    if (!type) {
        await sock.sendMessage(remoteJid, { text: "⚠️ Pilihan nggak valid boss. Ketik 1 (Video), 2 (Audio), 3 (Dokumen), atau 4 (Batal)." });
        return true; 
    }

    // Proses Download
    global.dlSessions.delete(remoteJid); // Bersihkan sesi segera setelah pilihan valid diterima
    await executeDownload(sock, m, session.url, type, helper, groq);
    return true;
}

/**
 * Eksekusi Download menggunakan youtube-dl-exec (Powered by yt-dlp)
 */
async function executeDownload(sock, m, url, type, helper, groq) {
    const remoteJid = helper.getSender(m);
    const timestamp = Date.now();
    const outputBase = path.join(tempDir, `dl_${timestamp}`);
    
    // Import bouncer dinamis untuk tracking proses
    const { startProcessing, stopProcessing } = await import(`./bouncer.js?t=${Date.now()}`);

    try {
        startProcessing(remoteJid); // Tandai Zoe lagi sibuk
        
        const initRes = await groq.getZoeDirective(`Zoe lagi download data [${type.toUpperCase()}] dari link: ${url}. Beritahu user buat sabar pake gaya lo.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: initRes }, { quoted: m.messages[0] });
        await sock.sendPresenceUpdate('composing', remoteJid);

        const youtubedl = (await import('youtube-dl-exec')).default;

        let flags = {
            output: `${outputBase}.%(ext)s`,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            noPlaylist: true,
            formatSort: 'res:720,ext:mp4:m4a', // Prioritaskan 720p biar nggak kegedean
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language:en-US,en;q=0.9',
                'Sec-Fetch-Mode:navigate'
            ]
        };

        if (type === 'audio') {
            flags.extractAudio = true;
            flags.audioFormat = 'mp3';
        } else {
            // Video/Document: Paksa MP4 biar WhatsApp seneng
            flags.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
            flags.mergeOutputFormat = 'mp4';
        }

        await youtubedl(url, flags);

        // Cari file hasil download (karena ekstensi bisa bervariasi)
        const files = fs.readdirSync(tempDir);
        const fileName = files.find(f => f.startsWith(`dl_${timestamp}`));
        if (!fileName) throw new Error("File hasil download tidak ditemukan di raga Zoe.");
        
        const filePath = path.join(tempDir, fileName);
        const stats = fs.statSync(filePath);

        if (stats.size > 50 * 1024 * 1024) { // Limit 50MB
             throw new Error("File-nya kegedean boss (di atas 50MB). Zoe nggak kuat ngirimnya lewat WA.");
        }

        // Kirim Media
        const ext = path.extname(filePath);
        if (type === 'audio') {
            await sock.sendMessage(remoteJid, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: false }, { quoted: m.messages[0] });
        } else if (type === 'video') {
            const successCap = await groq.getZoeDirective("Download video sukses. Berikan caption singkat & elit buat user.", remoteJid);
            await sock.sendMessage(remoteJid, { video: { url: filePath }, caption: successCap }, { quoted: m.messages[0] });
        } else {
            // Document: Gunakan ekstensi asli biar nggak jadi .bin
            const cleanFileName = `Zoe_Download_${timestamp}${ext}`;
            await sock.sendMessage(remoteJid, { 
                document: { url: filePath }, 
                fileName: cleanFileName, 
                mimetype: ext === '.mp4' ? 'video/mp4' : (ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream') 
            }, { quoted: m.messages[0] });
        }

        // Cleanup
        setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);

        helper.coolLog('SUCCESS', `Neural Download dispatched: ${fileName}`);

    } catch (error) {
        console.error('Download Engine Error:', error);
        const errorRes = await groq.getZoeDirective(`Sistem download Zoe kram karena: ${error.message}. Kasih tau user pake gaya lo yang elit tapi jujur.`, remoteJid);
        await sock.sendMessage(remoteJid, { text: errorRes });
        // Cleanup on error
        const files = fs.readdirSync(tempDir);
        files.filter(f => f.startsWith(`dl_${timestamp}`)).forEach(f => fs.unlinkSync(path.join(tempDir, f)));
    } finally {
        stopProcessing(remoteJid); // Selesai sibuk, akses normal kembali
    }
}
