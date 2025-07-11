
    //let apiUrl = 'http://localhost:8080';
    //let iframeSrc = "http://localhost:3000"//
    //let apiUrl = 'https://sdk-backend.imsolo.ai';
     let apiUrl = 'https://solo-sdk-332507.uc.r.appspot.com';
     let iframeSrc = "https://solo-sdk-a0179.web.app"
    let _shouldShowButton = false

const routes = {
    init: `${apiUrl}/api/v1/auth/init-sdk`,
}
let iframeId = "solo-widget-iframe";

function buildIframe() {
    let iframeWrapper = document.createElement('div');
    iframeWrapper.id = "solo-iframe-holder"
    iframeWrapper.style.cssText = `position: absolute;
          width: 0;
          height: 0;
          bottom: 0;
          right: 0;`;
    document.body.appendChild(iframeWrapper);
    //  let iframe = document.createElement("iframe")
    // iframe.id = iframeId;
    //iframe.style.width = "100%";
    // iframe.style.height = "100%";
    // iframe.style.border = "none";
    // iframe.frameBorder = "0";
    // iframe.allow = "camera;microphone;"
    //iframe.name="solo-widget-iframe"
    // iframeWrapper.appendChild(iframe);
    // iframe.srcdoc=`<!doctype html><html><head><script src='${iframeSrc}' type='text/javascript'></script></head><body></body></html>`;
    iframeWrapper.innerHTML = `<iframe crossorigin id="${iframeId}" name="solo-widget-iframe" src="${iframeSrc}" allow="camera;microphone" width=100% height=100% title="SOLO web-sdk app" frameborder="0" />`

}

const listeners = {
    checkup_started: null,
    checkup_ended: null,
    checkup_results: null,
    monitoring_results: null,
    monitoring_started: null,
    monitoring_ended: null,
    widget_opened: null,
    widget_closed: () => {
        closeWidget()
    },
    live_results: null,
    stream_started: null,
    stream_changed: null,

}

async function init({apiKey, appId}, options) {
    let headers = new Headers({
        'X-App-Id': appId,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
    })
    let request = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({noSession: true}),
    };
    try {
        let res = await fetch(routes.init, request).then((response) => response.json())
        if (res && res.success) {
            //let zoomMeeting = options && options.zoomMeeting;
            return await loadIframe({apiKey, appId})
        }
    } catch (e) {
        console.error("Error initializing solo client", e)
        throw "error initializing solo, check your api key & app id"
    }
}

async function loadIframe({apiKey, appId}) {
    return new Promise(function (resolve, reject) {
        let zoomProps = {
            participantName: "",
            canvasFallbackSelector: "",
            zoomElSelectorFallback: ""
        }

        if (!document.getElementById(iframeId)) {
            buildIframe()
        }

        const iframe = document.getElementById(iframeId);

        iframe.addEventListener("load", async () => {

            console.log("solo sdk iframe loaded")
            const trustedOrigins = [iframeSrc];

            //   console.log("trustedOrigins", trustedOrigins)

            async function onMsg(event) {
                if (!trustedOrigins.includes(event.origin)) return;
                // console.log(`Message from an iframe`, event);
                const key = event.message ? 'message' : 'data';
                const data = event[key];
                if (data.event) {
                    let eventName = data.event
                //    console.log("got event", data.event)
                    listeners[eventName] && listeners[eventName](data.data)
                    return true;
                }

                const msgData = event[key];
                if (msgData) {
                    switch (msgData) {
                        case "requestZoomCapture":
                            let captureZoomRes = solo.captureZoom(zoomProps.participantName, zoomProps.canvasFallbackSelector, zoomProps.zoomElSelectorFallback);
                            console.log("captureZoomRes", captureZoomRes)
                            return captureZoomRes
                    }
                }
            }

            window.addEventListener("message", async (event) => {
                try {
                    if (!event.ports || event.ports.length < 1) {
                        return;
                    }
                    let res = await onMsg(event)
                    event.ports[0].postMessage({data: res});
                } catch (e) {
                    event.ports[0].postMessage({error: e});
                }
            }, false)

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
            solo.getStreamInfo = async () => {
                return await sendMessage({message: "getStreamInfo"}, "*");
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
            solo.exportSession = async () => {
                 return await sendMessage({message: "exportSession"}, "*");
            }
            solo.addEventListener = (eventName, cb) => {
                if (listeners.hasOwnProperty(eventName)) {
                    listeners[eventName] = cb
                }
            }
            solo.removeEventListener = (eventName) => {
                if (listeners[eventName]) {
                    listeners[eventName] = null
                }
            }
        
            solo.detectPageElement = async (el) => {
                let clone = el.cloneNode(true)
                return await sendMessage({message: "detectPageElement", data: {el: clone}}, "*");
            }

            solo.startMonitoring = async (options = {}) => {
                const { duration, detectionInterval } = options;
                return await sendMessage({
                    message: "startMonitoring", 
                    data: { 
                        duration, 
                        detectionInterval 
                    }
                }, "*");
            }

            solo.stopMonitoring = async () => {
                return await sendMessage({message: "stopMonitoring"}, "*");
            }

            solo.setCameraView = async () => {
                return await sendMessage({message: "setCameraView"}, "*");
            }

            solo.setResultsView = async () => {
                return await sendMessage({message: "setResultsView"}, "*");
            }

            solo.getAvailableMediaDevices = async () => {
                return await sendMessage({message: "getAvailableMediaDevices"}, "*");
            }

            solo.setMediaDevice = async (deviceId) => {
                return await sendMessage({message: "setMediaDevice", data: {deviceId}}, "*");
            }

            try {
                let success = await solo.remoteInit(apiKey, appId)
                //console.log("iframe response", success)
                if (success) {
                   // solo["showButton"] = showButton;
                    solo["openCameraPicker"] = openWidget;
                    resolve(success)
                } else {
                    reject("error initializing solo, check your api key & app id")
                }
            } catch (e) {
                console.error("error", e)
                reject("error initializing solo, check your api key & app id")
            }
        });
    })
}

function openWidget(options = {autoStart: false}) {
    let iframeWrapper = document.getElementById('solo-iframe-holder');
    iframeWrapper.style.cssText = `position: absolute;
          width: 200px;
          height: 265px;
          bottom: 10px;
          right: 10px;`;
    hideButton()
    if (options.autoStart) {
        solo.startMonitoring()
    }
}

function closeWidget() {
    let iframeWrapper = document.getElementById('solo-iframe-holder');
    iframeWrapper.style.cssText = `position: absolute;
          width: 0;
          height: 0;
          bottom: 0;
          right: 0;`;
    if (_shouldShowButton) {
        showButton()
    }
}

function hideButton() {
    let button = document.getElementById("solo-sdk-launcher");
    button && button.remove()
}

function showButton(options) {
    _shouldShowButton = true;
    let button = document.createElement('div');
    const url = new URL("./assets/images/nextArrowBlack.svg", iframeSrc);
    button.style.cssText = '';
    button.innerHTML = `
        <div
          id="solo-sdk-launcher"
          style="
            position: absolute;
            bottom: 0;
            right: 0;
            width: 172px;
            height: 120px;
            cursor: pointer;
            margin: 15px;
            background: linear-gradient(0deg, #FCF3C7, #FCF3C7);
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
          <img src="${url}" width="12px" />
        </div>
      `;
    document.body.appendChild(button);
    button.addEventListener("click", openWidget)
}


const solo = {
    init,
}


export default solo

