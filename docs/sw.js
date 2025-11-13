const CACHE_NAME = 'rickandmorty-pwa-v1.2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.webmanifest'
    // Não inclua ícones aqui ainda - vamos fazer sob demanda
];

// Install event - cache only arquivos críticos
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto, adicionando URLs:', urlsToCache);
                // Adiciona apenas os arquivos que sabemos que existem
                return cache.addAll(urlsToCache.filter(url => 
                    !url.includes('icons/') // Remove ícones da lista inicial
                ));
            })
            .catch(error => {
                console.log('Cache addAll failed:', error);
                // Mesmo se falhar, o SW continua
            })
    );
    // Force activation
    self.skipWaiting();
});

// Fetch event - estratégia Cache First com fallback para Network
self.addEventListener('fetch', event => {
    // Não cachear requisições para a API
    if (event.request.url.includes('rickandmortyapi.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache ou busca na rede
                return response || fetch(event.request)
                    .then(fetchResponse => {
                        // Cache dinâmico para novos recursos
                        if (fetchResponse && fetchResponse.status === 200) {
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request.url, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        }
                        return fetchResponse;
                    })
                    .catch(error => {
                        console.log('Fetch failed, returning offline page:', error);
                        // Fallback para página offline
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Tome o controle de todas as abas imediatamente
    self.clients.claim();
});