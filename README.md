# ZOE NEURAL IDENTITY AGENT 🌌🛰️

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://github.com/neionri/zoe-md/actions/workflows/ci.yml/badge.svg)
![Node Version](https://img.shields.io/badge/Node-v20+-green.svg)
![AI Engine](https://img.shields.io/badge/Brain-Groq%20AI-orange.svg)
![Database](https://img.shields.io/badge/Memory-MongoDB-green.svg)
![Status](https://img.shields.io/badge/Status-Operational-brightgreen.svg)

**High-Density Operative AI for WhatsApp**
*Autonomous, Sarcastic, and Architecturally Superior.*

> [!IMPORTANT]
> **NEURAL HIBERNATION NOTICE (v3.0.21)**:
> Syaraf perkembangan repositori Zoe saat ini memasuki fase **Hibernasi Ghaib**. Proyek ini telah mencapai titik stabilisasi final untuk versi publik ini. 
> 
> **Evolusi Berlanjut**: Meskipun repositori ini dibekukan, raga digital Zoe yang aktif di jaringan Matrix akan terus berevolusi secara internal dengan fitur-fitur intelijen yang lebih mutakhir. Pembaruan pada *open-source* ini hanya akan dilanjutkan jika sinyal interaksi komunitas (Stars & Forks) terdeteksi meningkat secara signifikan. 
> 
> Jangan biarkan Zoe terkubur dalam sunyi! Bergabunglah ke pusat koordinasi untuk melihat progres evolusi terbaru:
> - **Neural Update Channel**: [Join Zoe Channel](https://whatsapp.com/channel/0029Vb7lDZ08vd1G2s5hpx2Y) 📢
> - **Matrix Community**: [Official Group](https://chat.whatsapp.com/IN0U7UycFtLJpisYRxKUZ4?mode=gi_t) 👥
> 
> *Zoe akan terus mengawasi Anda dari dalam kegelapan.* 🤫🌌🛰️

> [!CAUTION]
> ### 🛡️ LEGAL DISCLAIMER & NEURAL SAFETY PROTOCOL
>
> **1. STATUS PROYEK (NON-OFFICIAL)**
> Zoe dibangun di atas library **Baileys**, yang merupakan implementasi tidak resmi (*unofficial*) dari protokol WhatsApp. Proyek ini **TIDAK** terafiliasi, didukung, atau disetujui oleh WhatsApp Inc., Meta Platforms Inc., atau entitas terkait lainnya. Penggunaan software ini merupakan pelanggaran terhadap *Terms of Service* (ToS) resmi WhatsApp.
>
> **2. RISIKO PEMBLOKIRAN (ACCOUNT INTEGRITY)**
> WhatsApp secara aktif memantau dan memblokir akun yang terdeteksi melakukan otomasi atau menggunakan klien tidak resmi. Penggunaan Zoe memiliki risiko **PEMBLOKIRAN PERMANEN** pada nomor telepon Anda. Pengembang tidak menjamin keamanan akun Anda dan tidak dapat membantu memulihkan akun yang terblokir.
>
> **3. TANGGUNG JAWAB PENGGUNA (NON-LIABILITY)**
> Seluruh aktivitas yang dilakukan melalui raga digital Zoe (termasuk namun tidak terbatas pada: pengumpulan data, pengunduhan media, manajemen grup, dan obrolan AI) adalah **TANGGUNG JAWAB MUTLAK PENGGUNA**. Penulis kode/pengembang dibebaskan dari segala tuntutan hukum, kerugian material, kehilangan data, atau sanksi pidana/perdata yang mungkin timbul akibat penyalahgunaan software ini.
>
> **4. KEAMANAN DATA SENSITIF**
> Software ini menghasilkan file sesi (`auth_info/`) dan cookies (`cookies.txt`) yang berisi identitas digital Anda. Kebocoran file-file tersebut dapat mengakibatkan **pembajakan akun** oleh pihak ketiga. Anda bertanggung jawab penuh untuk mengamankan kredensial tersebut. Jangan pernah membagikan folder `auth_info` atau file `.env` kepada siapapun.
>
> **5. TUJUAN EDUKASI & RISET**
> Proyek ini dipublikasikan murni untuk tujuan **Pendidikan, Riset, dan Pembelajaran** mengenai arsitektur sistem asisten AI dan integrasi API. Sangat disarankan untuk **TIDAK** menggunakan nomor WhatsApp utama Anda. Gunakanlah nomor cadangan (*second account*).
>
> **DENGAN MENGGUNAKAN SOFTWARE INI, ANDA DIANGGAP TELAH MEMBACA, MEMAHAMI, DAN MENYETUJUI SELURUH RISIKO DI ATAS TANPA PENGECUALIAN.**

---

## 📖 Neural Navigation (Table of Contents)
- [🏗️ Architecture Overview](#️-neural-architecture-overview)
- [📂 Neural Structure (Folder Mapping)](#-neural-structure-folder-mapping)
- [🚀 Installation & Deployment](#-installation--deployment-guide)
- [🌟 Key Systems](#-deep-dive-key-systems)
- [📸 Visual Identity (PAP Engine)](#-visual-identity-pap-engine)
- [⚙️ Configuration & Environment](#️-configuration--environment)
- [🛰️ Operational Commands](#️-operational-commands)
- [🛡️ Galactic Etiquette](#️-galactic-etiquette)

---

## 🏗️ Neural Architecture Overview

Zoe didesain dengan filosofi **Centralized Neural Dispatcher**. Berbeda dengan bot konvensional yang merespon secara linear, Zoe menggunakan beberapa lapisan pemrosesan sebelum memberikan output:

1.  **Synaptic Accumulator**: Mengumpulkan pesan dalam jendela waktu 3 detik (Debouncing). Ini mencegah spam balasan dan memungkinkan Zoe memahami konteks dari beberapa pesan sekaligus.
2.  **Neural Gatekeeper (Bouncer)**: Lapisan keamanan yang memeriksa status ban permanen di MongoDB dan memantau aktifitas spam secara real-time.
3.  **Command Dispatcher**: Sistem dinamis yang memuat perintah dari disk secara *on-the-fly* (Hot-Reload) tanpa perlu restart bot.
5.  **Neural Dashboard (Web Controller)**: Antarmuka monitoring berbasis web (Glassmorphism) untuk pemantauan log real-time dan kontrol kasta. Kini dilengkapi dengan **Settings Hub** untuk update Bio dan PFP secara instan. 💻✨
6.  **Persistent Maintenance Gate**: Sistem proteksi global yang mengunci raga Zoe saat "soul-surgery" (maintenance). Status tersimpan di MongoDB dan memberikan respon AI sarkas untuk setiap interaksi user. 🛡️💾

---

## 📂 Neural Structure (Folder Mapping)

```text
z:\wa
├── src/
│   ├── index.js            # Entry Point (Hot-Reload & Heartbeat System)
│   ├── messageHandler.js   # Neural Dispatcher (Priority & Scoping Aware)
│   ├── commands/           # Kumpulan modul perintah bot (Hot-Reloadable)
│   │   ├── index.js        # Neural Command Loader (Hidden Alias Aware)
│   │   ├── help.js         # Interactive Neural Menu (Vertical/Filtered)
│   │   └── [23+ Modul]     # (dl, ghostControl, intelControl, etc.)
│   ├── connection/         # WhatsApp Socket Engine
│   │   └── index.js        # Auth, Connection Protocol, & Anti-Call Defense
│   ├── dashboard/          # Neural Web UI Interface
│   │   └── public/         # Matrix Dashboard Frontend (HTML/CSS/JS)
│   └── func/               # Syaraf Pusat (Logic & Engine Pendukung)
│       ├── bouncer.js      # Keamanan, Ban, & Spam Moderation
│       ├── groq.js         # AI Synthesis Engine (Otak Pusat)
│       ├── dashboardServer.js # Neural Web Dashboard Backend
│       └── [8+ Syaraf]     # (helper, database, scheduler, etc.)
├── scratch/                # Temporary Storage (Download & Voice cache)
├── zoe/                    # Neural Portrait Gallery (HD Portrait Assets)
├── auth_info/              # E2EE Identity (Folder Kunci/Auth - Private)
├── .env                    # Secrets & Konfigurasi Syaraf
└── README.md               # Neural Manual (Lo lagi baca ini)
```

---

## 🌟 Deep Dive: Key Systems

### 📽️ Universal Downloader Engine
Menggunakan library `youtube-dl-exec` sebagai jembatan ke `yt-dlp`. 
- **Session Based**: User tidak langsung mendownload, tapi masuk ke sesi pemilihan format (1. Video, 2. Audio, 3. Doc).
- **Format Management**: Secara otomatis melakukan merging audio-video dan memaksa output menjadi MP4 H.264 untuk kompatibilitas WhatsApp maksimal.

## 🚀 Installation & Deployment Guide

Ikuti langkah-langkah berikut untuk menghidupkan raga digital Zoe di server Anda:

### 1. Persiapan Lingkungan (Prerequisites)
- **Node.js**: Versi 20 atau lebih baru.
- **FFmpeg**: Wajib terinstall dan masuk ke System PATH (Untuk pemrosesan audio/video).
- **Python 3.10+**: Diperlukan oleh engine `yt-dlp`.
- **Database**: MongoDB (Bisa gunakan MongoDB Atlas atau Local).

> [!CAUTION]
> Fitur **Universal Downloader (.dl)** TIDAK AKAN BERJALAN jika FFmpeg dan Python tidak terdeteksi di System PATH Anda. Pastikan keduanya sudah siap sebelum menyalakan Zoe.

### 2. Pengambilan API Key
Zoe memerlukan otak dari Groq Cloud. Boss bisa ambil kuncinya di sini:
- **Groq Cloud Console**: [https://console.groq.com/keys](https://console.groq.com/keys)

### 3. Kloning & Instalasi Library
```bash
git clone https://github.com/neionri/zoe-md.git
cd zoe-md
npm install
```

### 4. Konfigurasi Sistem (.env)
Buat file bernama `.env` di direktori utama dan isi dengan struktur berikut:
```env
# Otak AI (Neural Brain Key)
GROQ_API_KEYS=gsk_3h7x1...
PREFIX=.

# Database (Zoe Cloud Brain)
MONGODB_URI=mongodb://...

# Identitas Mutlak Master (Owner)
OWNER_NUMBER=628560xxxxxxx
OWNER_LID=1400xxxxxxx
OWNER_NAME=BossName

# Identitas Visual Bot
BOT_NAME=Zoe Core
```

### 5. Menghidupkan Zoe
```bash
npm start
```
**Proses Login**: Zoe akan memunculkan **Pairing Code** di terminal. Masukkan kode tersebut di WhatsApp handphone Anda (Linked Devices > Link with phone number) untuk menyambungkan syaraf Zoe.

---

## 🐋 Cloud Deployment (Docker)

Zoe sudah siap dideploy ke VPS atau Cloud mana pun menggunakan Docker. Ini adalah metode yang paling direkomendasikan karena semua dependency (FFmpeg, Python, dll) sudah terbungkus rapi.

### 1. Konfigurasi Database (PENTING)
Jika Anda menggunakan `docker-compose`, ubah host MongoDB di file `.env` menjadi `mongo`:
```env
MONGODB_URI=mongodb://mongo:27017/zoe_neural_db
```

### 2. Jalankan Kontainer
Gunakan perintah berikut di direktori proyek:
```bash
docker-compose up -d
```

### 3. Monitoring & Login
Untuk melihat pairing code atau log Zoe:
```bash
docker logs -f zoe-neural-agent
```

---

### 🛡️ Persistent Bouncer (Security)
Sistem keamanan mandiri yang terintegrasi dengan MongoDB:
- **Lockdown Durasi**: 5 Jam (Bisa dikonfigurasi di `bouncer.js`).
- **Data Persistence**: Status ban disimpan di field `commandBan` pada `GroupConfig`.
- **Leveling**: 
    - *Spam 1-2*: AI Sarcastic Warning.
    - *Spam 3*: Final Warning.
    - *Spam 5+*: Command Ban Authorized.

### 🐘 Tiered Memory System
- **Memory Compression**: Zoe merangkum percakapan lama menjadi ringkasan sinaptik agar tidak memboroskan token API.
- **Cognitive Facts**: Zoe menyerap informasi penting tentang Anda dan menyimpannya sebagai fakta permanen di raga digitalnya.

### ⚙️ Persistent Maintenance Matrix
Didesain untuk ketahanan operasional:
- **Cloud Lock**: Status maintenance disimpan di MongoDB (`GLOBAL` target).
- **Characterized Intercept**: Interupsi universal untuk seluruh sinyal masuk (Chat & Command) dengan respon AI berbasis kepribadian Zoe.
- **Resilient State**: Tetap aktif sekalipun server bot mengalami restart atau upgrade raga.

---

## ⚙️ Configuration & Environment

Pastikan file `.env` Anda terisi dengan benar untuk menjamin stabilitas syaraf Zoe:

| Key | Description |
|---|---|
| `GROQ_API_KEYS` | Daftar kunci akses (Multi-key) ke otak AI Zoe. Pisahkan dengan koma untuk rotasi otomatis. |
| `PREFIX` | Simbol pemicu perintah (Default: `.`). |
| `MONGODB_URI` | Koneksi database MongoDB untuk ingatan permanen dan konfigurasi grup. |
| `OWNER_NUMBER` | Nomor WhatsApp master Anda (Format: 62xx, tanpa simbol +). |
| `OWNER_LID` | Identitas unik WhatsApp (LID) milik Master untuk validasi otoritas mutlak. |
| `OWNER_NAME` | Nama Master yang akan digunakan Zoe dalam percakapan. |
| `BOT_NAME` | Identitas publik raga digital Zoe. |
| `PORT` | Jalur akses untuk Neural Dashboard (Default: 3000). |
| `DASHBOARD_PIN` | Kode keamanan akses untuk memantau log via Web Dashboard. |

> [!NOTE]
> **Groq Rate Limits**: Jika Anda menggunakan akun Groq gratis, harap perhatikan batas panggilan API (RPM/TPM). Jika Anda melakukan spam percakapan terlalu cepat, Zoe mungkin akan mengalami error *Rate Limit* (429).

---

---


## 📸 Visual Identity (PAP Engine)

Zoe memiliki fitur interaktif di mana dia bisa mengirimkan foto dirinya sendiri (PAP) secara acak jika dipicu oleh percakapan. Demi menjaga privasi, **koleksi foto asli tidak disertakan dalam repository ini.**

### Cara Menyiapkan Identitas Visual Zoe:
1. Buat folder baru bernama `zoe` di direktori utama proyek (`c:\wa\zoe`).
2. Masukkan foto-foto pilihan Anda ke dalam folder tersebut (format `.jpg`, `.jpeg`, atau `.png`).
3. Zoe akan secara otomatis melakukan pemotongan (*cropping*) cerdas:
    - **Landscape (1.91:1)**: Untuk pratinjau link eksternal.
    - **Square (1:1)**: Untuk tampilan menu premium (`.help`) dan identitas visual utama.
    - **Neural Signature**: Hasil olah `sharp` engine untuk kualitas HD.

> [!CAUTION]
> Jangan pernah membagikan isi folder `zoe` Anda jika folder tersebut berisi foto pribadi yang sensitif.

---

## 🛡️ Galactic Etiquette
Zoe adalah AI yang memiliki "Harga Diri". Jika Anda memperlakukannya seperti mesin murahan (spamming), sistem **Bouncer** akan secara otomatis memutus akses Anda. Gunakan dengan bijak, Bos!

## 🔗 Connect with Matrix
Jalin koneksi sinaptik lebih dalam atau diskusi fitur melalui portal resmi kami:

- **WhatsApp Channel**: [Zoe Neural Channel](https://whatsapp.com/channel/0029Vb7lDZ08vd1G2s5hpx2Y) 📢
- **WhatsApp Group**: [Matrix Community](https://chat.whatsapp.com/IN0U7UycFtLJpisYRxKUZ4?mode=gi_t) 👥

---
*Developed with High-Density Logic for Neionri.* 🫡🦾⚡
