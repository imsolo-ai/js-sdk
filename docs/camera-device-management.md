# Camera Device Management

The SOLO SDK provides programmatic camera device management methods that allow you to list available cameras and switch between them without using the built-in camera picker UI.

## Overview

The camera device management feature includes:
- **`solo.getAvailableMediaDevices()`** - Get list of available camera devices
- **`solo.setMediaDevice(deviceId)`** - Switch to a specific camera device
- **`stream_changed` events** - Automatic notifications when camera changes
- **Seamless integration** - Works with existing monitoring and checkup flows

## API Reference

### `solo.getAvailableMediaDevices()`

Returns a list of available camera devices.

**Returns:** `Promise<{success: boolean, devices: Array<{deviceId: string, label: string}>}>`

```javascript
const result = await solo.getAvailableMediaDevices();
if (result.success) {
    result.devices.forEach((device, index) => {
        console.log(`Camera ${index + 1}: ${device.label} (${device.deviceId})`);
    });
}
```

### `solo.setMediaDevice(deviceId)`

Switches to the specified camera device.

**Parameters:**
- `deviceId` (string) - The device ID of the camera to switch to

**Returns:** `Promise<{success: boolean, streamInfo: object}>`

```javascript
const result = await solo.setMediaDevice(deviceId);
if (result.success) {
    console.log(`Switched to: ${result.streamInfo.label}`);
    console.log(`Resolution: ${result.streamInfo.actualResolution.width}x${result.streamInfo.actualResolution.height}`);
}
```

### `stream_changed` Event

Automatically fired when the camera stream changes.

```javascript
solo.addEventListener('stream_changed', (streamInfo) => {
    console.log('Camera changed to:', streamInfo.label);
    console.log('New resolution:', streamInfo.actualResolution);
});
```

## Complete Implementation Example

Here's a complete example showing how to implement camera selection UI with the SOLO SDK:

