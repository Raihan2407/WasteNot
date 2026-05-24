<div align="center">

# 🍳 WasteNot
### Ubah Sisa Jadi Sajian — *Your fridge has stories. Let AI cook them.*

[![Live App](https://img.shields.io/badge/🌐_Live_App-WasteNot-1a6b3c?style=for-the-badge)](https://wastenot-478604489147.asia-southeast1.run.app)
[![Built with Gemini](https://img.shields.io/badge/Built_with-Google_Gemini_AI-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![Cloud Run](https://img.shields.io/badge/Deployed_on-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/run)
[![JuaraVibeCoding](https://img.shields.io/badge/%23JuaraVibeCoding-2026-orange?style=for-the-badge)](https://goo.gle/juaravibecoding)

**Indonesia membuang 20 juta ton makanan per tahun — senilai Rp551 triliun.**
WasteNot hadir untuk mengubah sisa bahan makanan di kulkasmu menjadi resep 
masakan Nusantara yang lezat, sekaligus menghitung dampak nyata untuk bumi.

[🚀 Coba Sekarang](https://wastenot-478604489147.asia-southeast1.run.app) · 
[📹 Demo Video](#) · [👨‍💻 Tentang Pembuat](#-tentang-pembuat)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📷 **AI Vision Detection** | Foto bahan kulkas → Gemini AI deteksi otomatis |
| 🍳 **Resep Nusantara** | Filter regional: Jawa, Sumatra, Bali, Sulawesi |
| 🌍 **Impact Tracker** | Hitung rupiah dihemat, CO2 dikurangi, pohon setara |
| 📄 **PDF Export** | Simpan resep sebagai PDF branded dalam 1 klik |
| 🚨 **Mode Darurat Kulkas** | Prioritaskan bahan yang mau expired |
| ✨ **Vibe Masak** | Sesuaikan resep dengan mood memasak hari ini |
| 🔐 **Google Auth** | Login dengan Google via Firebase Authentication |
| 🌙 **Dark Mode** | Tampilan gelap yang nyaman di malam hari |
| 🌍 **Bilingual** | Dukungan penuh Bahasa Indonesia & English |

---

## 🎯 Masalah yang Diselesaikan
Indonesia membuang 20–48 juta ton makanan per tahun
= Rp213–551 triliun terbuang sia-sia
= 7.29% kontribusi emisi gas rumah kaca nasional
= 115–184 kg per orang per tahun
Sumber: Bappenas 2021 · UNEP 2025

WasteNot mengatasi ini dengan cara yang sederhana:
**Foto → Deteksi → Resep → Masak → Dampak Nyata**

---
Frontend    : TypeScript + React + Vite
AI Engine   : Google Gemini 1.5 Flash (Vision + Text)
Auth        : Firebase Authentication (Google OAuth)
Database    : Cloud Firestore
Deployment  : Google Cloud Run (asia-southeast1)
Build Tool  : Google AI Studio
PDF Export  : jsPDF
---

## 🚀 Cara Menjalankan Secara Lokal

### Prerequisites
- Node.js v18+
- Gemini API Key ([Dapatkan di sini](https://aistudio.google.com/apikey))
- Firebase Project ([Setup di sini](https://console.firebase.google.com))

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/Raihan2407/WasteNot.git
cd WasteNot

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Isi GEMINI_API_KEY dan Firebase config di .env.local

# 4. Jalankan development server
npm run dev

# 5. Buka di browser
# http://localhost:5173
```

---

## 📊 Cara Kerja
User foto bahan kulkas
↓
Gemini Vision AI analisa gambar
↓
Deteksi semua bahan otomatis
↓
Generate 2 resep Nusantara
↓
User masak & klik "Selesai"
↓
WasteNot hitung dampak nyata
(Rp dihemat + CO2 dikurangi + Pohon setara)
↓
Simpan ke Firestore + Export PDF
---

## 🌿 Dampak Nyata

Setiap kali user menyelesaikan satu resep di WasteNot:

- 💰 **Rp 4.000 – 20.000** dihemat per masakan
- 🌍 **0.1 – 0.5 kg CO2** berhasil dikurangi  
- 🌳 **0.01 – 0.05 pohon** setara yang diselamatkan
- 🍽️ **250 – 400 gram** bahan makanan diselamatkan dari tempat sampah

---

## 👨‍💻 Tentang Pembuat

**Raihan Darma Putra**  
Mahasiswa yang percaya bahwa teknologi AI bisa menyelesaikan 
masalah nyata di sekitar kita — dimulai dari dapur.

Built with ❤️ for **#JuaraVibeCoding 2026**  
Google for Developers × Google Cloud × Bangkit Bersama AI

---

## 📄 Lisensi

MIT License — bebas digunakan dan dikembangkan.

---

<div align="center">

**WasteNot · Ubah Sisa Jadi Sajian**  
[wastenot-478604489147.asia-southeast1.run.app](https://wastenot-478604489147.asia-southeast1.run.app)

*Built with Google Gemini AI · #JuaraVibeCoding 2026*

</div>
## 🛠️ Tech Stack
