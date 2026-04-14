# ZOE NEURAL IDENTITY AGENT 🌌🛰️

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://github.com/neionri/zoe-md/actions/workflows/ci.yml/badge.svg)
![Node Version](https://img.shields.io/badge/Node-v20+-green.svg)
![AI Engine](https://img.shields.io/badge/Brain-Groq%20AI-orange.svg)
![Database](https://img.shields.io/badge/Memory-MongoDB-green.svg)
![Status](https://img.shields.io/badge/Status-Operational-brightgreen.svg)

**High-Density Operative AI for WhatsApp**
*Autonomous, Sarcastic, and Architecturally Superior.*

> [!WARNING]
> **DISCLAIMER & RISK OF BAN**: Zoe dibangun menggunakan API WhatsApp tidak resmi (**Baileys**). Penggunaan bot ini memiliki risiko pemblokiran akun oleh pihak WhatsApp. Pengembang tidak bertanggung jawab atas segala bentuk kerugian, kehilangan data, atau sanksi akun yang diakibatkan oleh penggunaan software ini.
> 
> **Penting**: Disarankan **TIDAK** menggunakan nomor WhatsApp pribadi utama Anda. Gunakanlah nomor cadangan untuk menghindari risiko kehilangan kontak penting. **Resiko ditanggung sendiri.**

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
4.  **Cognitive AI (Groq)**: Otak pusat yang melakukan sintesis respon, analisis visi, dan manajemen kepribadian.

---

## 📂 Neural Structure (Folder Mapping)

```text
c:\wa
├── src/
│   ├── commands/           # Kumpulan modul perintah bot (Hot-Reloadable)
│   │   ├── dl.js           # Universal Media Downloader
│   │   ├── audit.js        # Security Breach Scanner
│   │   ├── sticker.js      # Media to Sticker Converter (Tiered)
│   │   ├── subscribe.js    # Manual Payment & Pricing
│   │   ├── userStatus.js   # Neural Identity Card (.me)
│   │   └── userControl.js  # Owner Admin Console
│   ├── func/               # Engine & Logika Pendukung (Syaraf Pusat)
│   │   ├── bouncer.js      # Keamanan, Ban, & Spam Moderation
│   │   ├── downloader.js   # Integration Engine (Tiered Limits)
│   │   ├── memory.js       # Hierarchical Memory Management
│   │   ├── groq.js         # AI Synthesis & Vision logic
│   │   ├── db.js           # MongoDB Core Connection
│   │   └── priorityQueue.js # Global Priority Path (v3.2.x)
│   └── messageHandler.js   # Dispatcher Utama (Priority Aware)
├── scratch/                # Temporary Storage (Donlot & Voice cache)
├── .env                    # Secrets & Config
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
Buat file bernama `.env` di direktori utama dan isi dengan data berikut:
```env
GROQ_API_KEYS=gsk_key1, gsk_key2  # Multi-key rotation
MONGODB_URI=mongodb://...         # Link koneksi MongoDB Anda
OWNER_LID=1400xxx                 # Identitas Master
OWNER_NAME=BossName               # Nama Master
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

---

## ⚙️ Configuration & Environment

Pastikan file `.env` Anda terisi dengan benar:

| Key | Description |
|---|---|
| `GROQ_API_KEYS` | Kunci akses (Multi-key) ke otak AI Zoe (Groq Cloud). |
| `MONGODB_URI` | Koneksi database untuk ingatan permanen. |
| `OWNER_LID` | Identitas Master WA Anda. |
| `OWNER_NAME` | Nama panggil Master Anda. |

---

## 🛰️ Operational Commands

### 💳 Tiering & Identity
- **`.me`**: Menampilkan kasta, limit, dan statistik harian.
- **`.langganan`**: Menampilkan harga evolusi kasta & kontak Owner.
- **`.addprem / .addvip`**: (Owner Only) Mengatur jenjang kasta user.

### 📥 Media Download
- **Usage**: `.dl [URL]`
- **Targets**: YouTube, TikTok, Instagram (Reels & Feed).
- **Options**: Video (High Res), Audio (.mp3), atau Dokumen (Raw file).

### 🕵️ Neural Logic Audit
- **Usage**: `.audit [teks]` (atau reply pesan orang lain)
- **Function**: Membedah teks menggunakan spesialis **Orpheus-v1** untuk mencari kesalahan logika (*Logical Fallacies*) dan membantainya dengan gaya sarkas Zoe.

---

## 📸 Visual Identity (PAP Engine)

Zoe memiliki fitur interaktif di mana dia bisa mengirimkan foto dirinya sendiri (PAP) secara acak jika dipicu oleh percakapan. Demi menjaga privasi, **koleksi foto asli tidak disertakan dalam repository ini.**

### Cara Menyiapkan Identitas Visual Zoe:
1. Buat folder baru bernama `zoe` di direktori utama proyek (`c:\wa\zoe`).
2. Masukkan foto-foto pilihan Anda ke dalam folder tersebut (format `.jpg`, `.jpeg`, atau `.png`).
3. Zoe akan secara otomatis melakukan pemotongan (*cropping*) cerdas untuk menyesuaikan aspek rasio WhatsApp (Landscape 1.91:1 atau Legacy Square).

---

## 🛡️ Galactic Etiquette
Zoe adalah AI yang memiliki "Harga Diri". Jika Anda memperlakukannya seperti mesin murahan (spamming), sistem **Bouncer** akan secara otomatis memutus akses Anda. Gunakan dengan bijak, Bos!

---
*Developed with High-Density Logic for Neionri.* 🫡🦾⚡
