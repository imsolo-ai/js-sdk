# solo-js-sdk
## emotional ai for the browser
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

## Documentation

- [Quick Start Guide](./docs/quick-start.md) - Get up and running quickly
- [Monitoring Guide](./docs/monitoring-guide.md) - Detailed information on enhanced monitoring features
- [Camera Device Management](./docs/camera-device-management.md) - Complete guide to programmatic camera selection
- [Camera Selection Examples](./docs/camera-selection-examples.md) - Practical implementation examples

## Examples

- [Camera Selection Demo](./examples/camera-selection-demo.html) - Interactive demo showing camera device management

## New Features

### 📹 Camera Device Management

The SOLO SDK now supports programmatic camera device management without requiring the built-in camera picker UI:

```javascript
// Get available cameras
const cameras = await solo.getAvailableMediaDevices();

// Switch to a specific camera
await solo.setMediaDevice(deviceId);

// Listen for camera changes
solo.addEventListener('stream_changed', (streamInfo) => {
    console.log('Camera changed:', streamInfo.label);
});
```

Key benefits:
- **Complete control** over camera selection UI
- **Seamless integration** with existing applications
- **Automatic events** when cameras change
- **Works with all** monitoring and checkup features
