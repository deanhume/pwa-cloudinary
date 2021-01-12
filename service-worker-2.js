
const cacheName = 'blogCache-latest';
const offlineUrl = '/offline/';

/**
 * The event listener for the service worker installation
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll([
                './assets/font/beyond_the_mountains.ttf',
                './assets/font/icons.woff2',
                offlineUrl
            ]))
    );
});

/**
 * Is the current request for an HTML page?
 * @param {Object} event 
 */
function isHtmlPage(event) {
    return event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html');
}

/**
 * Fetch the image from Cloudinary and fail if there are any errors.
 * @param {string} imageUrl 
 * @param {int} imageQuality 
 */
function fetchCloudinaryImage(imageUrl, imageQuality) {

    const controller = new AbortController();
    const signal = controller.signal;

    // Build up the Cloundinary URL
    const imageQualityString = `q_${imageQuality}`
    const cloudinaryUrl = `https://res.cloudinary.com/deanhume/image/fetch/${imageQualityString},f_auto/${imageUrl}`

    const fetchPromise = fetch(cloudinaryUrl, { signal });

    // 5 second timeout
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    return fetchPromise
        .then(response => {
            if (!response.ok) {
                // We failed return original image
                return fetch(imageUrl);
            }
            return response;
        })
        .catch(() => {
            // Something went wrong, return original image
            return fetch(imageUrl);
        });
}

/**
 * Checks the current device and network to see
 * if we should return a low quality image instead.
 * @param {object} request 
 */
function shouldReturnLowQuality(request) {
    if ((request.headers.get('save-data')) // Save Data is on
        || (navigator.connection.effectiveType.match(/2g/)) // Looks like a 2G connection
        || (navigator.deviceMemory < 1) // We have less than 1G of RAM
    ) {
        return true;
    }

    return false;
}

/**
 * Fetch and cache any results as we receive them.
 */
self.addEventListener('fetch', event => {

    const url = event.request.url;

    // Check if the request is for an image
    if (/\.jpg$|.png$|.gif$/.test(url)) {
        if (shouldReturnLowQuality(event.request)) {
            // Fetch a really low quality version of the image
            event.respondWith(fetchCloudinaryImage(url, 30));
        } else {
            // Try and fetch the image from Cloundinary / timeout if too slow
            event.respondWith(fetchCloudinaryImage(url, 80));
        }
    }

    // Else continue as normal
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Only return cache if it's not an HTML page
                if (response && !isHtmlPage(event)) {
                    return response;
                }

                return fetch(event.request).then(
                    function (response) {
                        // Dont cache if not a 200 response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        let responseToCache = response.clone();
                        caches.open(cacheName)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(error => {
                    // Check if the user is offline first and is trying to navigate to a web page
                    if (isHtmlPage(event)) {
                        return caches.match(offlineUrl);
                    }
                });
            })
    );
});