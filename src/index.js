;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            global.solo = factory()
}(this, (function () {

    //let apiUrl = 'http://localhost:8080';
    //let iframeSrc = "http://localhost:3000"//
    let apiUrl = 'https://solo-sdk-332507.uc.r.appspot.com';
    let iframeSrc = "https://solo-sdk-a0179.web.app/"

    let _shouldShowButton = false

    const routes = {
        init: `${apiUrl}/api/v1/auth/init-sdk`,
    }

    let iframeId = "solo-widget-iframe";

    const listeners = {
        checkup_started: null,
        checkup_ended: null,
        checkup_results: null,
        widget_opened: null,
        widget_closed: null
    }

    async function init({apiKey, appId}) {

        let headers = new Headers({
            'X-App-Id': appId,
            'X-API-Key': apiKey
        })

        let request = {
            method: 'POST',
            headers: headers,
        };

        try {
            let res = await fetch(routes.init, request).then((response) => response.json())
            if(res && res.success){
                return await loadIframe({apiKey, appId})
            }
        }catch (e) {
            console.error("Error initializing solo client", e)
            throw "error initializing solo, check your api key & app id"
        }
    }

    async function loadIframe({apiKey, appId}) {
        return new Promise(function(resolve, reject) {
            if (!document.getElementById(iframeId)) {

                let iframeWrapper = document.createElement('solo-iframe-holder');
                iframeWrapper.style.cssText = `position: absolute;
          width: 0;
          height: 0;
          bottom: 0;
          right: 0;`;
                iframeWrapper.innerHTML = `<iframe id="${iframeId}" name="solo-widget-iframe" src="${iframeSrc}" allow="camera;microphone" width=100% height=100% title="SOLO web-sdk app" frameborder="0" />`

                document.body.appendChild(iframeWrapper);

            }

            const iframe = document.getElementById(iframeId);
            iframe.addEventListener("load", async () => {
                console.log("iframe loaded")

                const trustedOrigins = [iframeSrc];

                function onMsg(event) {
                    if (!trustedOrigins.includes(event.origin)) return;
                    console.log(`Message from an iframe`, event);

                    const key = event.message ? 'message' : 'data';
                    const data = event[key];

                    if (data.event) {
                        let eventName = data.event
                        console.log("got event", data.event)
                        listeners[eventName] && listeners[eventName](data.data)
                    }
                }

                window.addEventListener("message", onMsg, false);

                let iframeName = iframe.getAttribute("name");
                let iframeWindow = window.frames[iframeName]

                const sendMessage = (message) => new Promise((res, rej) => {
                    const channel = new MessageChannel();

                    channel.port1.onmessage = ({data}) => {
                        channel.port1.close();
                        if (data.error) {
                            console.log("channel error", data.error)
                            rej(data.error);
                        } else {
                            res(data);
                        }
                    };
                    iframeWindow.postMessage(message, "*", [channel.port2]);
                });

                solo.remoteInit = async (apiKey, appId) => {
                    const data = {apiKey, appId}
                    return await sendMessage({message: "init", data})
                }

                solo.identify = async ({userId, groupId, sessionId, userName, groupName}) => {
                    return await sendMessage({message: "identify", data: {userId, groupId, sessionId, userName, groupName}})
                }

                solo.setContent = async (contentId) => {
                    return await sendMessage({message: "setContent", data: {contentId}}, "*");
                }

                solo.setSession = async (sessionId) => {
                    return await sendMessage({message: "setSession", data: {sessionId}}, "*");
                }

                solo.setWidgetOptions = async ({options}) => {
                    return await sendMessage({message: "setWidgetOptions", data: {options}}, "*");
                }

                solo.setMetadata = async (metadata) => {
                    return await sendMessage({message: "setMetadata", data: {metadata}}, "*");
                }

                solo.removeMetadata = async (keys) => {
                    return await sendMessage({message: "removeMetadata", data: {keys}}, "*");
                }

                solo.reset = async () => {
                    return await sendMessage({message: "reset"}, "*");
                }

                solo.addEventListener = (eventName, cb) => {
                    if (listeners[eventName]) {
                        listeners[eventName] = cb
                    }
                }

                solo.removeEventListener = (eventName) => {
                    if (listeners[eventName]) {
                        listeners[eventName] = null
                    }
                }

                try {
                    let success = await solo.remoteInit(apiKey,appId)
                    console.log("iframe response", success)
                    if(success){
                        solo["showButton"] = showButton;
                        solo["openWidget"] = openWidget;
                        resolve(success)
                    }else {
                        reject("error initializing solo, check your api key & app id")
                    }
                }catch (e) {
                    console.error("error", e)
                    reject("error initializing solo, check your api key & app id")
                }

            });
        })

    }

    function openWidget(options) {
        let iframeWrapper = document.querySelector('solo-iframe-holder');
        iframeWrapper.style.cssText = `position: absolute;
          width: 200px;
          height: 230px;
          bottom: 0;
          right: 0;`;

        hideButton()
    }

    function closeWidget(){
        let iframeWrapper = document.querySelector('solo-iframe-holder');
        iframeWrapper.style.cssText = `position: absolute;
          width: 0;
          height: 0;
          bottom: 0;
          right: 0;`;
        if(_shouldShowButton){
            showButton()
        }

    }

    function hideButton(){
        document.getElementById("solo-sdk-launcher").remove()
    }

    function showButton(options) {
        _shouldShowButton = true;
        let button = document.createElement('div');
        button.style.cssText = '';
        button.innerHTML = `
        <div
          id="solo-sdk-launcher"
          style="
            width: 172px;
            height: 120px;
            cursor: pointer;
            margin: 15px;
            background: linear-gradient(0deg, #fcf3c7, #fcf3c7);
            box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
            border-radius: 8px;
            padding: 5px;
            display: flex;
            justify-content: space-around;
            align-items: center;
          "
          onmouseover="this.style.opacity=0.5"
          onmouseout="this.style.opacity=1.0"
        >
          <div
            style="
              font-family: 'OpenSans', sans-serif;
              font-style: normal;
              font-weight: bold;
              /* font-size: 12px; */
              letter-spacing: -0.0866281px;
              color: #000000;
            "
          >
            <p style="max-width: 100px">Check your emotional health</p>
          </div>
          <img src="./assets/images/nextArrowBlack.svg" width="12px" />
        </div>
      `;
        document.body.appendChild(button);
        button.addEventListener("click", openWidget)
    }

    const solo = {
        init,
    }

    return solo
})));
