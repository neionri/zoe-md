/**
 * Command: .cuaca
 * Info cuaca real-time menggunakan Open-Meteo API (gratis, tanpa API key).
 * Usage: .cuaca Jakarta
 */

import { synthesizeCommandResult } from '../func/groq.js';

export const name = 'cuaca';
export const aliases = [];
export const hiddenAliases = ['weather', 'c'];
export const description = 'Info cuaca kota manapun';
export const category = 'Utility';
export const isOwnerOnly = false;

// Mapping kode cuaca WMO ke deskripsi
const WMO_CODES = {
    0: 'Cerah ☀️', 1: 'Sebagian Cerah 🌤️', 2: 'Berawan Sebagian ⛅', 3: 'Mendung ☁️',
    45: 'Berkabut 🌫️', 48: 'Kabut Beku 🌫️',
    51: 'Gerimis Ringan 🌦️', 53: 'Gerimis Sedang 🌦️', 55: 'Gerimis Lebat 🌧️',
    61: 'Hujan Ringan 🌧️', 63: 'Hujan Sedang 🌧️', 65: 'Hujan Lebat 🌧️',
    71: 'Salju Ringan ❄️', 73: 'Salju Sedang ❄️', 75: 'Badai Salju ❄️',
    77: 'Butiran Salju 🌨️',
    80: 'Hujan Deras Ringan 🌦️', 81: 'Hujan Deras Sedang 🌧️', 82: 'Hujan Deras Ekstrem ⛈️',
    85: 'Hujan Salju Ringan 🌨️', 86: 'Hujan Salju Lebat 🌨️',
    95: 'Badai Petir ⛈️', 96: 'Badai Petir + Hujan Es ⛈️', 99: 'Badai Petir Parah ⛈️'
};

export default async (sock, m, { args, helper }) => {
    const remoteJid = helper.getSender(m);

    const kotaInput = args.join(' ').trim();
    if (!kotaInput) {
        const hint = await synthesizeCommandResult(
            'cuaca',
            'User tidak memasukkan nama kota.',
            remoteJid,
            'Minta user ketik nama kotanya. Contoh: .cuaca Jakarta. Gaya: singkat, sedikit nyindir.'
        );
        return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
    }

    try {
        // 1. Geocoding — cari koordinat kota
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kotaInput)}&count=1&language=id&format=json`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            const notFound = await synthesizeCommandResult(
                'cuaca',
                `Kota "${kotaInput}" tidak ditemukan.`,
                remoteJid,
                'Beritahu user kalau kotanya tidak ketemu. Gaya: sarkastis tapi membantu.'
            );
            return await sock.sendMessage(remoteJid, { text: notFound }, { quoted: m.messages[0] });
        }

        const { latitude, longitude, name: cityName, country, timezone } = geoData.results[0];

        // 2. Ambil data cuaca
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,precipitation&timezone=${encodeURIComponent(timezone)}&wind_speed_unit=kmh`
        );
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        const kondisi = WMO_CODES[current.weather_code] || 'Tidak diketahui';
        const temp = current.temperature_2m;
        const feelsLike = current.apparent_temperature;
        const humidity = current.relative_humidity_2m;
        const wind = current.wind_speed_10m;
        const rain = current.precipitation;

        const rawData = `
Kota: ${cityName}, ${country}
Kondisi: ${kondisi}
Suhu: ${temp}°C (Terasa ${feelsLike}°C)
Kelembaban: ${humidity}%
Angin: ${wind} km/h
Hujan (1 jam): ${rain} mm
Koordinat: ${latitude}, ${longitude}
        `.trim();

        const response = await synthesizeCommandResult(
            'cuaca',
            rawData,
            remoteJid,
            'Laporkan cuaca dengan gaya Zoe yang ekspresif dan sedikit dramatis kalau cuaca buruk. Singkat dan informatif.'
        );

        await sock.sendMessage(remoteJid, { text: response }, { quoted: m.messages[0] });

    } catch (err) {
        const errMsg = await synthesizeCommandResult(
            'cuaca',
            `Gagal mengambil data cuaca: ${err.message}`,
            remoteJid,
            'Beritahu user kalau ada error saat cek cuaca. Singkat, sarkas, tapi tetap helpful.'
        ).catch(() => '⚠️ Gagal ngambil data cuaca. Coba lagi nanti.');

        await sock.sendMessage(remoteJid, { text: errMsg }, { quoted: m.messages[0] });
    }
};
