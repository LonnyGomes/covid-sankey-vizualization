// Set this to true for production
var doCache = true;

// Name our cache
var CACHE_NAME = 'covid-19-app-v1';

// Delete old caches that are not our current one!
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (!cacheWhitelist.includes(key)) {
                        console.log(`[Service Worker] Deleting cache: ${key}`);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// The first time the user starts up the PWA, 'install' is triggered.
self.addEventListener('install', function (event) {
    console.log(`[Service Worker] Cache installed: ${CACHE_NAME}`);
});

// When the webpage goes to fetch files, we intercept that request and serve up the matching files
// if we have them
self.addEventListener('fetch', function (event) {
    if (doCache) {
        // Reference: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
        event.respondWith(
            caches.match(event.request).then((r) => {
                console.log(
                    '[Service Worker] Fetching resource: ' + event.request.url
                );
                return (
                    r ||
                    fetch(event.request).then((response) =>
                        caches.open(CACHE_NAME).then((cache) => {
                            console.log(
                                '[Service Worker] Caching new resource: ' +
                                    event.request.url
                            );
                            cache.put(event.request, response.clone());
                            return response;
                        })
                    )
                );
            })
        );
    }
});
