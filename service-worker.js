const api = 'myApiEndpoint', build = 'myDinamycBuildVersion', version = 'myAppVersion', expectedCaches = [
    'app-install-v' + version, //lo minimo que se requiere al instalar el app 
    'app-app-v' + version + '-b' + build, //nucleo js del app + pueden cambiar al compilarse
    'app-static' //el resto de archivos ej: imagenes y contenido independiente de la version
];

//installs updated serviceworker
self.addEventListener('message', e => {
    if (e.data === 'skipWaiting') {
        return self.skipWaiting();
    }
});

self.addEventListener('install', e => {
    // self.skipWaiting()
    e.waitUntil(
        caches.open(expectedCaches[0]).then(cache => cache.addAll([
            '/',
            // '/js/app.js', //this need to be refreshed on every app update, so dont't cache it in the core
            '/offline.html',
            //non dinamyc static
            '/images/logo.png',
            //third party
            'https://fonts.googleapis.com/css?family=Montserrat:100,200,300,400,500,600,700,800,900&display=swap',
            'https://use.fontawesome.com/releases/v5.8.2/css/all.css'
        ]))
    );
});

self.addEventListener('activate', function (e) {
    // Claim any clients immediately, so that the page will be under SW control without reloading.
    e.waitUntil(
        self.clients.claim(),
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (expectedCaches.indexOf(cacheName) == -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    if (!(e.request.url.indexOf('http') === 0)) {
        //skip this request cause is non http ej: chrome://
        return
    }
    const url = new URL(e.request.url)

    //change this condional to match your api request
    if (url.origin === api.split('/admin')[0] && e.request.destination !== 'image'){
        //NETWORK FIRST APPROACH, fresh api data
        e.respondWith(
            fetch(e.request).then(response => {
                if (!response.ok && !(response.status == 0 && response.type == 'opaque')) {
                    throw Error(response.statusText);
                } else {
                    return caches.open(expectedCaches[2]).then(cache => {
                        cache.put(e.request.url, response.clone());
                        return response;
                    });
                }
            }).catch(() => {
                //you are offline, respond with cached response
                return caches.match(e.request);
            })
        );
    }else{
        //CACHE FIRST APPROACH
        if (e.request.mode == 'navigate') {
            //is a navigation request for an html page
            //this asumes you got the default files installed, if somehow index.html doesn't exist it fallsback to the offline html file
            //this also asumes you are building a SPA and all the routes are handled by the already cached index file, try deleting it from the cache to break the page
            e.respondWith(
                caches.match('/').then(response => {
                    // respond with cached file
                    if (response) {
                        return response;
                    }
                    // no match, respond with and error/offline page
                    return caches.match('/offline.html')
                })
            );
        } else {
            //static files only
            if (e.request.destination === ('image' || 'font' || 'style') || e.request.url.includes('.app.')){
                e.respondWith(
                    caches.match(e.request).then(response => {
                        // respond with cached file
                        if (response) {
                            return response;
                        }
                        // no match, request file
                        return fetch(e.request).then(response => {
                            if (!response.ok) {
                                //verify response as it could be spoiled
                                if (response.status == 0 && response.type == 'opaque'){
                                    //don't cache opaque responses
                                    return response;
                                }
                                throw Error(response.statusText);
                            }else{
                                //everything ok, chache this response 
                                var targetCache = e.request.url.includes('.app.') ? 1 : 2;
                                return caches.open(expectedCaches[targetCache]).then(cache => {
                                    cache.put(e.request.url, response.clone());
                                    return response;
                                });
                            }
                        }).catch(fetchError => {
                            //connection error probably
                            console.log(fetchError);
                        });

                    }).catch(cacheError => {
                        //error en la cache, poco probable que suceda
                        console.log(cacheError);
                    })
                );
            }
        }
    }
    return //defaul behavior
});