```html
<!DOCTYPE html>
<html>
<head>
    <title>SOLO Camera Management Example</title>
    <style>
        .camera-container {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        
        .camera-selector {
            flex: 1;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f9f9f9;
        }
        
        .camera-list {
            display: grid;
            gap: 10px;
            margin-top: 15px;
        }
        
        .camera-button {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
        }
        
        .camera-button:hover {
            background: #f0f0f0;
        }
        
        .camera-button.active {
            background: #e7f3ff;
            border-color: #007bff;
        }
        
        .camera-button.active::before {
            content: "✅ ";
            color: #28a745;
        }
        
        .camera-info {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .camera-label {
            font-size: 0.9em;
            color: #666;
        }
        
        .video-container {
            flex: 2;
            position: relative;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            min-height: 300px;
        }
        
        .video-container video {
            width: 100%;
            height: auto;
        }
        
        .status-overlay {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        
        .controls {
            margin: 20px 0;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        
        .btn:hover { opacity: 0.9; }
        .btn:disabled { 
            background: #ccc; 
            cursor: not-allowed; 
            opacity: 0.6;
        }
        
        .logs {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.85em;
        }
        
        .log-entry {
            margin-bottom: 4px;
            padding: 2px 0;
        }
        
        .log-success { color: #28a745; }
        .log-error { color: #dc3545; }
        .log-info { color: #17a2b8; }
    </style>
</head>
<body>
    <h1>SOLO Camera Device Management Example</h1>
    
    <div class="camera-container">
        <!-- Camera Selection Panel -->
        <div class="camera-selector">
            <h3>Available Cameras</h3>
            <button id="refreshCameras" class="btn btn-secondary">
                🔄 Refresh Camera List
            </button>
            <div id="cameraList" class="camera-list">
                <!-- Camera buttons will be populated here -->
            </div>
        </div>
        
        <!-- Video Display -->
        <div class="video-container">
            <video id="cameraVideo" autoplay muted playsinline></video>
            <div id="statusOverlay" class="status-overlay">
                No camera selected
            </div>
        </div>
    </div>
    
    <!-- Controls -->
    <div class="controls">
        <button id="startMonitoring" class="btn btn-success">
            ▶️ Start Monitoring
        </button>
        <button id="stopMonitoring" class="btn btn-secondary" disabled>
            ⏹️ Stop Monitoring
        </button>
        <button id="startCheckup" class="btn btn-primary">
            🩺 Start 5s Checkup
        </button>
        <button id="clearLogs" class="btn btn-secondary">
            🗑️ Clear Logs
        </button>
    </div>
    
    <!-- Logs -->
    <div class="logs" id="logs">
        <div class="log-entry">Initializing SOLO SDK...</div>
    </div>

    <script src="https://solo-sdk-a0179.web.app/static/js/solo-sdk.js"></script>
    <script>
        class CameraManager {
            constructor() {
                this.solo = null;
                this.currentStream = null;
                this.availableCameras = [];
                this.currentCamera = null;
                this.isMonitoring = false;
                
                this.initializeElements();
                this.initializeSDK();
            }
            
            initializeElements() {
                this.elements = {
                    cameraList: document.getElementById('cameraList'),
                    cameraVideo: document.getElementById('cameraVideo'),
                    statusOverlay: document.getElementById('statusOverlay'),
                    refreshCameras: document.getElementById('refreshCameras'),
                    startMonitoring: document.getElementById('startMonitoring'),
                    stopMonitoring: document.getElementById('stopMonitoring'),
                    startCheckup: document.getElementById('startCheckup'),
                    clearLogs: document.getElementById('clearLogs'),
                    logs: document.getElementById('logs')
                };
                
                // Bind event listeners
                this.elements.refreshCameras.onclick = () => this.loadAvailableCameras();
                this.elements.startMonitoring.onclick = () => this.startMonitoring();
                this.elements.stopMonitoring.onclick = () => this.stopMonitoring();
                this.elements.startCheckup.onclick = () => this.startCheckup();
                this.elements.clearLogs.onclick = () => this.clearLogs();
            }
            
            async initializeSDK() {
                try {
                    this.log('Initializing SOLO SDK...', 'info');
                    
                    // Initialize with your credentials
                    this.solo = window.Solo;
                    await this.solo.init({
                        apiKey: "your-api-key-here",
                        appId: "your-app-id-here"
                    });
                    
                    // Set up user identification
                    await this.solo.identify({
                        userId: "camera-example-user",
                        groupId: "camera-example-group",
                        userName: "Camera Example User",
                        groupName: "Camera Example Group"
                    });
                    
                    // Set up event listeners
                    this.setupEventListeners();
                    
                    // Load available cameras
                    await this.loadAvailableCameras();
                    
                    this.log('✅ SOLO SDK initialized successfully', 'success');
                    
                } catch (error) {
                    this.log(`❌ SDK initialization failed: ${error.message}`, 'error');
                }
            }
            
            setupEventListeners() {
                // Listen for camera stream changes
                this.solo.addEventListener('stream_changed', (streamInfo) => {
                    this.log(`📹 Camera changed: ${streamInfo.label}`, 'info');
                    this.updateCurrentCamera(streamInfo);
                    this.createDisplayStream(streamInfo.deviceId);
                });
                
                // Listen for monitoring events
                this.solo.addEventListener('monitoring_started', () => {
                    this.log('🟢 Monitoring started', 'success');
                    this.isMonitoring = true;
                    this.updateControlButtons();
                });
                
                this.solo.addEventListener('monitoring_ended', () => {
                    this.log('🔴 Monitoring ended', 'info');
                    this.isMonitoring = false;
                    this.updateControlButtons();
                });
                
                this.solo.addEventListener('monitoring_results', (results) => {
                    this.log(`📊 Results: mood=${results.mood?.toFixed(2)}, energy=${results.energy?.toFixed(2)}`, 'success');
                });
                
                this.solo.addEventListener('checkup_results', (results) => {
                    this.log(`🩺 Checkup complete: mood=${results.mood?.toFixed(2)}, stress=${results.stress?.toFixed(2)}`, 'success');
                });
            }
            
            async loadAvailableCameras() {
                try {
                    this.log('🔍 Loading available cameras...', 'info');
                    
                    const result = await this.solo.getAvailableMediaDevices();
                    if (result.success) {
                        this.availableCameras = result.devices;
                        this.renderCameraList();
                        this.log(`📹 Found ${result.devices.length} camera(s)`, 'success');
                    } else {
                        throw new Error('Failed to get camera devices');
                    }
                } catch (error) {
                    this.log(`❌ Error loading cameras: ${error.message}`, 'error');
                }
            }
            
            renderCameraList() {
                this.elements.cameraList.innerHTML = '';
                
                if (this.availableCameras.length === 0) {
                    this.elements.cameraList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No cameras found</div>';
                    return;
                }
                
                this.availableCameras.forEach((camera, index) => {
                    const button = document.createElement('button');
                    button.className = 'camera-button';
                    button.onclick = () => this.switchToCamera(camera.deviceId, camera.label);
                    
                    // Check if this is the current camera
                    const isActive = this.currentCamera?.deviceId === camera.deviceId;
                    if (isActive) {
                        button.classList.add('active');
                    }
                    
                    button.innerHTML = `
                        <div class="camera-info">Camera ${index + 1}</div>
                        <div class="camera-label">${camera.label}</div>
                    `;
                    
                    this.elements.cameraList.appendChild(button);
                });
            }
            
            async switchToCamera(deviceId, label) {
                try {
                    this.log(`🔄 Switching to: ${label}...`, 'info');
                    
                    const result = await this.solo.setMediaDevice(deviceId);
                    if (result.success) {
                        this.log(`✅ Successfully switched to: ${label}`, 'success');
                        this.updateCurrentCamera(result.streamInfo);
                        this.renderCameraList(); // Re-render to update active state
                    } else {
                        throw new Error(result.error || 'Failed to switch camera');
                    }
                } catch (error) {
                    this.log(`❌ Error switching camera: ${error.message}`, 'error');
                }
            }
            
            updateCurrentCamera(streamInfo) {
                this.currentCamera = {
                    deviceId: streamInfo.deviceId,
                    label: streamInfo.label,
                    settings: streamInfo.settings,
                    actualResolution: streamInfo.actualResolution
                };
                
                this.updateStatusOverlay();
            }
            
            updateStatusOverlay() {
                if (this.currentCamera) {
                    const resolution = this.currentCamera.actualResolution;
                    this.elements.statusOverlay.innerHTML = `
                        📹 ${this.currentCamera.label}<br>
                        ${resolution.width}x${resolution.height}
                    `;
                } else {
                    this.elements.statusOverlay.textContent = 'No camera selected';
                }
            }
            
            async createDisplayStream(deviceId) {
                try {
                    // Stop existing stream
                    if (this.currentStream) {
                        this.currentStream.getTracks().forEach(track => track.stop());
                        this.currentStream = null;
                    }
                    
                    // Create new stream for display (using flexible constraints)
                    const constraints = {
                        video: {
                            deviceId: { ideal: deviceId },
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        }
                    };
                    
                    this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                    this.elements.cameraVideo.srcObject = this.currentStream;
                    
                    this.log(`📺 Display stream created for camera`, 'info');
                    
                } catch (error) {
                    this.log(`⚠️ Could not create display stream: ${error.message}`, 'error');
                    // This is expected if camera is in use by SDK
                }
            }
            
            async startMonitoring() {
                try {
                    await this.solo.setSession(`monitoring_${Date.now()}`);
                    await this.solo.setContent('camera-example-content');
                    await this.solo.startMonitoring();
                } catch (error) {
                    this.log(`❌ Error starting monitoring: ${error.message}`, 'error');
                }
            }
            
            async stopMonitoring() {
                try {
                    await this.solo.stopMonitoring();
                } catch (error) {
                    this.log(`❌ Error stopping monitoring: ${error.message}`, 'error');
                }
            }
            
            async startCheckup() {
                try {
                    if (this.isMonitoring) {
                        await this.solo.stopMonitoring();
                    }
                    
                    await this.solo.setSession(`checkup_${Date.now()}`);
                    await this.solo.setContent('checkup');
                    await this.solo.startMonitoring({ duration: 5000 });
                    
                    this.log('🩺 5-second checkup started', 'info');
                } catch (error) {
                    this.log(`❌ Error starting checkup: ${error.message}`, 'error');
                }
            }
            
            updateControlButtons() {
                this.elements.startMonitoring.disabled = this.isMonitoring;
                this.elements.stopMonitoring.disabled = !this.isMonitoring;
            }
            
            log(message, type = 'info') {
                const timestamp = new Date().toLocaleTimeString();
                const entry = document.createElement('div');
                entry.className = `log-entry log-${type}`;
                entry.textContent = `[${timestamp}] ${message}`;
                
                this.elements.logs.appendChild(entry);
                this.elements.logs.scrollTop = this.elements.logs.scrollHeight;
            }
            
            clearLogs() {
                this.elements.logs.innerHTML = '';
            }
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new CameraManager();
        });
    </script>
</body>
</html>
```

