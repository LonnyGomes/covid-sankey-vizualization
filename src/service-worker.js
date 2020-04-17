// Name our cache
const CACHE_NAME = 'covid-19-app-v1.0.2';

// URLs we want to fetch before using the cached version
const WHITELIST_URLS = [
    'https://corona.lmao.ninja/v2/all',
    'https://corona.lmao.ninja/v2/states',
    'https://corona.lmao.ninja/v2/countries',
    'https://covid.lonnygomes.com/',
    'http://localhost:1234/',
];

// retrieves a request and caches the response for later use
const fetchAndCache = (request) =>
    fetch(request).then((response) =>
        caches.open(CACHE_NAME).then((cache) => {
            console.log(
                '[Service Worker] Caching new resource: ' + request.url
            );
            cache.put(request, response.clone());

            return response;
        })
    );

// follows a network-first approach to retrieve whitelisted URLS
const hydrateWhitelist = (request, response) => {
    // if we already have a response and it is in the whitelist
    // try to fetch the latest data from the network
    if (response && WHITELIST_URLS.includes(request.url)) {
        return (
            fetchAndCache(request)
                // if the request fails, we prob are offline
                // so use the cached response
                .catch(() => response)
        );
    }

    // if it's not part of the whitelist, just pass through the response
    return response;
};

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

// When the webpage goes to fetch files, we intercept that request and
// serve up the matching files if we have them
self.addEventListener('fetch', function (event) {
    // Reference documentation: https://mzl.la/2RhHLrv

    event.respondWith(
        caches
            .match(event.request)
            // attempt to update the cache of whitelisted URLs
            .then((r) => hydrateWhitelist(event.request, r))
            // return cached response or fetch and cache
            .then((r) => {
                console.log(
                    `[Service Worker] Fetching resource: ${event.request.url}`
                );

                return r || fetchAndCache(event.request);
            })
    );
});
