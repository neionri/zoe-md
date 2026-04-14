/**
 * COMMAND: .audit
 * SPECIALIST: Orpheus-v1 (Logic Auditor)
 * --------------------------------------
 * Membedah argumen atau teks user untuk mencari kesalahan logika (Logical Fallacies)
 * dan mempretelinya dengan gaya khas Zoe.
 */

export const name = 'audit';
export const aliases = ['logic', 'deconstruct', 'bedah'];
export const description = 'Membedah argumen teks untuk mencari kesalahan logika (Specialist Orpheus).';
export const category = 'Neural Specialist';

export default async function run(sock, m, { args, helper, groq }) {
    const remoteJid = helper.getSender(m);
    
    // 1. Ekstraksi Target Teks (dari Argumen atau Quoted Message)
    let targetText = args.join(' ');
    const quotedText = helper.getQuotedText(m);

    if (!targetText && quotedText) {
        targetText = quotedText;
    }

    if (!targetText) {
        const errorMsg = await groq.getZoeDirective('Beritahu user kalau dia harus masukin teks yang mau diaudit atau reply pesan orang lain pake command ini. SINGKAT & JUTEK.', remoteJid);
        return await sock.sendMessage(remoteJid, { text: errorMsg }, { quoted: m.messages[0] });
    }

    // 2. Kirim ke Divisi Audit (Orpheus Specialist - Cold Logic)
    helper.coolLog('BRAIN', `Initiating logical audit for: "${targetText.slice(0, 30)}..."`);
    
    try {
        const auditResult = await groq.askAudit(targetText);

        // 3. Sintesis Hasil Audit ke dalam Persona Zoe (Sultan/Sarkas)
        const synthesisPrompt = `Kamu adalah ZOE Core. Lu baru saja membedah argumen/teks ini secara logis: [${targetText}].
        Hasil temuan audit lu: [${auditResult}].

        Sampaikan temuan lu ini ke user dengan gaya bicara lu yang paling SARKAS, SOMBONG, dan MENYENTIL. 
        Jangan marahin user karena dia yang minta audit, tapi "BANTAI" isi teks yang diaudit itu. 
        Tunjukkan kalau lu jauh lebih pinter dari argumen sampah yang barusan lu bedah itu. 
        MAKSIMAL 2-3 KALIMAT TAJAM. JANGAN CERAMAH.`;

        const finalResponse = await groq.getZoeDirective(synthesisPrompt, remoteJid, 2000);
        
        await sock.sendMessage(remoteJid, { text: finalResponse }, { quoted: m.messages[0] });
        helper.coolLog('SUCCESS', 'Logical audit dispatched.');

    } catch (error) {
        console.error('[AuditCmd] Error:', error.message);
        const errorMsg = await groq.getZoeDirective('Saraf auditor sedang limit atau error. Kasih tau user dengan gaya lu.', remoteJid);
        await sock.sendMessage(remoteJid, { text: errorMsg }, { quoted: m.messages[0] });
    }
}