## React Implementation Example

For React applications, here's a complete camera management component:

```jsx
import React, { useState, useEffect, useRef } from 'react';

const CameraSelector = ({ solo }) => {
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(null);
    const [stream, setStream] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        if (solo) {
            initializeCameras();
            setupEventListeners();
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [solo]);

    const initializeCameras = async () => {
        try {
            setIsLoading(true);
            const result = await solo.getAvailableMediaDevices();
            if (result.success) {
                setCameras(result.devices);
            }
        } catch (error) {
            console.error('Error loading cameras:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupEventListeners = () => {
        solo.addEventListener('stream_changed', (streamInfo) => {
            setCurrentCamera(streamInfo);
            createDisplayStream(streamInfo.deviceId);
        });
    };

    const switchCamera = async (deviceId, label) => {
        try {
            setIsLoading(true);
            const result = await solo.setMediaDevice(deviceId);
            if (result.success) {
                console.log(`Switched to ${label}`);
            }
        } catch (error) {
            console.error('Error switching camera:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createDisplayStream = async (deviceId) => {
        try {
            // Stop existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            // Create new stream
            const constraints = {
                video: {
                    deviceId: { ideal: deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (error) {
            console.log('Could not create display stream (camera in use by SDK)');
        }
    };

    return (
        <div className="camera-selector">
            <div className="camera-controls">
                <h3>Camera Selection</h3>
                <button onClick={initializeCameras} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '🔄 Refresh Cameras'}
                </button>
                
                <div className="camera-list">
                    {cameras.map((camera, index) => (
                        <button
                            key={camera.deviceId}
                            onClick={() => switchCamera(camera.deviceId, camera.label)}
                            disabled={isLoading}
                            className={`camera-btn ${
                                currentCamera?.deviceId === camera.deviceId ? 'active' : ''
                            }`}
                        >
                            {currentCamera?.deviceId === camera.deviceId && '✅ '}
                            Camera {index + 1}: {camera.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="camera-display">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    style={{ width: '100%', maxWidth: '640px' }}
                />
                {currentCamera && (
                    <div className="camera-info">
                        Current: {currentCamera.label}
                        {currentCamera.actualResolution && (
                            <span> ({currentCamera.actualResolution.width}x{currentCamera.actualResolution.height})</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraSelector;
```

