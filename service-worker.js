"use strict";

/**
 * Fetch the image from Cloudinary and
 * fail if there are any errors.
 * @param {string} imageUrl 
 * @param {object} originalRequest 
 */
function fetchCloudinaryImage(imageUrl, originalRequest) {

    const controller = new AbortController();
    const signal = controller.signal;

    // Build up the Cloundinary URL
    const cloudinaryUrl = `https://res.cloudinary.com/hume/image/fetch/q_auto,f_auto/${imageUrl}`;

    const fetchPromise = fetch(cloudinaryUrl, { signal });

    // 5 second timeout
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    return fetchPromise
        .then(response => {
            if (!response.ok) {
                // We failed return original image
                return originalRequest;
            }
            return response;
        })
        .catch(error => {
            // Something went wrong, return original image
            return originalRequest;
        });
}

self.addEventListener('fetch', event => {

    // Check if the request is for an image
    if (/\.jpg$|.png$|.gif$/.test(event.request.url)) {

        // Try and fetch the image / timeout if too slow
        event.respondWith(fetchCloudinaryImage(event.request.url, event.request));
    }
});