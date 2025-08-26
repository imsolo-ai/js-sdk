# Video Input Guide (Pre‑Recorded Video Monitoring)

This guide shows how to analyze pre‑recorded videos using the same API flow as live camera monitoring. The iframe controls video playback; you just provide an HTMLVideoElement and call `startMonitoring()`.

## When to use
- You need to analyze stored clips rather than a live camera.
- You want the same events (`monitoring_started`, `live_results`, `monitoring_ended`) and backend transparency.

## Requirements
- SOLO JS SDK `solo.setVideoInput(videoElement)` available
- The video source must be accessible to the iframe. If you pass a blob URL, the SDK will transfer the Blob to the iframe.

## Basic Flow
```javascript
import solo from 'solo-js-sdk';

await solo.init({ apiKey: YOUR_API_KEY, appId: YOUR_APP_ID });

solo.addEventListener('live_results', (res) => {
  // res.time is the video timestamp in ms
  console.log('live_results', res.time, res);
});

solo.addEventListener('monitoring_started', (res) => {
  console.log('monitoring_started', res); // { mode: 'video', duration, startTime }
});

solo.addEventListener('monitoring_ended', (res) => {
  console.log('monitoring_ended', res); // { mode: 'video', reason, totalDuration }
});

// Identify the user (optional but recommended)
await solo.identify({ userId: 'user-123' });

// 1) Provide your video element
const video = document.createElement('video');
video.src = '/videos/sample.mp4';  // Can be URL or blob URL
// Optionally, preload metadata
await new Promise((r) => { video.onloadedmetadata = r; video.onerror = r; });

// 2) Tell the SDK to use this video
await solo.setVideoInput(video); // iframe will control playback

// 3) Start monitoring (playback will start inside the iframe)
await solo.startMonitoring();
```

## Using URL Sources (Quick)
```javascript
import solo from 'solo-js-sdk';

await solo.init({ apiKey: YOUR_API_KEY, appId: YOUR_APP_ID });
await solo.identify({ userId: 'user-123' });

// Provide a URL-based video
const video = document.createElement('video');
video.crossOrigin = 'anonymous'; // required if served from a different origin
video.src = 'https://cdn.example.com/videos/clip.mp4';

// (Optional) wait for metadata so you can read duration, etc.
await new Promise((r) => { video.onloadedmetadata = r; video.onerror = r; });

// Tell the SDK to analyze this URL source (iframe will handle playback)
await solo.setVideoInput(video);
await solo.startMonitoring();
```

### CORS & Hosting Notes
- If your video is hosted on another domain, enable CORS with at least `Access-Control-Allow-Origin: *` (or your site origin).
- Set `video.crossOrigin = 'anonymous'` before assigning `src`.
- Prefer direct MP4/WebM links over streaming manifests (HLS/DASH) for consistent frame access.

## HTML + File Upload Example
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SOLO Video Monitoring</title>
    <script type="module">
      import solo from 'https://unpkg.com/solo-js-sdk?module';

      async function boot() {
        await solo.init({ apiKey: 'YOUR_API_KEY', appId: 'YOUR_APP_ID' });

        solo.addEventListener('monitoring_started', (res) => console.log('monitoring_started', res));
        solo.addEventListener('live_results', (res) => console.log('live_results', res));
        solo.addEventListener('monitoring_ended', (res) => console.log('monitoring_ended', res));

        await solo.identify({ userId: 'video-user' });

        const input = document.getElementById('videoFile');
        input.addEventListener('change', async () => {
          const file = input.files[0];
          if (!file) return;
          const videoEl = document.createElement('video');
          videoEl.src = URL.createObjectURL(file);
          await new Promise((r) => { videoEl.onloadedmetadata = r; videoEl.onerror = r; });
          await solo.setVideoInput(videoEl);
          await solo.startMonitoring();
        });
      }

      boot();
    </script>
  </head>
  <body>
    <input id="videoFile" type="file" accept="video/*" />
  </body>
</html>
```

## HTML + URL Input Example
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SOLO Video Monitoring via URL</title>
    <script type="module">
      import solo from 'https://unpkg.com/solo-js-sdk?module';

      async function boot() {
        await solo.init({ apiKey: 'YOUR_API_KEY', appId: 'YOUR_APP_ID' });

        solo.addEventListener('live_results', (res) => console.log('live_results', res));

        await solo.identify({ userId: 'url-user' });

        const button = document.getElementById('startFromUrl');
        button.addEventListener('click', async () => {
          const url = (document.getElementById('videoUrl').value || '').trim();
          if (!url) return;
          const videoEl = document.createElement('video');
          videoEl.crossOrigin = 'anonymous';
          videoEl.src = url;
          await new Promise((r) => { videoEl.onloadedmetadata = r; videoEl.onerror = r; });
          await solo.setVideoInput(videoEl);
          await solo.startMonitoring();
        });
      }

      boot();
    </script>
  </head>
  <body>
    <input id="videoUrl" type="text" placeholder="https://example.com/video.mp4" style="width:400px" />
    <button id="startFromUrl">Start</button>
  </body>
</html>
```

## Events
- `monitoring_started`: `{ mode: 'video', duration, startTime }`
- `live_results`: includes `time` (video timestamp in ms) and emotion fields
- `monitoring_ended`: `{ mode: 'video', reason: 'video_completed'|'manual_stop', totalDuration }`

## Notes & Tips
- The iframe controls playback; your page shouldn’t call `video.play()`.
- Blob URLs from file inputs are supported; the SDK forwards the Blob to the iframe.
- The backend remains unchanged; tracker `time` is set to the video timestamp.
- If you don’t see results immediately, wait for the video to reach frames with visible faces or ensure lighting/pose isn’t filtered by your model thresholds.