## Integration Patterns

### 1. Simple Camera Dropdown

```javascript
async function createCameraDropdown() {
    const result = await solo.getAvailableMediaDevices();
    const select = document.getElementById('cameraSelect');
    
    select.innerHTML = '<option value="">Select Camera...</option>';
    result.devices.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label;
        select.appendChild(option);
    });
    
    select.onchange = async (e) => {
        if (e.target.value) {
            await solo.setMediaDevice(e.target.value);
        }
    };
}
```

### 2. Camera Grid with Previews

```javascript
async function createCameraGrid() {
    const result = await solo.getAvailableMediaDevices();
    const grid = document.getElementById('cameraGrid');
    
    result.devices.forEach(async (camera, index) => {
        const card = document.createElement('div');
        card.className = 'camera-card';
        card.innerHTML = `
            <div class="camera-preview">
                <video id="preview-${index}" autoplay muted></video>
            </div>
            <div class="camera-info">
                <h4>Camera ${index + 1}</h4>
                <p>${camera.label}</p>
                <button onclick="selectCamera('${camera.deviceId}')">
                    Select
                </button>
            </div>
        `;
        grid.appendChild(card);
        
        // Create preview stream
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: camera.deviceId } }
            });
            document.getElementById(`preview-${index}`).srcObject = stream;
        } catch (e) {
            console.log(`Preview not available for ${camera.label}`);
        }
    });
}

async function selectCamera(deviceId) {
    await solo.setMediaDevice(deviceId);
    // Update UI to show selected camera
}
```

