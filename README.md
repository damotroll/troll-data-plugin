# Troll From Filler - Free Test Data Generator

A Chrome/Chromium browser extension that fills forms with realistic test data for development and demos using the Random User API - completely free, no API key required!

## Features

- 🎉 **100% Free**: Uses the free Random User API - no API key or signup needed!
- 🎯 **Smart Field Detection**: Automatically detects and categorizes form fields (email, phone, address, etc.)
- 🌍 **Multi-Country Support**: Generate data for 18+ different countries
- ⚡ **Multiple Fill Modes**: Fill all forms or only visible forms
- 🔧 **Customizable Options**: Choose between realistic or clearly fake test data
- 👤 **Consistent Person Mode**: Use the same person's data across all fields
- 💼 **Professional UI**: Clean, modern interface with visual feedback
- ⚡ **Lightning Fast**: No AI processing delays - instant form filling!

## Installation

### Step 1: Prepare the Extension Files

1. Create a new folder called `troll-data-plugin`
2. Save all the provided files into this folder:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `styles.css`

### Step 2: Create Icon Files

Create simple icon files (or use any 128x128 PNG image):
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use a simple colored square or download free icons from sites like [IconFinder](https://www.iconfinder.com) or [Flaticon](https://www.flaticon.com).

### Step 3: Load the Extension

#### For Chrome:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your `troll-data-plugin` folder
5. The extension will appear in your extensions list

#### For Chromium-based Browsers (Edge, Brave, Opera, Comet):
1. Navigate to the extensions page:
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Opera: `opera://extensions/`
   - Comet: Check browser settings for extensions
2. Enable "Developer mode"
3. Click "Load unpacked" or similar option
4. Select your `troll-data-plugin` folder

## Setup

No setup required! The extension works out of the box with no API keys or configuration needed.

Simply install the extension and start using it immediately!

## Usage

### Basic Usage:
1. Navigate to any webpage with forms
2. Click the extension icon
3. Choose your filling option:
   - **"Fill Forms on This Page"**: Fills all detected forms
   - **"Fill Visible Forms Only"**: Only fills currently visible forms
4. Watch as the forms are automatically filled with realistic test data

### Options:
- **Target Country**: Select a specific country for data generation (US, UK, Canada, Germany, France, etc.)
- **Use realistic data**: Generates believable test data vs. obviously fake test data
- **Fill password fields**: Includes password fields in auto-fill
- **Smart context detection**: Analyzes page context for better data generation
- **Use same person across fields**: Ensures consistent person data throughout the form

## Field Types Supported

The extension intelligently detects and fills:
- Personal Information (names, emails, phones)
- Addresses (street, city, state, zip, country)
- Account Information (usernames, passwords)
- Payment Details (credit card numbers - test only)
- Dates and Times
- Descriptions and Comments
- Select dropdowns
- And more...

## API Usage and Costs

**Completely FREE!** This extension uses the [Random User API](https://randomuser.me), which is:
- 100% free to use
- No API key required
- No rate limits for reasonable usage
- Provides high-quality, realistic test data
- Supports multiple countries and locales

## Security Notes

- No API keys or authentication required
- The extension fetches random user data from Random User API
- All data is fictional and generated for testing purposes only
- No real personal information is processed or stored
- Your settings are saved locally in your browser only

## Troubleshooting

### Extension Not Working:
1. Verify you have internet connection (required for Random User API)
2. Check browser console for errors (F12)
3. Try refreshing the page
4. Make sure you're on a regular webpage (not chrome:// pages)

### Forms Not Detected:
1. Some dynamic forms may need page refresh
2. Forms in iframes may not be accessible
3. Try "Fill Visible Forms Only" option
4. Check if forms are actually empty (extension skips pre-filled fields)

### API Errors:
1. Check your internet connection
2. Random User API may be temporarily down (rare)
3. Extension will fall back to local data generation if API fails

## Development

### File Structure:
```
smart-form-filler/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic
├── content.js        # Page interaction
├── background.js     # API calls and data generation
├── styles.css        # Visual feedback styles
└── icons/           # Extension icons
```

### Customization:
- Modify field patterns in `content.js` for custom field detection
- Adjust field mapping in `background.js` for different data generation
- Customize UI in `popup.html` and CSS
- Add more countries to the `nationalityMap` in `background.js`

## Privacy Policy

This extension:
- Only processes form structure, not user data
- Fetches fictional user data from Random User API
- Settings are stored locally in your browser only
- Does not collect or transmit any personal information
- Generated data is fictional and for testing only
- No analytics or tracking

## License

This extension is provided as-is for testing and development purposes.

## Support

For issues or suggestions:
1. Check the browser console for error messages
2. Verify internet connection (Random User API requires internet)
3. Try different country options
4. Refresh the page and retry

## Credits

This extension is powered by:
- [Random User API](https://randomuser.me) - Free, open-source API for generating random user data

## Disclaimer

This tool generates FAKE data for testing and demonstration purposes only. Never use generated data for real transactions or submissions.