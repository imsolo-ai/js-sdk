# Solo SDK Quick Start Guide

This guide will help you get started with the Solo SDK and take advantage of its enhanced monitoring features.

## Installation

Include the Solo SDK in your HTML:

```html
<script src="path/to/solo-sdk.js"></script>
```

Or install via npm:

```bash
npm install solo-js-sdk
```

## Basic Usage

### Initializing the SDK

```javascript
// Initialize with your API credentials
solo.init({
  apiKey: 'YOUR_API_KEY',
  appId: 'YOUR_APP_ID'
}).then(() => {
  console.log('SDK initialized successfully');
}).catch(error => {
  console.error('SDK initialization failed:', error);
});
```

### Identifying a User

```javascript
// Identify the current user
solo.identify({
  userId: 'user-123',
  userName: 'John Doe',    // Optional
  groupId: 'group-456',    // Optional
  groupName: 'Team Alpha', // Optional
  sessionId: 'session-789' // Optional
});
```

### Setting Content

```javascript
// Set the current content being viewed
solo.setContent('content-456');
```

### Setting Session

```javascript
// Set or update the current session
solo.setSession('session-789');
```

## Monitoring

### Start Standard Monitoring

```javascript
// Start monitoring with default settings
solo.startMonitoring();
```

### Start Enhanced Monitoring

#### Time-Limited Monitoring

```javascript
// Start monitoring that will automatically stop after 30 seconds
solo.startMonitoring({ duration: 30000 });
```

#### Custom Detection Interval

```javascript
// Start monitoring with a custom detection interval of 500ms
solo.startMonitoring({ detectionInterval: 500 });
```

#### Combined Parameters

```javascript
// Start monitoring with both duration and custom interval
solo.startMonitoring({
  duration: 60000,          // 1 minute
  detectionInterval: 300    // 300ms intervals
});
```

### Stop Monitoring

```javascript
// Stop monitoring manually
solo.stopMonitoring();
```

## Events

Listen for SDK events:

```javascript
// Add event listeners
solo.addEventListener('monitoring_started', () => {
  console.log('Monitoring started');
});

solo.addEventListener('monitoring_ended', () => {
  console.log('Monitoring ended');
});

solo.addEventListener('monitoring_results', (results) => {
  console.log('Monitoring results:', results);
});

solo.addEventListener('live_results', (results) => {
  console.log('Live results:', results);
});
```

## Next Steps

For more detailed information, see the [Monitoring Guide](./monitoring-guide.md). 