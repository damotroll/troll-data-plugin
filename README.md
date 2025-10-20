# Smart Form Filler - AI-Powered Test Data Generator

A Chrome/Chromium browser extension that intelligently fills forms with AI-generated dummy data for testing and demos using OpenAI's API.

## Features

- 🤖 **AI-Powered Data Generation**: Uses OpenAI's GPT models to generate contextually appropriate test data
- 🎯 **Smart Field Detection**: Automatically detects and categorizes form fields (email, phone, address, etc.)
- 🎨 **Context-Aware**: Analyzes page context to generate relevant data (login forms, checkout, registration)
- ⚡ **Multiple Fill Modes**: Fill all forms or only visible forms
- 🔧 **Customizable Options**: Choose between realistic or clearly fake test data
- 🔒 **Secure**: API key stored locally in browser storage
- 💼 **Professional UI**: Clean, modern interface with visual feedback

## Installation

### Step 1: Prepare the Extension Files

1. Create a new folder called `smart-form-filler`
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
4. Select your `smart-form-filler` folder
5. The extension will appear in your extensions list

#### For Chromium-based Browsers (Edge, Brave, Opera, Comet):
1. Navigate to the extensions page:
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Opera: `opera://extensions/`
   - Comet: Check browser settings for extensions
2. Enable "Developer mode"
3. Click "Load unpacked" or similar option
4. Select your `smart-form-filler` folder

## Setup

1. **Get OpenAI API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com)
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure Extension**:
   - Click the extension icon in your browser toolbar
   - Paste your OpenAI API key
   - Select your preferred model:
     - **GPT-4o-mini**: Fastest and most cost-effective
     - **GPT-4o**: Best quality responses
     - **GPT-3.5-turbo**: Legacy option
   - Click "Save Settings"

## Usage

### Basic Usage:
1. Navigate to any webpage with forms
2. Click the extension icon
3. Choose your filling option:
   - **"Fill Forms on This Page"**: Fills all detected forms
   - **"Fill Visible Forms Only"**: Only fills currently visible forms
4. Watch as the forms are automatically filled with AI-generated data

### Options:
- **Use realistic data**: Generates believable test data
- **Fill password fields**: Includes password fields in auto-fill
- **Smart context detection**: Analyzes page context for better data generation

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

The extension uses OpenAI's API, which has usage-based pricing:
- **GPT-4o-mini**: ~$0.00015 per form (cheapest)
- **GPT-4o**: ~$0.001 per form
- **GPT-3.5-turbo**: ~$0.0002 per form

Typical usage for testing/demos is very cost-effective.

## Security Notes

- API keys are stored locally in your browser
- Never share your API key
- The extension only sends form field metadata to OpenAI, not actual user data
- Generated data is dummy/fake data for testing only
- No real personal information is processed or stored

## Troubleshooting

### Extension Not Working:
1. Check that your API key is valid
2. Verify you have internet connection
3. Check browser console for errors (F12)
4. Try refreshing the page

### Forms Not Detected:
1. Some dynamic forms may need page refresh
2. Forms in iframes may not be accessible
3. Try "Fill Visible Forms Only" option

### API Errors:
1. Verify API key is correct
2. Check OpenAI API status
3. Ensure you have API credits
4. Try a different model

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
- Adjust prompts in `background.js` for different data generation
- Customize UI in `popup.html` and CSS

## Privacy Policy

This extension:
- Only processes form structure, not user data
- Stores API keys locally in browser
- Sends only field metadata to OpenAI for generation
- Does not collect or transmit personal information
- Generated data is fictional and for testing only

## License

This extension is provided as-is for testing and development purposes.

## Support

For issues or suggestions:
1. Check the browser console for error messages
2. Verify API key and internet connection
3. Try different model options
4. Refresh the page and retry

## Disclaimer

This tool generates FAKE data for testing and demonstration purposes only. Never use generated data for real transactions or submissions.