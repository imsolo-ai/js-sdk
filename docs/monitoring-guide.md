# Solo SDK - Enhanced Monitoring Guide

## Overview

The Solo SDK provides an enhanced monitoring system that allows you to track user engagement and emotions in real-time. The `startMonitoring` function now supports additional parameters for greater control over the monitoring process.

## startMonitoring Function

The `startMonitoring` function can be called with optional parameters to customize the monitoring behavior:

```javascript
// Basic usage (standard monitoring)
solo.startMonitoring();

// With options
solo.startMonitoring({
  duration: 10000,           // Optional: Automatically stop after 10 seconds
  detectionInterval: 500     // Optional: Custom detection interval (ms)
});
```

### Parameters

The `startMonitoring` function accepts a single options object with the following properties:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `duration` | Number | No | N/A | The duration to run monitoring in milliseconds before automatically stopping. If not provided, monitoring will continue until manually stopped. |
| `detectionInterval` | Number | No | 200 | The interval between detection frames in milliseconds. Lower values provide more frequent updates but may impact performance. |

## Time Measurement

The monitoring system uses high-precision time measurement to accurately track:

- **Played Seconds**: The time elapsed during the current monitoring session
- **Monitoring Duration**: The total time spent monitoring

Both values are measured using actual elapsed time rather than estimation based on intervals, ensuring accurate data collection even if there are processing delays or performance issues.

## Examples

### Standard Monitoring

Start monitoring with default settings:

```javascript
solo.startMonitoring();
```

### Time-Limited Monitoring

Start monitoring that will automatically stop after a specified duration:

```javascript
// Monitor for 30 seconds then auto-stop
solo.startMonitoring({ duration: 30000 });
```

### Custom Detection Interval

Adjust the frequency of detection frames:

```javascript
// Use a 500ms interval between detections
solo.startMonitoring({ detectionInterval: 500 });
```

### Combined Parameters

Use both duration and custom interval:

```javascript
// Monitor for 1 minute with 300ms detection interval
solo.startMonitoring({
  duration: 60000,
  detectionInterval: 300
});
```

## Data Collection

When monitoring is active and the `collectUsageData` configuration flag is enabled, the system automatically collects and sends detection data:

- Every time `CHECKUP_DURATION` is reached
- When monitoring is stopped
- When a new content ID is set (via `setContent`)
- When a new session ID is set (via `setSession`)

## Performance Considerations

- The monitoring system uses `requestAnimationFrame` when available for optimal performance, falling back to `setTimeout` when not available.
- Lower `detectionInterval` values (more frequent detections) may impact performance on less powerful devices.
- The actual detection interval may vary slightly based on device performance, but the time measurement will remain accurate.

## Stopping Monitoring

Monitoring can be stopped in several ways:

```javascript
// Manual stop
solo.stopMonitoring();

// Automatic stop after duration (if specified)
solo.startMonitoring({ duration: 5000 }); // Will stop after 5 seconds
```

## Browser Compatibility

The enhanced monitoring features are supported in all modern browsers that support the Solo SDK.

## Related Functions

- `stopMonitoring()`: Stops the current monitoring session
- `setContent(contentId)`: Sets the content ID and restarts monitoring if active
- `setSession(sessionId)`: Sets the session ID and restarts monitoring if active 