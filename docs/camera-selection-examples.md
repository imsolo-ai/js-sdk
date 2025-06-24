# Camera Selection Examples

This guide provides practical examples for implementing camera selection UI using the SOLO SDK's camera device management API.

## Quick Start

The SOLO SDK provides three main methods for camera management:

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

## Example 1: Simple Camera Dropdown

```html
<select id="cameraSelect">
    <option value="">Select a camera...</option>
</select>

<script>
async function setupCameraDropdown() {
    const select = document.getElementById('cameraSelect');
    
    // Load available cameras
    const result = await solo.getAvailableMediaDevices();
    if (result.success) {
        result.devices.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label;
            select.appendChild(option);
        });
    }
    
    // Handle camera selection
    select.addEventListener('change', async (e) => {
        if (e.target.value) {
            try {
                const result = await solo.setMediaDevice(e.target.value);
                if (result.success) {
                    console.log('Camera switched successfully');
                }
            } catch (error) {
                console.error('Failed to switch camera:', error);
            }
        }
    });
}

// Initialize after SOLO SDK is ready
solo.init(credentials).then(() => {
    setupCameraDropdown();
});
</script>
```

## Example 2: Camera Grid with Selection

```html
<div id="cameraGrid" class="camera-grid"></div>

<style>
.camera-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.camera-card {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
}

.camera-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.camera-card.active {
    border-color: #28a745;
    background: #f8fff8;
}

.camera-card.active::before {
    content: "✅ ";
    color: #28a745;
    font-size: 1.2em;
}

.camera-info h3 {
    margin: 0 0 8px 0;
    font-size: 1.1em;
}

.camera-info p {
    margin: 0;
    color: #666;
    font-size: 0.9em;
}
</style>

<script>
async function setupCameraGrid() {
    const grid = document.getElementById('cameraGrid');
    let currentCameraId = null;
    
    // Load cameras
    const result = await solo.getAvailableMediaDevices();
    if (!result.success) return;
    
    result.devices.forEach((camera, index) => {
        const card = document.createElement('div');
        card.className = 'camera-card';
        card.dataset.deviceId = camera.deviceId;
        
        card.innerHTML = `
            <div class="camera-info">
                <h3>Camera ${index + 1}</h3>
                <p>${camera.label}</p>
            </div>
        `;
        
        card.addEventListener('click', async () => {
            try {
                const result = await solo.setMediaDevice(camera.deviceId);
                if (result.success) {
                    // Update UI
                    document.querySelectorAll('.camera-card').forEach(c => 
                        c.classList.remove('active')
                    );
                    card.classList.add('active');
                    currentCameraId = camera.deviceId;
                }
            } catch (error) {
                console.error('Failed to switch camera:', error);
            }
        });
        
        grid.appendChild(card);
    });
    
    // Listen for external camera changes
    solo.addEventListener('stream_changed', (streamInfo) => {
        document.querySelectorAll('.camera-card').forEach(card => {
            card.classList.toggle('active', 
                card.dataset.deviceId === streamInfo.deviceId
            );
        });
        currentCameraId = streamInfo.deviceId;
    });
}
</script>
```

## Example 3: React Component

```jsx
import React, { useState, useEffect, useRef } from 'react';

const CameraSelector = ({ solo }) => {
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(null);
    const [loading, setLoading] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (solo) {
            loadCameras();
            
            // Listen for camera changes
            solo.addEventListener('stream_changed', handleStreamChanged);
            
            return () => {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [solo]);

    const loadCameras = async () => {
        try {
            setLoading(true);
            const result = await solo.getAvailableMediaDevices();
            if (result.success) {
                setCameras(result.devices);
            }
        } catch (error) {
            console.error('Error loading cameras:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStreamChanged = (streamInfo) => {
        setCurrentCamera(streamInfo);
        createPreviewStream(streamInfo.deviceId);
    };

    const selectCamera = async (camera) => {
        try {
            setLoading(true);
            const result = await solo.setMediaDevice(camera.deviceId);
            if (result.success) {
                console.log(`Switched to ${camera.label}`);
            }
        } catch (error) {
            console.error('Error switching camera:', error);
        } finally {
            setLoading(false);
        }
    };

    const createPreviewStream = async (deviceId) => {
        try {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Create new stream
            const constraints = {
                video: {
                    deviceId: { ideal: deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
        } catch (error) {
            console.log('Preview not available');
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px' }}>
            {/* Camera List */}
            <div style={{ flex: 1 }}>
                <h3>Available Cameras</h3>
                <button onClick={loadCameras} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
                
                <div style={{ marginTop: '15px' }}>
                    {cameras.map((camera, index) => (
                        <button
                            key={camera.deviceId}
                            onClick={() => selectCamera(camera)}
                            disabled={loading}
                            style={{
                                display: 'block',
                                width: '100%',
                                margin: '5px 0',
                                padding: '10px',
                                border: currentCamera?.deviceId === camera.deviceId 
                                    ? '2px solid #007bff' 
                                    : '1px solid #ddd',
                                background: currentCamera?.deviceId === camera.deviceId 
                                    ? '#e7f3ff' 
                                    : 'white',
                                borderRadius: '4px',
                                cursor: loading ? 'default' : 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            {currentCamera?.deviceId === camera.deviceId && '✅ '}
                            Camera {index + 1}: {camera.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Video Preview */}
            <div style={{ flex: 2 }}>
                <video 
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        maxWidth: '640px',
                        background: '#000',
                        borderRadius: '8px'
                    }}
                />
                {currentCamera && (
                    <p style={{ textAlign: 'center', marginTop: '10px' }}>
                        Current: {currentCamera.label}
                        {currentCamera.actualResolution && 
                            ` (${currentCamera.actualResolution.width}x${currentCamera.actualResolution.height})`
                        }
                    </p>
                )}
            </div>
        </div>
    );
};

export default CameraSelector;
```

## Best Practices

### 1. Always Handle Errors

```javascript
async function switchCamera(deviceId) {
    try {
        const result = await solo.setMediaDevice(deviceId);
        if (!result.success) {
            throw new Error(result.error || 'Failed to switch camera');
        }
        console.log('Camera switched successfully');
    } catch (error) {
        console.error('Camera switch failed:', error.message);
        // Show user-friendly error message
        showNotification('Failed to switch camera. Please try again.', 'error');
    }
}
```

### 2. Provide Loading States

```javascript
async function loadCamerasWithFeedback() {
    const button = document.getElementById('loadButton');
    button.disabled = true;
    button.textContent = 'Loading...';
    
    try {
        await loadCameras();
    } finally {
        button.disabled = false;
        button.textContent = 'Refresh Cameras';
    }
}
```

### 3. Clean Up Resources

```javascript
function cleanup() {
    // Stop preview streams
    if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        previewStream = null;
    }
    
    // Remove video sources
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.srcObject = null;
    });
}

// Call cleanup on page unload
window.addEventListener('beforeunload', cleanup);
```

For complete API reference, see the [full documentation](camera-device-management.md). 