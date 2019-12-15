//this file is executed just one time when the app is loaded and registers the pwa. Pls take care
if ('serviceWorker' in navigator) {
    var isCrawler = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
    //avoid registering the service worker for crawlers
    if (!isCrawler){
        //This is the service worker with the combined offline experience (Offline page + Offline copy of pages)
        navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
            // success, do nothing
        }).catch(function (error) {
            console.log('Service worker registration failed:', error);
        });
        // if (navigator.storage && navigator.storage.persist) {
        //     //evita que el navegador borre la cache cuando le plazca
        //     navigator.storage.persist();
        // }

        // make the whole serviceworker process into a promise so later on we can
        // listen to it and in case new content is available a toast will be shown
        window.isUpdateAvailable = new Promise(function (resolve, reject) {
            // register service worker file
            navigator.serviceWorker.register('service-worker.js').then(reg => {
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case 'installed':
                                if (navigator.serviceWorker.controller) {
                                    // new update available
                                    resolve(true);
                                } else {
                                    // no update available
                                    resolve(false);
                                }
                                break;
                        }
                    };
                };
            })
                .catch(err => console.error('[SW ERROR]', err));
        });
        // Update:
        // this also can be incorporated right into e.g. your run() function in angular,
        // to avoid using the global namespace for such a thing.
        // because the registering of a service worker doesn't need to be executed on the first load of the page.
    }
} else {
    console.log('Service workers are not supported.');
}