# Hollister Global Facilities - Setup Guide

## Overview

This is an immersive interactive application showcasing Hollister's manufacturing facilities worldwide with real-time animated operations.

## Features

### 🌍 Interactive Globe
- **Real-time Earth visualization** with continental rendering
- **4 Manufacturing Facilities** marked with interactive markers:
  - Ballina, Ireland
  - Stuarts Draft, Virginia, USA
  - Bawal, India
  - Kaunas, Lithuania
- **Smooth animation** zooming toward the primary facility
- **Click to explore** any facility location

### 🏭 Immersive Facility View
When you click on a facility, you'll see:
- **Background facility image** (your factory photo)
- **Animated robots** simulating assembly work with moving arms and grippers
- **Operators** working at stations with natural body movements
- **AGV (Automated Guided Vehicle)** transporting materials through the facility
- **Real-time status dashboard** showing operational metrics
- **Interactive information panels** with facility details

### 🎬 Live Animations
- **Collaborative Robots**: Multi-axis arms with realistic assembly motion
- **Human Operators**: Detailed figures in white coats with natural movements
  - Bobbing motion (standing work)
  - Swinging arms (active work)
  - Walking motions
- **AGV Navigation**: Autonomous vehicle moving through facility with status lights
- **Environmental Effects**: Grid overlay, subtle lighting, atmospheric rendering

---

## Setup Instructions

### 1. Basic Usage (Without Custom Image)
Simply open `index.html` in a modern web browser to see the application with placeholder facility views.

```bash
# Serve locally (if you have a web server)
python3 -m http.server 8000

# Then open in browser:
# http://localhost:8000
```

### 2. Adding Your Factory Image (Recommended)

#### Option A: Using the Embedding Script (Easiest)

1. **Place your factory image** in the project directory
   ```bash
   cp /path/to/hollister-factory.jpg ./factory-photo.jpg
   ```

2. **Run the embedding script**
   ```bash
   node embed-image.js ./factory-photo.jpg
   ```

3. **Result**: The image will be automatically embedded in all 4 facility views

#### Option B: Manual Base64 Encoding

1. **Convert your image to Base64**
   ```bash
   # On macOS/Linux
   base64 ./factory-photo.jpg | head -c 20
   
   # Or use Python
   python3 -c "import base64; print(base64.b64encode(open('factory-photo.jpg', 'rb').read()).decode())"
   ```

2. **Update the HTML file**
   Open `index.html` and find the `facilityDetails` object (around line 230).
   Replace the `image: null` lines with:
   ```javascript
   image: 'data:image/jpeg;base64,YOUR_VERY_LONG_BASE64_STRING_HERE'
   ```

#### Option C: Load from URL

If your image is hosted online, simply update the facility details:
```javascript
image: 'https://example.com/hollister-factory.jpg'
```

---

## File Structure

```
Hello-World/
├── index.html              # Main application (open this)
├── embed-image.js          # Helper script to embed images
├── FACILITY-SETUP.md       # This file
└── factory-photo.jpg       # (optional) Your factory image
```

---

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- WebGL support (for 3D globe)
- Internet connection (for Three.js library)

## Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome/Chromium | ✅ Fully Supported |
| Firefox | ✅ Fully Supported |
| Safari (Mac/iOS) | ✅ Fully Supported |
| Edge | ✅ Fully Supported |
| Internet Explorer | ❌ Not Supported |

---

## Customization

### Change Facility Locations
Edit the `locations` array in `index.html` (around line 20):
```javascript
const locations = [
    { name: 'Your Location', lat: 0.0, lon: 0.0, country: 'Country', facility: 'code' },
    // Add more locations...
];
```

### Adjust Animation Speeds
Find the animation functions in `startFacilityAnimation()` and modify:
- `animationTime * 0.008` - Change this multiplier for robot arm speed
- `agv.cycleLength: 6000` - Change cycle time in milliseconds

### Modify Robot Behavior
Edit the `drawRobot()` function to adjust:
- Arm colors: `ctx.strokeStyle = '#00ff88'`
- Arm lengths: `const armLength = 50`
- Number of robots: Add/remove from `robots` array

---

## Tips & Tricks

### Performance
- **For slower devices**: Reduce the globe resolution by changing `THREE.SphereGeometry(1, 64, 64)` to `(1, 32, 32)`
- **Smoother animations**: Use Chrome for best performance

### High-Quality Images
- **Recommended image format**: JPEG with 1920x1080px or higher
- **File size**: Keep under 5MB for fast loading
- **Aspect ratio**: 16:9 works best for the facility view canvas

### Custom Factory Tours
You can use this as a template for all 4 facilities. Simply update:
1. Background image
2. Robot/operator positions
3. Facility information text

---

## API Reference

### Key Functions

```javascript
// Open facility view
openFacility(facilityCode)  // 'ballina', 'stuarts-draft', 'bawal', 'kaunas'

// Close facility view
closeFacility()

// Start facility animations
startFacilityAnimation(facilityCode)
```

### Facility Codes
- `ballina` - Ballina, Ireland
- `stuarts-draft` - Stuarts Draft, Virginia, USA
- `bawal` - Bawal, India
- `kaunas` - Kaunas, Lithuania

---

## Troubleshooting

### Image Not Showing
- Check file format (JPEG, PNG, GIF, WebP supported)
- Verify file path is correct
- Try Base64 encoding instead of file path

### Animations Stuttering
- Close other browser tabs to free up resources
- Update to the latest browser version
- Reduce globe resolution

### 3D Globe Not Rendering
- Ensure WebGL is enabled in your browser
- Try a different browser
- Check that Three.js CDN is accessible

---

## Feature Roadmap

Future enhancements:
- [ ] VR facility tour support
- [ ] Real-time facility metrics integration
- [ ] Multiple camera views
- [ ] Facility comparison view
- [ ] Production statistics dashboard
- [ ] Employee spotlight features
- [ ] Supply chain visualization

---

## Support

For issues or feature requests, please refer to the main project documentation.

---

**Hollister Incorporated - Uniting in Purpose**
