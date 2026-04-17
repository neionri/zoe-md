/**
 * ZOE NEURAL DISPATCHER (Message Handler)
 * ---------------------------------------
 * Pusat kendali trafik pesan. File ini bertanggung jawab memilah apakah 
 * sebuah pesan adalah perintah bot atau chat biasa (AI Logic).
 */

// Memuat pemuat perintah secara dinamis untuk mendukung Hot-Reload
// loadCommands akan diimpor nantinya di dalam siklus loop pesan.

/**
 * Pengambil Helper Dinamis
 * Memastikan semua fungsi pendukung (Visual, Memory, AI) selalu menggunakan
 * versi terbaru dari disk pada setiap pesan baru.
 * 
 * @returns {Promise<Object>} Berisi module helper yang diimpor secara dinamis.
 */
async function getHelpers() {
    const timestamp = Date.now();
    const [helper, memory, groq, imageHelper, queue] = await Promise.all([
        import(`./func/helper.js?t=${timestamp}`),
        import(`./func/memory.js?t=${timestamp}`),
        import(`./func/groq.js?t=${timestamp}`),
        import(`./func/imageHelper.js?t=${timestamp}`),
        import(`./func/priorityQueue.js?t=${timestamp}`)
    ]);
    return { helper, memory, groq, imageHelper, queue };
}

/**
 * Neural Accumulator Storage (In-Memory Global Queue)
 * Menggunakan 'global' agar antrian tidak kereset saat Hot-Reload.
 */
if (!global.neuralQueues) global.neuralQueues = new Map();

/**
 * Handler Pesan Utama (Debounced Entry Point)
 * Mengumpulkan pesan yang masuk bertubi-tubi (spam) dan memprosesnya sekaligus
 * agar Zoe memberikan balasan yang padu dan tidak berulang.
 */
export async function handleMessage(sock, m) {
    // 1. Setup Awal & Identifikasi JID
    const { helper } = await getHelpers();
    const remoteJid = helper.getSender(m);
    const text = helper.getMessageContent(m);

    // Filter pesan: Hanya proses tipe 'notify' (pesan chat biasa)
    if (m.type !== 'notify') return;

    // Abaikan pesan otomatis dari diri sendiri
    if (m.messages[0].key.fromMe) {
        if (text && !text.startsWith('[SYSTEM]')) {
            const { memory } = await getHelpers();
            await memory.addMessage(remoteJid, 'assistant', text);
        }
        return;
    }

    // Auto-Read instan
    await sock.readMessages([m.messages[0].key]);

    // 2. LOGIKA NEURAL ACCUMULATOR (Dynamic Debouncing v3.2.0)
    // Identifikasi Kasta Sedini Mungkin
    const participantJid = helper.getParticipant(m);
    const { memory, queue: nQueue } = await getHelpers();
    const userConfig = await memory.getUserConfig(participantJid);
    const tier = userConfig.tier || 'free';

    // VIP dapet jendela observasi lebih kenceng (1.5 detik)
    const debounceTime = tier === 'vip' ? 1500 : 3000;

    if (!global.neuralQueues.has(remoteJid)) {
        global.neuralQueues.set(remoteJid, {
            messages: [],
            timer: null,
            lastM: m
        });
    }

    const queue = global.neuralQueues.get(remoteJid);
    queue.messages.push(m);
    queue.lastM = m;

    if (queue.timer) clearTimeout(queue.timer);
    
    helper.coolLog('PRESENCE', `Accumulating thought for ${remoteJid.split('@')[0]}... [Debounce: ${debounceTime}ms]`);
    
    queue.timer = setTimeout(async () => {
        try {
            const batch = [...queue.messages];
            const lastM = queue.lastM;
            global.neuralQueues.delete(remoteJid);
            
            nQueue.enqueueNeuralTask({
                remoteJid,
                tier,
                m: lastM,
                batch,
                execute: async () => {
                    await _executeNeuralLogic(sock, lastM, batch, userConfig);
                }
            });

        } catch (err) {
            helper.coolLog('ERROR', `[NeuralAccumulator] Fatal Error: ${err.message}`, err);
            global.neuralQueues.delete(remoteJid);
        }
    }, debounceTime);
}

