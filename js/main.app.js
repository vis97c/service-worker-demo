//the following two blocks of code are components
//we'll use them to make custom html elements

Vue.component("hello", {
    template: "<label>Input Your Name:<h1></h1><input/></label>"
});

Vue.component("bar", {
    template: "<div id='bar'></div>"
});

//next we'll select an element
//set up data
//and define a method

new Vue({
    el: "#appex",
    data: {
        text: "Simple Vue App.",
        html: "<p id='darkblue'>You can use Vue to do<br/>all kinds of cool stuff!</p>"
    },
    methods: {
        sayHello: function () {
            var name = document.querySelector("#vue input"),
                button = document.querySelector("#vue button"),
                prompt = "What's your name?";
            var style = name.style;

            if (!name.value || name.value === prompt) {
                name.value = prompt;
                name.focus();
            } else {
                alert("Howdy " + name.value + "!");
                name.value = null;
                button.blur();
            }
        }
    },
    created() {
        // listen for the new service worker to be registered, then reloads the page
        var refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) {
                return
            };
            refreshing = true;
            window.location.reload();
        });

        //prompts the user to reload the page, when a new (app update) service worker is available
        window['isUpdateAvailable'].then(async (isAvailable) => {
            if (isAvailable) {
                //new update, prompt user
                if (confirm("Nueva actualizacion disponible. ¿Deseas actualizar?")){
                    const reg = await navigator.serviceWorker.ready;
                    if (reg.waiting) {
                        reg.waiting.postMessage('skipWaiting');
                    }
                }
            }
        });
    }
});