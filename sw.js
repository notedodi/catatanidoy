
const CACHE_NAME = 'transaksi-app-cache-v2'; // Ubah versi cache setiap kali Anda mengubah aset yang di-cache
const urlsToCache = [
    '/', // Root of the application
    '/index.html',
    '/manifest.json',
    // External libraries (CDNs)
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    // Placeholder icons (PENTING: di aplikasi nyata, ganti ini dengan URL ikon asli Anda)
    'https://placehold.co/48x48/f7f7f7/000000?text=TK',
    'https://placehold.co/72x72/f7f7f7/000000?text=TK',
    'https://placehold.co/96x96/f7f7f7/000000?text=TK',
    'https://placehold.co/144x144/f7f7f7/000000?text=TK',
    'https://placehold.co/168x168/f7f7f7/000000?text=TK',
    'https://placehold.co/192x192/f7f7f7/000000?text=TK',
    'https://placehold.co/256x256/f7f7f7/000000?text=TK',
    'https://placehold.co/384x384/f7f7f7/000000?text=TK',
    'https://placehold.co/512x512/f7f7f7/000000?text=TK'
];

// Event: 'install' - Dipicu saat Service Worker pertama kali diinstal.
// Ini adalah tempat kita meng-cache semua aset penting aplikasi.
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME) // Buka atau buat cache dengan nama yang ditentukan
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                // Tambahkan semua URL yang ingin di-cache
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache during install:', error);
            })
    );
});

// Event: 'fetch' - Dipicu setiap kali browser mencoba mengambil sumber daya (resource).
// Ini memungkinkan Service Worker untuk mencegat permintaan jaringan dan meresponsnya dari cache.
self.addEventListener('fetch', event => {
    // console.log('Service Worker: Fetching', event.request.url);
    event.respondWith(
        caches.match(event.request) // Coba cari permintaan di cache
            .then(response => {
                // Jika ditemukan di cache, kembalikan respons dari cache
                if (response) {
                    // console.log('Service Worker: Found in cache', event.request.url);
                    return response;
                }
                // Jika tidak ditemukan di cache, coba ambil dari jaringan
                // console.log('Service Worker: Not in cache, fetching from network', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Periksa apakah respons dari jaringan valid
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // PENTING: Kloning respons. Respons adalah stream dan hanya dapat dikonsumsi sekali.
                        // Kita harus mengkloningnya agar browser dapat mengkonsumsi satu dan kita dapat mengkonsumsi yang lain.
                        const responseToCache = networkResponse.clone();

                        // Simpan respons jaringan yang baru ke cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        // Tangani kesalahan jaringan, misalnya, kembalikan halaman offline
                        console.error('Service Worker: Fetch failed for:', event.request.url, error);
                        // Anda bisa mengembalikan respons fallback untuk aset tertentu di sini,
                        // misalnya, gambar placeholder atau halaman offline.
                        // Contoh: return caches.match('/offline.html');
                    });
            })
    );
});

// Event: 'activate' - Dipicu saat Service Worker diaktifkan.
// Ini adalah tempat yang baik untuk membersihkan cache lama.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    const cacheWhitelist = [CACHE_NAME]; // Hanya izinkan cache dengan nama saat ini

    event.waitUntil(
        caches.keys().then(cacheNames => { // Dapatkan semua nama cache yang ada
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Jika nama cache tidak ada di whitelist, hapus
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Klaim klien untuk memastikan Service Worker mengontrol semua halaman segera
    return self.clients.claim();
});
