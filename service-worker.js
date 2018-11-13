"use strict";

self.addEventListener('fetch', event => {

    // Check if the request is for an image
    if (/\.jpg$|.png$|.gif$/.test(event.request.url)) {

        // Get the existing image URL
        let imageUrl = event.request.url;

        // Build up the Cloundinary URL
        const cloudinaryUrl = `https://res.cloudinary.com/hume/image/fetch/q_auto,f_auto/${imageUrl}`;

        // Try and fetch the image
        return event.respondWith(
            fetch(cloudinaryUrl, response => {
                if (!response.ok){
                    // We failed return original image
                    console.log(response.ok);
                }

                return response;
            }).catch(error => {
                console.log(error);
            })
        );

        // TODO: Add timeout and fallback
    }
});

