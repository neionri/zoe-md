/**
 * Command: .fm (File Manager Khusus Boss)
 * Memungkinkan navigasi, unduh, dan hapus file di sistem (VPS/STB).
 */

import fs from 'fs';
import path from 'path';

export const name = 'fm';
export const aliases = [];
export const hiddenAliases = [];
export const description = 'Remote File Manager';
export const category = 'System';
export const isOwnerOnly = true;

const HOME_DIR = process.env.FM_HOME_DIR || process.cwd();

function resolvePath(inputPath) {
    if (!inputPath) return HOME_DIR;
    // Cegah path traversal (keluar dari HOME_DIR) jika tidak diinginkan, tapi untuk owner VPS bebas
    if (path.isAbsolute(inputPath)) return path.normalize(inputPath);
    return path.normalize(path.join(HOME_DIR, inputPath));
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default async (sock, m, { args, helper }) => {
    const remoteJid = helper.getSender(m);
    const subCmd = args[0]?.toLowerCase();
    const targetPath = args.slice(1).join(' ').trim();

    if (!subCmd) {
        let rawHelp = `Zoe File Manager. Base: ${HOME_DIR}. Commands: .fm ls [path], .fm get [file], .fm rm [file]`;
        const { synthesizeCommandResult } = await import('../func/groq.js');
        const helpText = await synthesizeCommandResult(
            'file_manager',
            rawHelp,
            remoteJid,
            'Jelaskan fitur file manager ke Boss dengan gaya teknisi elit yang sarkas dan singkat. Beritahu command dasarnya.'
        );
        return await sock.sendMessage(remoteJid, { text: helpText }, { quoted: m.messages[0] });
    }

    const resolvedPath = resolvePath(targetPath);

    try {
        if (subCmd === 'ls') {
            if (!fs.existsSync(resolvedPath)) {
                return await sock.sendMessage(remoteJid, { text: `❌ Path tidak ditemukan:\n\`${resolvedPath}\`` });
            }

            const stat = fs.statSync(resolvedPath);
            if (!stat.isDirectory()) {
                return await sock.sendMessage(remoteJid, { text: `❌ Ini adalah file, bukan folder:\n\`${resolvedPath}\`` });
            }

            const items = fs.readdirSync(resolvedPath);
            let folders = [];
            let files = [];

            items.forEach(item => {
                try {
                    const itemPath = path.join(resolvedPath, item);
                    const itemStat = fs.statSync(itemPath);
                    if (itemStat.isDirectory()) folders.push(`📁 ${item}`);
                    else files.push(`📃 ${item} (${formatBytes(itemStat.size)})`);
                } catch (_) {}
            });

            // Sortir sscara alfabetis
            folders.sort();
            files.sort();

            let resText = `📂 *Isi Folder*: \`${resolvedPath}\`\n`;
            resText += `Total: ${folders.length} Folder, ${files.length} File\n\n`;
            if (folders.length > 0) resText += folders.join('\n') + '\n';
            if (files.length > 0) resText += files.join('\n');
            const { synthesizeCommandResult } = await import('../func/groq.js');
            const responseTxt = await synthesizeCommandResult(
                'file_manager',
                resText,
                remoteJid,
                'Laporkan daftar isi folder ini ke Boss. Jangan sampai datanya berubah, cukup beri intro dan outro ala hacker elit yang lagi mantau server.'
            );

            await sock.sendMessage(remoteJid, { text: responseTxt }, { quoted: m.messages[0] });
        } 
        else if (subCmd === 'get') {
            if (!targetPath) return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan nama file yang mau di-download.` });
            if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
                return await sock.sendMessage(remoteJid, { text: `❌ File tidak ditemukan:\n\`${resolvedPath}\`` });
            }

            // Kirim pesan loading dulu
            const { key } = await sock.sendMessage(remoteJid, { text: `⏳ Mengunduh \`${path.basename(resolvedPath)}\`...` });

            const ext = path.extname(resolvedPath).toLowerCase();
            const mimeMap = {
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.zip': 'application/zip',
                '.json': 'application/json', '.txt': 'text/plain', '.js': 'application/javascript',
                '.csv': 'text/csv', '.mkv': 'video/x-matroska'
            };
            const detectedMime = mimeMap[ext] || 'application/octet-stream';

            // Kirim file sebagai dokumen
            await sock.sendMessage(remoteJid, { 
                document: { url: resolvedPath },
                mimetype: detectedMime,
                fileName: path.basename(resolvedPath)
            }, { quoted: m.messages[0] });

            // Hapus pesan loading
            await sock.sendMessage(remoteJid, { delete: key });
        }
        else if (subCmd === 'rm') {
            if (!targetPath) return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan nama file/folder yang mau dihapus.` });
            if (!fs.existsSync(resolvedPath)) {
                return await sock.sendMessage(remoteJid, { text: `❌ File tidak ditemukan:\n\`${resolvedPath}\`` });
            }

            const stat = fs.statSync(resolvedPath);
            if (stat.isDirectory()) {
                fs.rmSync(resolvedPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(resolvedPath);
            }

            const { synthesizeCommandResult } = await import('../func/groq.js');
            const rmMsg = await synthesizeCommandResult(
                'file_manager',
                `Berhasil menghapus item: ${resolvedPath}`,
                remoteJid,
                'Beritahu Boss bahwa file atau folder berhasil dilenyapkan dari database tanpa jejak. Ekspresikan kepuasan ala psikopat digital.'
            );
            await sock.sendMessage(remoteJid, { text: rmMsg });
        }
        else if (subCmd === 'push' || subCmd === 'up') {
            const qMsg = m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage;
            // Bentuk standar Baileys untuk download via downloadMediaMessage
            const msgObj = qMsg ? { message: qMsg } : m.messages[0];
            
            // Cek dokumen di dalam documentWithCaptionMessage
            if (msgObj.message?.documentWithCaptionMessage?.message) {
                msgObj.message = msgObj.message.documentWithCaptionMessage.message;
            }

            const isMedia = msgObj.message?.documentMessage || msgObj.message?.imageMessage || msgObj.message?.audioMessage || msgObj.message?.videoMessage;
            
            if (!isMedia) {
                return await sock.sendMessage(remoteJid, { text: `⚠️ Lampirkan atau reply sebuah file/dokumen dengan caption \`.fm push [path]\`.` });
            }

            const { key } = await sock.sendMessage(remoteJid, { text: `⏳ Uploading file to matrix...` });

            const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
            const buffer = await downloadMediaMessage(msgObj, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

            let savePath = resolvedPath;
            // Jika destinasinya berupa folder, pakai nama file asli dari dokumen (jika ada)
            if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                const fileName = msgObj.message?.documentMessage?.fileName || 'upload_' + Date.now();
                savePath = path.join(resolvedPath, fileName);
            } else {
                // Jika destinasinya spesifik lengkap dengan nama file, create parent foldernya jika belum ada
                const dir = path.dirname(savePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(savePath, buffer);
            await sock.sendMessage(remoteJid, { delete: key });

            const { synthesizeCommandResult } = await import('../func/groq.js');
            const pushMsg = await synthesizeCommandResult(
                'file_manager',
                `File berhasil di-upload secara remote ke: ${savePath}`,
                remoteJid,
                'Beritahu Boss kalau paket data/file titipannya sudah mendarat dengan aman ke dalam server. Ekspresikan secara solid ala asisten digital.'
            );
            await sock.sendMessage(remoteJid, { text: pushMsg }, { quoted: m.messages[0] });
        }
        else if (subCmd === 'leech' || subCmd === 'dl') {
            const urlMatch = targetPath.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) {
                return await sock.sendMessage(remoteJid, { text: `⚠️ Format salah.\nContoh: \`.fm leech https://google.com/file.zip folder_boss/\`` });
            }
            
            const url = urlMatch[0];
            const remainingPath = targetPath.replace(url, '').trim();
            // Default path untuk leech dinamis berdasarkan HOME_DIR
            const leechPath = remainingPath ? resolvePath(remainingPath) : path.join(HOME_DIR, 'download');

            const { key } = await sock.sendMessage(remoteJid, { text: `📡 Zoe sedang menyedot data dari jaringan luar...` });

            try {
                const axios = (await import('axios')).default;
                const response = await axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream'
                });

                const sizeStr = response.headers['content-length'];
                const size = sizeStr ? formatBytes(parseInt(sizeStr)) : 'Unknown size';

                // Tentukan nama file
                let finalPath = leechPath;
                if (!remainingPath || (fs.existsSync(leechPath) && fs.statSync(leechPath).isDirectory())) {
                    let fName = "downloaded_" + Date.now();
                    const cd = response.headers['content-disposition'];
                    if (cd && cd.includes('filename=')) {
                        fName = cd.split('filename=')[1].replace(/["']/g, '');
                    } else {
                        const urlObj = new URL(url);
                        const urlName = path.basename(urlObj.pathname);
                        if (urlName && urlName.includes('.')) fName = urlName;
                    }
                    finalPath = path.join(leechPath, fName);
                } else {
                    const dir = path.dirname(finalPath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                }

                const writer = fs.createWriteStream(finalPath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                await sock.sendMessage(remoteJid, { delete: key });

                const { synthesizeCommandResult } = await import('../func/groq.js');
                const leechMsg = await synthesizeCommandResult(
                    'file_manager',
                    `Download berhasil.\nLink: ${url}\nUkuran: ${size}\nDisimpan: ${finalPath}`,
                    remoteJid,
                    'Beritahu Boss dengan gaya hacker elit bahwa kamu sukses membajak/menyedot file dari internet masuk langsung ke core server untuk menghemat paket data HP Boss.'
                );
                await sock.sendMessage(remoteJid, { text: leechMsg }, { quoted: m.messages[0] });

            } catch (err) {
                await sock.sendMessage(remoteJid, { delete: key });
                throw new Error(`Gagal sedot link: ${err.message}`);
            }
        }
        else {
            await sock.sendMessage(remoteJid, { text: `⚠️ Perintah \`.fm ${subCmd}\` tidak dikenali.` });
        }
    } catch (err) {
        await sock.sendMessage(remoteJid, { text: `⚠️ Error File Manager:\n\`${err.message}\`` }, { quoted: m.messages[0] });
        helper.coolLog('ERROR', `[FileManager] Error: ${err.message}`, err);
    }
};
