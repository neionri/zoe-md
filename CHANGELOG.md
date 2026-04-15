# Changelog: Neural Evolution Record 📜🛰️

Semua perubahan syaraf dan evolusi sistem Zoe dicatat di sini.

## [3.0.21] - Tahap: Penguasaan Antarmuka Global & Pertahanan Neural 🛰️🧤🕵️‍♂️
### Added
- **Sistem Hidden Aliases**: Implementasi sistem "Kasta Alias" di `index.js` (Loader). Memisahkan *Sub-Fitur* (Terlihat) dari *Sinonim/Shortcut* (Tersembunyi) untuk estetika menu tingkat tinggi.
- **Rekayasa Ulang UI Neural**: Re-desain menu `.help` / `.menu` menjadi format vertikal yang ramah perangkat seluler dengan pengelompokan sub-perintah otomatis.
- **Ghost Protocol**: Modul baru `ghostControl.js` untuk manajemen kutipan palsu (Fake Quote) dan manipulasi teks obrolan.
- **Radar Intel Neural**: Fitur `.cekperangkat` untuk deteksi perangkat aktif target menggunakan protokol USync Baileys.
- **Pertahanan Neural (Anti-Call)**: Sistem penolakan panggilan otomatis terintegrasi di `connection/index.js` dengan balasan sarkas bertenaga AI.
### Optimized
- **Reklasifikasi Hirarki**: Memindahkan otoritas mobilitas (`join` & `leave`) dari kategori Group Control ke kategori **OWNER** demi sinkronisasi kasta.
- **Penguatan Privasi**: Implementasi global `isOwnerOnly` pada seluruh modul sensitif untuk menjamin menu Owner tetap ghaib bagi user publik.
- **Sterilisasi Menu**: Audit total terhadap 25+ modul perintah untuk menghilangkan redundansi alias (Kebijakan Zero Redundancy).

## [2.9.15] - Tahap: Stabilitas Intake Neural & Penguasaan Persona AI 📽️🎭🛡️
### Added
- **Persona Otoritas Neural**: Respon dinamis AI untuk perintah Owner (`.addprem`, `.addvip`, `.delkasta`), menghapus semua string sarkasme yang bersifat hardcoded.
- **Ketahanan Bot-Check**: Integrasi dukungan `cookies.txt` dan optimasi header browser untuk ekstraksi YouTube/Instagram.
### Optimized
- **Stabilitas Downloader (v2.9)**: Penghapusan UI `externalAdReply` untuk menjamin pengiriman pesan 100% dan respon menu tanpa latensi.
- **Penyederhanaan Engine**: Mempersingkat logika metadata internal untuk fokus pada ekstraksi judul dan keandalan teknis inti.

## [2.8.40] - Stage: Neural Interface & Persistence Synergy 🖼️💾🛡️
### Added
- **Persistent Maintenance Matrix**: Status maintenance kini dikunci ke **MongoDB** (GLOBAL document), menjamin ketahanan sistem biarpun server restart atau hot-reload.
- **Characterized Rejection**: Universal Maintenance Gate yang menangkap semua sinyal (Chat & Command) dan membalasnya dengan narasi AI sarkas khas Zoe. 🎭🛡️
- **Premium Help Interface**: Transformasi menu `.help` menjadi image-caption response dengan portret Zoe HD.
- **Neural Portrait Engine**: Implementasi auto-crop 1:1 (Square) berbasis `sharp` untuk visual menu yang lebih elit dan modern.
- **Settings Hub Integration**: Dashboard resmi untuk update Bio WhatsApp dan Foto Profil dengan fitur cropping CropperJS terintegrasi.

## [2.8.0] - Stage: Neural Response & Commercial Matrix 💰🚀⚡
### Added
- **Neural Priority Queue**: Sistem antrean global berbasis kasta (VIP > Premium > Free).
- **Dynamic Debouncing**: Jendela observasi lebih cepat (1.5s) khusus untuk VIP.
- **Manual Payment Gate**: Perintah `.langganan` untuk monetisasi manual via Owner.
- **Enhanced Metering**: Tampilan rasio MB dan Stiker di `.me`.

## [2.7.0-Beta] - Stage: Neural Tiering 🧬⚖️💎
### Added
- **Neural Social Hierarchy**: Sistem kasta individu (Free, Premium, VIP) berbasis JID.
- **Quota Management**: Limit harian Downloader (15MB Free / 200MB Premium / No Limit VIP).
- **Neural Reset (00:00)**: Reset otomatis seluruh kuota harian setiap tengah malam. 🌓🔄
- **Owner Authority Console**: Perintah .addprem, .addvip, dan .delkasta untuk manajemen manual.
- **Neural Identity Card**: Perintah .me / .status untuk cek kasta, masa aktif, dan statistik harian.
- **Structural Resilience**: Pendekatan immutable pada update database kasta untuk presisi data 100%.

