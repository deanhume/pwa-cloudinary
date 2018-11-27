"use strict";

/**
 * Fetch the image from Cloudinary and
 * fail if there are any errors.
 * @param {string} imageUrl 
 * @param {int} imageQuality 
 */
function fetchCloudinaryImage(imageUrl, imageQuality) {

    const controller = new AbortController();
    const signal = controller.signal;

    // Build up the Cloundinary URL
    const imageQualityString = `q_${imageQuality}`
    const cloudinaryUrl = `https://res.cloudinary.com/hume/image/fetch/${imageQualityString},f_auto/${imageUrl}`;

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

self.addEventListener('fetch', event => {

    const request = event.request;
    const url = event.request.url;

    // Check if the request is for an image
    if (/\.jpg$|.png$|.gif$/.test(url)) {
        if (shouldReturnLowQuality(request)) {
            // Fetch a really low quality version of the image
            event.respondWith(fetchCloudinaryImage(url, 1));
        } else {
            // Try and fetch the image from Cloundinary / timeout if too slow
            event.respondWith(fetchCloudinaryImage(url, 80));
        }
    }
});