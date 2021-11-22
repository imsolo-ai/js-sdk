let iframeId = "solo-widget-iframe";
let iframeSrc = "http://localhost:3000"

const listeners = {
    checkup_started: null,
    checkup_ended: null,
    checkup_results: null,
    widget_opened: null,
    widget_closed: null
}

async function init({apiKey, appId}) {
    // todo: init - if success allow to open iframe/ show button
    return new Promise((res, rej) => {
        loadIframe(async (init) => {
            let success = await init(apiKey,appId)
            if(success){
                solo["showButton"] = showButton;
                solo["openWidget"] = openWidget;
                res(success)
            }else {
                rej("error initializing solo, check your api key & app id")
            }
        })
    })

}

function loadIframe(cb) {
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
    iframe.addEventListener("load", () => {
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
                    rej(data.error);
                } else {
                    res(data);
                }
            };

            iframeWindow.postMessage(message, "*", [channel.port2]);
        });


        solo.remoteInit = async (apiKey, appId) => {
            const data = {apiKey, appId}
            //todo: init from api
            //if success - render button
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

        if(cb){
            cb(solo.remoteInit)
        }
    });
}

function showButton(options) {
    let button = document.createElement('div');
    button.style.cssText = '';
    button.innerHTML = `
        <div
          id="solo-sdk-launcher"
          onClick="openWidget()"
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
}

function openWidget(options) {
    let iframeWrapper = document.querySelector('solo-iframe-holder');
    iframeWrapper.style.cssText = `position: absolute;
          width: 200px;
          height: 230px;
          bottom: 0;
          right: 0;`;
}

export const solo = {
    init,
}