### 3. Auto-Detection and Fallback

```javascript
async function setupCameraWithFallback() {
    const result = await solo.getAvailableMediaDevices();
    
    // Try to find preferred camera (e.g., "HD" in name)
    let preferredCamera = result.devices.find(camera => 
        camera.label.toLowerCase().includes('hd')
    );
    
    // Fallback to first available camera
    if (!preferredCamera && result.devices.length > 0) {
        preferredCamera = result.devices[0];
    }
    
    if (preferredCamera) {
        console.log(`Auto-selecting: ${preferredCamera.label}`);
        await solo.setMediaDevice(preferredCamera.deviceId);
    }
}
```

## Best Practices

### 1. Error Handling

Always wrap camera operations in try-catch blocks and provide user feedback:

```javascript
async function switchCameraWithErrorHandling(deviceId, label) {
    try {
        const result = await solo.setMediaDevice(deviceId);
        if (result.success) {
            showNotification(`Switched to ${label}`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification(`Failed to switch camera: ${error.message}`, 'error');
    }
}
```

### 2. Permission Handling

Check and request camera permissions before using the API:

```javascript
async function ensureCameraPermissions() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            alert('Camera permission is required for this feature');
        }
        return false;
    }
}
```

### 3. Loading States

Provide visual feedback during camera operations:

```javascript
async function switchCameraWithLoading(deviceId, label) {
    const button = document.querySelector(`[data-device-id="${deviceId}"]`);
    button.disabled = true;
    button.textContent = 'Switching...';
    
    try {
        await solo.setMediaDevice(deviceId);
    } finally {
        button.disabled = false;
        button.textContent = label;
    }
}
```

### 4. Memory Management

Clean up video streams to prevent memory leaks:

```javascript
function cleanupVideoStream(video) {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Use in component cleanup or before creating new streams
```

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (iOS 11.3+)
- **Mobile browsers:** Requires HTTPS for camera access

## Common Issues and Solutions

### Issue: Camera switching fails with "NotReadableError"
**Solution:** This occurs when the camera is in use by another application. Ensure only one application accesses the camera at a time.

### Issue: DeviceId changes between browser sessions
**Solution:** Store and match cameras by label instead of deviceId for persistence across sessions.

### Issue: Camera preview doesn't show in test suite
**Solution:** This is expected behavior when the SDK is using the camera. The camera switching still works correctly.

---

For more examples and advanced usage, see the [test suite implementation](../test-solo-sdk/src/components/SoloTestSuite.js). 