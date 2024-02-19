import React, {useEffect, useState} from 'react';
import solo from "solo-js-sdk"

let creds = {
    apiKey: "your-api-key-here",
    appId: "your-app-id-here",
}
function App() {

    const [initialized, setInitialized] = useState(false)
    const [monitoring, setMonitoring] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                await solo.init({apiKey: creds.apiKey, appId: creds.appId})
                solo.identify({userId: "your-user-id"})

                solo.addEventListener("live_results", (res) => {
                    console.log("live_results", res)
                })
                setInitialized(true)
            }catch (e) {
                console.error("error initializing solo", e)
            }

        }

        init()

    }, [])


    const toggleMonitoring = () => {
        if(monitoring){
            solo.stopMonitoring()
        }else {
            solo.startMonitoring()
        }
        setMonitoring(!monitoring)
    }

    return (
        <div className="App">
            <header className="App-header">
                <p>
                    SOLO JS SDK EXAMPLE
                </p>
            </header>
            {
                initialized ?
                    <div>
                        <div>Initialized</div>
                        <button onClick={toggleMonitoring}>{monitoring ? "stop monitoring" : "start monitoring"}</button>
                    </div>
                    : <p>Not Initialized</p>
            }
        </div>
    );
}

export default App;