/**
 * INTERNAL: Eksekusi Logika Neural (Processor)
 * Menjalankan seluruh logika Zoe (Bouncer, Identity, AI Synthesis) 
 * terhadap kumpulan pesan yang sudah diakumulasi.
 */
async function _executeNeuralLogic(sock, m, batch, existingConfig) {
    // 1. Muat Helper Dinamis (Hot-Reload)
    const { helper, memory, groq, imageHelper } = await getHelpers();
    const remoteJid = helper.getSender(m);

    // 1.5. KONSOLIDASI IDENTITAS & KASTA
    const participantJid = helper.getParticipant(m);
    const today = new Date().toISOString().split('T')[0];
    
    // Gunakan config yang sudah ada atau fetch ulang jika tidak ada
    let userConfig = existingConfig || await memory.getUserConfig(participantJid);
    
    // Neural Reset (00:00)
    if (userConfig.lastReset !== today) {
        userConfig = await memory.updateUserConfig(participantJid, { 
            dailyUsage: new Map(),
            lastReset: today 
        });
        helper.coolLog('MEMORY', `Neural reset complete for ${participantJid.split('@')[0]}`);
    }

    // 1.6. CEK SESI DOWNLOAD AKTIF (Session Interceptor)
    try {
        const timestamp = Date.now();
        const { handleChoice } = await import(`./func/downloader.js?t=${timestamp}`);
        const isSessionHandled = await handleChoice(sock, m, helper, groq, userConfig);
        if (isSessionHandled) {
            helper.coolLog('SYSTEM', 'Neural Synapse: Download Session intercepted.');
            return;
        }
    } catch (e) {
        helper.coolLog('ERROR', `Session Handler Error: ${e.message}`, e);
    }

    // 2. AGREGASI PESAN (Bentuk satu konteks utuh dari spam user)
    // Harus diproses di awal agar Bouncer dan Command punya data yang lengkap.
    let combinedText = "";
    let isImage = false;
    let isAudio = false;
    let imageBuffer = null;
    let audioBuffer = null;

    for (const msg of batch) {
        const content = helper.getMessageContent(msg);
        if (content) combinedText += (combinedText ? "\n" : "") + content;
        
        if (msg.messages[0].message?.imageMessage) {
            isImage = true;
            const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
            imageBuffer = await downloadMediaMessage(msg.messages[0], 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        }

        if (msg.messages[0].message?.audioMessage) {
            isAudio = true;
            const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
            audioBuffer = await downloadMediaMessage(msg.messages[0], 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        }
    }

    helper.coolLog('NETWORK', `Aggregated batch of ${batch.length} synapses from ${remoteJid.split('@')[0]}`);

    // 1.6. NEURAL BOUNCER (Security Gatekeeper)
    // Pastikan user tidak sedang di-ban atau melakukan spam saat proses aktif.
    const { isCommandBanned, handleIfSpamming, startProcessing, stopProcessing } = await import(`./func/bouncer.js?t=${Date.now()}`);
    
    // Cek apakah batch pesan mengandung command
    const safeContent = String(combinedText || "");
    const lines = safeContent.split('\n');
    const isAttemptingCommand = lines.some(line => helper.isCommand(line));

    if (isAttemptingCommand) {
        const isBanned = await isCommandBanned(remoteJid, sock, helper, groq);
        if (isBanned) return; 
    }

    // Cek apakah user nge-spam saat Zoe lagi sibuk (Active Process)
    // Gunakan pesan asli terakhir untuk quoted reply jika terkena hukuman
    const isSpamming = await handleIfSpamming(remoteJid, sock, helper, groq, m.messages[0]);
    if (isSpamming) return;

    // ==========================================
    // NEURAL PRESENCE DEBOUNCE (Timer 3 Menit)
    // ==========================================
    if (global.offlineTimer) clearTimeout(global.offlineTimer);
    if (global.isOffline !== false) {
        await sock.sendPresenceUpdate('available');
        global.isOffline = false;
        helper.coolLog('PRESENCE', 'Global Signal: [ONLINE] (Activity Detected)');
    }

    const startOfflineTimer = () => {
        if (global.offlineTimer) clearTimeout(global.offlineTimer);
        global.offlineTimer = setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('unavailable');
                global.isOffline = true;
                helper.coolLog('PRESENCE', 'Global Signal: [OFFLINE] (3-Minute Inactivity Timeout)');
            } catch (e) {}
        }, 3 * 60 * 1000);
    };

    // 2. Load/Reload Database Perintah
    if (!global.zoeCommands || global.reloadCommands) {
        const { loadCommands } = await import(`./commands/index.js?t=${Date.now()}`);
        const { map, list } = await loadCommands();
        global.zoeCommands = map;
        global.commandsList = list;
        global.reloadCommands = false;
        helper.coolLog('SYSTEM', 'Neural commands synchronized.');

        // NEB: Cek papan pengumuman modul yang gagal dimuat
        if (global.failedModules && global.failedModules.length > 0) {
            const failed = global.failedModules.splice(0);
            
            // Hitung isOwner lebih awal untuk keperluan NEB
            const _participantNum = participantJid.split('@')[0].split(':')[0];
            const _ownerNum = (process.env.OWNER_LID || '').replace(/[^\d]/g, '');
            const _ownerLid = helper.jidNormalize(process.env.OWNER_LID);
            const _isOwner = _participantNum === _ownerNum ||
                             _participantNum.endsWith(_ownerNum.slice(-10)) ||
                             _ownerNum.endsWith(_participantNum.slice(-10)) ||
                             (_ownerLid && participantJid === _ownerLid);

            try {
                if (_isOwner) {
                    // Laporan teknis lengkap untuk Boss
                    const failedList = failed.map(f => `• *${f.file}*\n  _${f.message}_`).join('\n');
                    await sock.sendMessage(remoteJid, {
                        text: `🚨 *[NEURAL EMERGENCY]*\n\nZoe gagal memuat modul berikut:\n\n${failedList}\n\nSilakan perbaiki file tersebut Boss.`
                    });
                } else {
                    // Pesan dinamis dari karakter Zoe untuk user biasa
                    const failedNames = failed.map(f => f.file.replace('.js', '')).join(', ');
                    let errMsg = `⚠️ Maaf, command ${failedNames} sedang gangguan teknis. Coba lagi nanti.`;
                    try {
                        const { synthesizeCommandResult } = await import('./func/groq.js');
                        errMsg = await synthesizeCommandResult(
                            'error_notice',
                            `Command "${failedNames}" sedang error dan tidak bisa dijalankan sementara.`,
                            remoteJid
                        );
                    } catch (_) {}
                    await sock.sendMessage(remoteJid, { text: errMsg });
                }
            } catch (_) {}
            return;
        }
    }

    helper.coolLog('NETWORK', `Processing batch of ${batch.length} synapses from ${remoteJid.split('@')[0]}`);

    const participantNumber = participantJid.split('@')[0].split(':')[0]; 
    const ownerNumber = (process.env.OWNER_LID || '').replace(/[^\d]/g, '');
    const ownerLid = helper.jidNormalize(process.env.OWNER_LID);

    // Otentikasi Owner: Berdasarkan nomor HP atau identitas LID
    const isOwner = participantNumber === ownerNumber || 
                    participantNumber.endsWith(ownerNumber.slice(-10)) || 
                    ownerNumber.endsWith(participantNumber.slice(-10)) ||
                    (ownerLid && participantJid === ownerLid);

    // DEBUG LOG OWNER (Temporary)
    helper.coolLog('BRAIN', `Owner Check -> Sender: ${participantJid} | ConfigLid: ${ownerLid} | IsOwner: ${isOwner}`);

    const isGroup = remoteJid.endsWith('@g.us');
    const isPrivate = !isGroup;
    const pushName = m.messages[0].pushName || 'Seseorang';

    // 3.5 UNIVERSAL MAINTENANCE INTERCEPTOR (Neural Gate)
    if (global.maintenanceMode && !isOwner) {
        helper.coolLog('SECURITY', `Maintenance Intercept for ${participantJid}`);
        try {
            const zoeRejection = await groq.getZoeDirective(
                `Boss sedang melakukan 'soul-surgery' (maintenance) pada raga gue. Kasih tau user kalau gue lagi sibuk/offline. Gunakan gaya bicara Zoe yang sarkas, elit, dingin, dan SINGKAT (Maksimal 1 kalimat). Usir mereka dengan gaya elit.`,
                participantJid
            );
            await sock.sendMessage(remoteJid, { text: zoeRejection }, isGroup ? { quoted: m.messages[0] } : {});
        } catch (e) {
            await sock.sendMessage(remoteJid, { text: `⚠️ *Neural Matrix Offline*\nBoss lagi benerin raga gue. Lu tunggu aja.` });
        }
        startOfflineTimer();
        return;
    }

    // 4. VOICE TRANSCRIPTION (Jika ada audio)
    if (isAudio && audioBuffer) {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const tempPath = path.resolve(`./scratch/voice/temp_${Date.now()}.mp3`);
            fs.writeFileSync(tempPath, audioBuffer);
            const transcription = await groq.transcribeAudio(tempPath);
            combinedText += (combinedText ? "\n" : "") + `[Voice Note]: ${transcription}`;
            fs.unlinkSync(tempPath);
        } catch (err) { helper.coolLog('ERROR', `[Voice] Error: ${err.message}`); }
    }

    // 5. SHADOW BOUNCER & IDENTITY SCAN
    const config = await memory.getGroupConfig(remoteJid);
    const isBouncerActive = config.bouncerMode === true;
    let isSelfieDetected = false;
    let base64 = imageBuffer ? imageBuffer.toString('base64') : null;

    if (isImage && imageBuffer) {
        try {
            const hash = imageHelper.calculateHash(imageBuffer);
            const galleryMatch = await memory.checkGalleryHash(hash);
            if (galleryMatch) isSelfieDetected = true;

            if (isBouncerActive) {
                const bouncerVonis = await groq.analyzeShadowMotive(combinedText, base64);
                if (bouncerVonis.includes('VIOLATION')) {
                    await sock.sendMessage(remoteJid, { delete: m.messages[0].key });
                    await sock.sendMessage(remoteJid, { text: `🛡️ *Zoe Shadow Bouncer*: Ancaman dinetralkan.` });
                    startOfflineTimer();
                    return;
                }
            }
        } catch (err) { helper.coolLog('ERROR', `[Scan] Error: ${err.message}`); }
    }

    // 5.9. NEURAL OVERRIDE INTERCEPTOR (Owner Only)
    // Shortcut gerbang Dewa (JS Eval & Shell Exec)
    if (isOwner && (combinedText.startsWith('>') || combinedText.startsWith('$'))) {
        const execCmd = global.zoeCommands?.get('exec');
        if (execCmd) {
            const prefix = combinedText[0];
            const code = combinedText.slice(1).trim();
            try {
                startProcessing(remoteJid);
                await execCmd.run(sock, m, { 
                    command: prefix, 
                    args: [code], 
                    helper, memory, groq, imageHelper, isOwner, isGroup, userConfig 
                });
            } finally {
                stopProcessing(remoteJid);
                startOfflineTimer();
            }
            return;
        }
    }

    // 6. COMMAND EXECUTION (Cek apakah ada command di kumpulan pesan)
    const cmdLines = String(combinedText || "").split('\n');
    for (const line of cmdLines) {
        if (helper.isCommand(line)) {
            const { command, args } = helper.parseCommand(line);
            if (global.zoeCommands && global.zoeCommands.has(command)) {


                // 6.1. LOCKDOWN FILTER (Stage 2.6.1 - Global & Local Check)
                const globalConfig = await memory.getGroupConfig('GLOBAL');
                const globalBanned = globalConfig.bannedCommands || [];
                const localBanned = config.bannedCommands || [];
                
                const isGloballyBanned = globalBanned.includes(command);
                const isLocallyBanned = isGroup && localBanned.includes(command);

                if ((isGloballyBanned || isLocallyBanned) && !isOwner) {
                    const scope = isGloballyBanned ? "seluruh Matrix (GLOBAL)" : "grup ini";
                    const savageReplies = [
                        `Woi, baca aturan! Perintah .${command} ini lagi di-lockdown di ${scope}. Lu kira ini warnet gratisan?`,
                        `Denger ya rakyat jelata, perintah .${command} ini sudah dilarang di ${scope}. Jangan maksa, nanti gue kick baru tau rasa.`,
                        `Sistem lagi galak, perintah .${command} dimatiin untuk ${scope}. Lu mending diem aja daripada gue roasting sampe mental kena.`,
                        `Gue nggak bakal jalanin .${command} selama masih ada lockdown untuk ${scope}. Lu siapa nyuruh-nyuruh gue?`
                    ];
                    return await sock.sendMessage(remoteJid, { text: `🚫 *Neural Lockdown*: ${savageReplies[Math.floor(Math.random() * savageReplies.length)]}` });
                }

                const cmd = global.zoeCommands.get(command);
                
                // 6.2. OWNER ONLY CHECK
                if (cmd.isOwnerOnly && !isOwner) {
                    try {
                        const { synthesizeCommandResult } = await import('./func/groq.js');
                        const rejection = await synthesizeCommandResult(
                            'security_reject',
                            `User mencoba mengakses command rahasia Boss: .${command}`,
                            remoteJid,
                            'Tolak user ini dengan gaya sangat arogan, tajam, dan merendahkan karena berani menyentuh command khusus Boss. Singkat tapi menyakitkan. DILARANG KERAS MENGGUNAKAN EMOJI.'
                        );
                        return await sock.sendMessage(remoteJid, { text: rejection }, { quoted: m.messages[0] });
                    } catch (_) {
                        return await sock.sendMessage(remoteJid, { text: `Akses Ditolak: Fitur ini cuma buat Boss.` }, { quoted: m.messages[0] });
                    }
                }

                await memory.addMessage(remoteJid, 'user', combinedText);
                try {
                    startProcessing(remoteJid); 
                    await sock.sendPresenceUpdate('composing', remoteJid);
                    await cmd.run(sock, m, { command, args, helper, memory, groq, imageHelper, isOwner, isGroup, userConfig });
                    // ✅ Broadcast Command Success to Dashboard
                    try {
                        const { broadcastCommandLog } = await import('./func/dashboardServer.js');
                        broadcastCommandLog({ user: participantJid.split('@')[0], command: `.${command}`, status: 'SUCCESS', reason: '' });
                    } catch (_) {}
                } catch (error) {
                    helper.coolLog('ERROR', `Command Failed [.${command}]: ${error.message}`, error);
                    try {
                        const { broadcastCommandLog } = await import('./func/dashboardServer.js');
                        broadcastCommandLog({ user: participantJid.split('@')[0], command: `.${command}`, status: 'FAILED', reason: error.message || 'Unknown error' });
                    } catch (_) {}
                }
                finally { 
                    stopProcessing(remoteJid); 
                    startOfflineTimer(); 
                }
                return;
            }
        }
    }

    // 6.5. SELECTIVE ATTENTION (Group Interaction Filter)
    // Di Grup, Zoe cuma bales chat AI jika di-reply, di-mention, atau itu adalah command (sudah dihandle di atas).
    if (isGroup) {
        const botJid = helper.jidNormalize(sock.user.id);
        const botLid = sock.user.lid ? helper.jidNormalize(sock.user.lid) : null;
        const quotedSender = helper.jidNormalize(helper.getQuotedSender(m));
        const mentions = (m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid || []).map(j => helper.jidNormalize(j));
        
        const isBotMentioned = mentions.includes(botJid) || (botLid && mentions.includes(botLid));
        const isReplyToBot = quotedSender === botJid || (botLid && quotedSender === botLid);
        const isNamed = combinedText.toLowerCase().includes('zoe');

        // Jika bukan command (sudah lewat pengecekan di atas) dan tidak di-mention/reply/panggilan nama, abaikan.
        if (!isBotMentioned && !isReplyToBot && !isNamed) {
            startOfflineTimer();
            return;
        }
    }

    // 7. NEURAL RESPONSE SYNTHESIS
    const { messages: history, summary, facts } = await memory.getHistory(remoteJid);
    
    try {
        await sock.sendPresenceUpdate('composing', remoteJid);
        let response;
        
        if (isImage && !isSelfieDetected && base64) {
            response = await groq.getZoeVisionResponse(base64, remoteJid, combinedText);
        } else {
            response = await groq.getZoeResponse(combinedText, history, isOwner, isPrivate, pushName, remoteJid, { summary, facts, isSelfieDetected });
        }
        
        // PAP ENGINE
        if (response.includes('[SEND_PAP]')) {
            const config = await memory.getGroupConfig(remoteJid);
            const now = new Date();
            const lastPap = config.lastPapTime ? new Date(config.lastPapTime) : null;
            const cooldownMs = 3 * 60 * 1000;
            
            if (lastPap && (now - lastPap < cooldownMs)) {
                const cleanResponse = response.replace('[SEND_PAP]', '').trim();
                if (cleanResponse.length > 30 || !/pap|foto|kirim|liat|muka/gi.test(combinedText)) {
                    await sock.sendMessage(remoteJid, { text: cleanResponse }, isGroup ? { quoted: m.messages[0] } : {});
                } else {
                    const refusalResponse = await groq.getZoeDirective("User minta PAP lagi.", remoteJid);
                    await sock.sendMessage(remoteJid, { text: refusalResponse.replace('[SEND_PAP]', '').trim() }, isGroup ? { quoted: m.messages[0] } : {});
                }
                await memory.addMessage(remoteJid, 'user', combinedText);
                return;
            } 
            
            const isRefusingInText = /nggak bakal|ngak bakal|gak bakal|jangan harap|gamau|ga mau/gi.test(response);
            if (!isRefusingInText) {
                const papPath = await imageHelper.getRandomZoePap();
                if (papPath) {
                    await sock.sendMessage(remoteJid, { image: { url: papPath }, caption: response.replace('[SEND_PAP]', '').trim() }, isGroup ? { quoted: m.messages[0] } : {});
                    await memory.addMessage(remoteJid, 'system', '[IDENTITY]: Lo kirim foto lu sendiri.');
                    await memory.updateGroupConfig(remoteJid, { lastPapTime: now });
                    await memory.addMessage(remoteJid, 'user', combinedText);
                    return;
                }
            }
        }

        await sock.sendMessage(remoteJid, { text: response.replace('[SEND_PAP]', '').trim() }, isGroup ? { quoted: m.messages[0] } : {});
        await memory.addMessage(remoteJid, 'user', combinedText);
        
    } catch (error) {
        helper.coolLog('ERROR', `AI Error: ${error.message}`, error);
    } finally {
        startOfflineTimer();
    }
}
