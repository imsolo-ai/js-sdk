# solo-js-sdk
## emotional checkup for the browser
### Installations

`npm i solo-js-sdk`

or use from CDN

`<script src=“https://unpkg.com/solo-js-sdk”></script>`

### Getting started
    import solo from "solo-js-sdk"
    
    await solo.init({apiKey: YOUR_API_KEY_HERE, appId: YOUR_APP_ID_HERE})
    
    solo.addEventListener("live_results", (res)=>{
        console.log("live results", res)
    })

    solo.identify({userId: "uid"})
    
    solo.startMonitoring()
### API