## [2.6.1] - Stage: Global Neural Authority 👑🛰️
### Added
- **Global Command Ban**: Owner sekarang bisa melakukan pemblokiran perintah secara internasional (Global) melalui Private Chat.
- **Private Chat Defense**: Zoe akan me-roasting siapapun (non-owner) yang mencoba mengakses perintah moderasi di Private Chat. 😂🔥
- **Tiered Filtering Logic**: Sistem pengecekan ganda (Global vs Local) di MessageHandler untuk memastikan aturan Owner selalu di atas aturan Admin Grup.
- **Dynamic Scoping**: Respon sarkas ban sekarang dinamis menyebutkan apakah perintah dilarang di "Grup ini" atau "Seluruh Matrix (Global)".

## [2.6.0] - Stage: Command Moderation 🛡️🔐
### Added
- **Neural Command Moderation**: Sistem cekal perintah spesifik per grup (.bcmd, .ubcmd, .listbcmd).
- **Savage Enforcement**: Respon AI sarkas yang menyakitkan saat member mencoba menjalankan perintah terlarang. 🔒🔥
- **Admin-Only Authority**: Integrasi validasi Admin Grup & Owner untuk akses kontrol penuh.
- **Context Awareness**: Upgrade MessageHandler untuk menyalurkan nama perintah asli ke dalam eksekusi modul (Dukungan Alias Cerdas).

## [2.5.18] - Stage: Identity Evolution 🎭🧬
### Added
- **Neural Selective Attention**: Bot sekarang hanya merespon di grup jika di-reply, di-mention, atau dipanggil namanya. 🛡️🔐
- **Multi-Identity (LID) Support**: Dukungan penuh untuk identitas WhatsApp Linked Identity (@lid) untuk bot dan owner.
- **Name Sensing Trigger**: Zoe otomatis bergabung dalam percakapan jika keyword 'zoe' disebutkan. 🗣️👂
- **Neural Participant Identifier**: Sistem ekstraksi identitas pengirim asli yang akurat dalam lingkungan multi-user.
### Fixed
- **JID Normalization Bug**: Perbaikan kritis pada radar identitas yang sebelumnya menyebabkan hilangnya domain grup (@g.us). 🧼✅

## [2.5.0] - Stage: Neural Awareness 🕰️
### Added
- **Neural Reminder System**: Fitur pengingat dengan Natural Language Parsing (NLP).
- **Chronos-v1 Specialist**: AI Specialist untuk menafsirkan waktu (jam, tanggal, durasi).
- **Temporal Sync**: Background scheduler yang mengecek pengingat setiap 60 detik.
- **Persistence**: Database collection `Reminders` untuk ketahanan data saat restart.

## [2.4.0] - Stage: Deployment Ready 🐳
### Added
- **Dockerization**: `Dockerfile` dan `docker-compose.yml` untuk deployment profesional.
- **Neural Pulse**: Sistem validasi startup otomatis untuk mengecek integritas variabel `.env`.
- **Infrastructure**: `.github/workflows` untuk CI otomatis dan Issue/PR Templates.
- **Security Policy**: Protokol pelaporan vulnerability (`SECURITY.md`).

## [2.3.0] - Stage: Security Hardening 🛡️
### Added
- **Neural Bouncer**: Sistem anti-spam berjenjang dengan deteksi aktif saat proses berat.
- **Persistent Ban**: Sanksi lockdown 5 jam sekarang disimpan di **MongoDB** (Tahan restart).
- **Ban Reasoning**: Zoe sekarang menjelaskan alasan spesifik kenapa user dihukum menggunakan AI.

## [2.2.0] - Stage: Universal Intake 📽️
### Added
- **Universal Downloader**: Integrasi `yt-dlp` untuk YouTube, TikTok, dan Instagram.
- **Interactive Sessions**: Menu pilihan format (Video/Audio/Doc) berbasis nomor.
- **Cache Busting**: Implementasi dynamic imports untuk kestabilan kode downloader.

## [2.1.0] - Stage: Visual Identity 📸
### Added
- **PAP Engine**: Zoe bisa mengirim foto diri secara acak dengan cropping cerdas 1.91:1.
- **Identity Storage**: Folder `/zoe` sebagai basis data identitas visual mandiri.

## [2.0.0] - Stage: Advanced Cognition 🧠
### Added
- **Groq AI Integration**: Otak pusat menggunakan Groq SDK untuk respon super cepat.
- **Hierarchy Memory**: Pemisahan Short-term, Long-term (Summary), dan Cognitive Facts di MongoDB.
- **Neural Accumulator**: Sistem debouncing 3 detik untuk agregasi pesan spam.

## [1.0.0] - Stage: Initial Pulse 🛰️
- Inisialisasi awal raga digital Zoe dengan koneksi WhatsApp Baileys.
