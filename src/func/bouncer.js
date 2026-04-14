/**
 * ZOE NEURAL BOUNCER (Security & Moderation)
 * -----------------------------------------
 * Unit pengawal syaraf yang bertugas mendeteksi spammer
 * dan melakukan lockdown otomatis jika ada anomali.
 */

// Inisialisasi Memori Global (Status Aktif)
if (!global.neuralSpamCounter) global.neuralSpamCounter = new Map();
if (!global.neuralActiveProcesses) global.neuralActiveProcesses = new Set();

const BAN_DURATION = 5 * 60 * 60 * 1000; // 5 Jam

/**
 * Cek apakah user sedang di-ban dari command (Persistent via MongoDB)
 */
export async function isCommandBanned(jid, sock, helper, groq) {
    const { getGroupConfig, updateGroupConfig } = await import('./memory.js');
    const config = await getGroupConfig(jid);

    if (config.commandBan) {
        const { expires, reason } = config.commandBan;
        
        if (Date.now() < expires) {
            const remaining = Math.ceil((expires - Date.now()) / (60 * 60 * 1000));
            const prompt = `User panggil command padahal lagi di-ban. \n` +
                           `Sisa ban: ${remaining} jam lagi. \n` +
                           `Alasan ban sebelumnya: ${reason || "Spam berlebihan"}. \n` +
                           `Kasih tau dia pake gaya galak tapi elit, sebutkan sisa waktu dan alasannya.`;
            
            const res = await groq.getZoeDirective(prompt, jid);
            await sock.sendMessage(jid, { text: `🛡️ *ZOE LOCKDOWN* 🛡️\n\n${res}` });
            return true;
        } else {
            // Ban expired, hapus dari database
            await updateGroupConfig(jid, { commandBan: null });
            helper.coolLog('SYSTEM', `Persistent Ban expired for ${jid}. Access restored.`);
        }
    }
    return false;
}

/**
 * Deteksi Spam saat proses berat sedang berjalan
 * @returns {boolean} true jika spam terdeteksi dan dihandle
 */
export async function handleIfSpamming(jid, sock, helper, groq, message) {
    if (!global.neuralActiveProcesses.has(jid)) {
        // Jika tidak sedang proses, bersihkan counter spam (agar tidak akumulasi di chat biasa)
        global.neuralSpamCounter.delete(jid);
        return false;
    }

    // Naikkan level kontaminasi (spam)
    const count = (global.neuralSpamCounter.get(jid) || 0) + 1;
    global.neuralSpamCounter.set(jid, count);

    helper.coolLog('BOUNCER', `Spam detected from ${jid} (Level: ${count})`);

    let response = "";
    if (count === 1) {
        response = await groq.getZoeDirective("Ada user spam chat/command pas Zoe lagi sibuk ngerjain tugas dia. Sindir dikit biar sabar.", jid);
    } else if (count === 2) {
        response = await groq.getZoeDirective("User masih spam padahal sudah disindir. Kasih peringatan yang lebih ngegas dan bilang jangan buang sampah di raga Zoe.", jid);
    } else if (count === 3) {
        response = await groq.getZoeDirective("Peringatan terakhir buat user spammer. Beritahu dia kalau sekali lagi nyampah, akses command bakal di-lockdown total.", jid);
    } else if (count >= 5) {
        // EKSEKUSI BAN 5 JAM (Persistent via MongoDB)
        const { updateGroupConfig } = await import('./memory.js');
        const reason = "Spam berlebihan saat Zoe sedang memproses tugas berat.";
        
        await updateGroupConfig(jid, { 
            commandBan: { 
                expires: Date.now() + BAN_DURATION, 
                reason 
            } 
        });

        global.neuralSpamCounter.delete(jid);
        global.neuralActiveProcesses.delete(jid); 
        
        response = await groq.getZoeDirective(`User resmi di-ban command 5 jam karena: ${reason}. Kasih kata-kata perpisahan yang dingin dan elit.`, jid);
    }

    if (response) {
        await sock.sendMessage(jid, { text: response }, { quoted: message });
    }

    return true; // Input telah dihandle sebagai spam, jangan lanjut ke AI/Command
}

/**
 * Lifecycle: Mulai Proses Berat
 */
export function startProcessing(jid) {
    global.neuralActiveProcesses.add(jid);
    global.neuralSpamCounter.delete(jid); // Reset counter tiap kali mulai tugas baru
}

/**
 * Lifecycle: Selesai Proses Berat
 */
export function stopProcessing(jid) {
    global.neuralActiveProcesses.delete(jid);
    global.neuralSpamCounter.delete(jid);
}
