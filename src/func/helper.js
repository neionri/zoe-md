/**
 * ZOE SYSTEM UTILITIES (Helper)
 * ------------------------------
 * Kumpulan fungsi pendukung dasar mulai dari pemrosesan teks,
 * manajemen waktu, hingga logging terminal yang cantik.
 */

/**
 * Parsing Command
 * Memisahkan awalan (prefix), nama perintah, dan argumen.
 * 
 * @param {string} text - Teks mentah dari pesan.
 * @returns {Object} { command, args }
 */
export function parseCommand(text) {
    const prefix = process.env.PREFIX || '.';
    const args = text.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    return { command, args };
}

/**
 * Deteksi Command
 * Memastikan pesan diawali dengan prefix yang benar.
 */
export function isCommand(text) {
    const prefix = process.env.PREFIX || '.';
    if (!text) return false;
    return text.startsWith(prefix);
}

/**
 * Ekstraktor Konten Pesan
 * Mengambil teks dari berbagai jenis pesan WhatsApp (Teks, Caption, dll).
 */
export function getMessageContent(m) {
    const message = m.messages[0];
    return message.message?.conversation || 
           message.message?.extendedTextMessage?.text || 
           message.message?.imageMessage?.caption || 
           message.message?.videoMessage?.caption || 
           '';
}

/**
 * Ekstraktor Pengirim Pesan Quoted
 * Mengambil JID dari orang yang pesannya dibalas.
 */
export function getQuotedSender(m) {
    return m.messages[0].message?.extendedTextMessage?.contextInfo?.participant || 
           m.messages[0].message?.extendedTextMessage?.contextInfo?.remoteJid || 
           null;
}

/**
 * Ekstraktor Teks Quoted (Reply)
 * Mengambil teks dari pesan yang dibalas (replied message).
 * 
 * @param {Object} m - Objek pesan Baileys.
 * @returns {string|null} Teks pesan quoted atau null jika tidak ada.
 */
export function getQuotedText(m) {
    const contextInfo = m.messages[0].message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    if (!quotedMessage) return null;

    return quotedMessage.conversation || 
           quotedMessage.extendedTextMessage?.text || 
           quotedMessage.imageMessage?.caption || 
           null;
}

/**
 * Normalisasi JID
 * Menghapus suffix perangkat (misal :1) tapi menjaga domain (@g.us atau @s.whatsapp.net).
 */
export function jidNormalize(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    const [user, domain] = jid.split('@');
    if (!domain) return jid;
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@${domain}`;
}

/**
 * Ekstraktor Pengirim (Chat ID)
 * Mengambil ID JID tujuan (Grup atau Private Chat).
 */
export function getSender(m) {
    return jidNormalize(m.messages[0].key.remoteJid);
}

/**
 * Ekstraktor Partisipan (Original Sender)
 * Mengambil ID JID orang yang mengirim pesan (Real Person).
 */
export function getParticipant(m) {
    const key = m.messages[0].key;
    return jidNormalize(key.participant || key.remoteJid);
}

/**
 * Delay (Sleep)
 * Fungsi utilitas untuk memberikan jeda waktu (milidetik).
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let logBroadcaster = null;

/**
 * Set Broadcaster untuk log (v1.0 Dashboard Bridge)
 * @param {function} fn - Fungsi pemancar log
 */
export function setLogBroadcaster(fn) {
    logBroadcaster = fn;
}

/**
 * Premium Terminal Logger (No-Dependency Version)
 * Mencetak log ke terminal dengan warna menggunakan ANSI Escape Codes.
 * 
 * @param {string} type - Kategori log (SUCCESS, NETWORK, SYSTEM, dll).
 * @param {string} message - Isi pesan log.
 */
export function coolLog(type, message) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Stream ke dashboard jika aktif
    if (logBroadcaster) {
        logBroadcaster(type, message);
    }
    
    // ANSI Color Codes
    const colors = {
        SUCCESS: '\x1b[92m', // Green
        NETWORK: '\x1b[94m', // Blue
        SYSTEM: '\x1b[35m',  // Magenta
        MEMORY: '\x1b[93m',  // Yellow
        BOUNCER: '\x1b[91m', // Red
        BRAIN: '\x1b[36m',   // Cyan
        ERROR: '\x1b[41m\x1b[37m' // White on Red
    };
    
    const color = colors[type] || '\x1b[37m'; // Default White
    const reset = '\x1b[0m';
    const grey = '\x1b[90m';
    
    console.log(`${grey}[${time}]${reset} ${color}[${type}]${reset} ${message}`);
}

/**
 * findParticipant (Deep-Scan Meta)
 * Mencari partisipan dalam metadata grup dengan dukungan JID dan LID.
 * 
 * @param {Object} meta - Metadata grup dari sock.groupMetadata.
 * @param {string} targetJID - JID target yang dicari (JID atau LID).
 * @returns {Object|null} Objek partisipan atau null.
 */
export function findParticipant(meta, targetJID) {
    if (!meta?.participants || !targetJID) return null;
    const jid = jidNormalize(targetJID);
    return meta.participants.find(p => 
        jidNormalize(p.id) === jid || 
        (p.lid && jidNormalize(p.lid) === jid)
    );
}
