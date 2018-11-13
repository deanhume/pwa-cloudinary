"use strict";

/**
 * Force a timeout if we go beyond given time period
 * @param {int} delay 
 */
function timeout(delay) {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){
          resolve();
        }, delay);
    });
}

/**
 * Fetch the image from Cloudinary and
 * fail if there are any errors.
 * @param {string} imageUrl 
 */
function fetchCloudinaryImage(imageUrl){

    // Build up the Cloundinary URL
    const cloudinaryUrl = `https://res.cloudinary.com/hume/image/fetch/q_auto,f_auto/${imageUrl}`;    
    
    // return fetch(cloudinaryUrl, response => {
    //     if (!response.ok){
    //         // We failed return original image
    //         console.log(response.ok);
    //     }

    //     return response;
    // }).catch(error => {
    //     console.log(error);
    // })

    return fetch(cloudinaryUrl).then(response => console.log(response.ok));
}

self.addEventListener('fetch', event => {

    // Check if the request is for an image
    if (/\.jpg$|.png$|.gif$/.test(event.request.url)) {

        // Try and fetch the image / timeout if too slow
        event.respondWith(Promise.race([timeout(2000), fetchCloudinaryImage(event.request.url)]));
    }
});

