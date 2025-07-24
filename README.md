# X Comment Generator

A Chrome extension that generates engaging comments for tweets using AI, with direct insertion into Twitter's reply field.

## ✨ Features

### 🤖 AI-Powered Comment Generation

- Generate contextual, engaging comments for any tweet
- Uses Google's Gemini AI for natural-sounding responses
- Customizable prompts to match your writing style

### 🔧 Easy Configuration

- **Enable/Disable**: Toggle the comment generation button on Twitter
- **Custom Prompts**: Create your own AI prompts or use the default
- **API Key Management**: Secure storage of your Gemini API key
- **Settings Persistence**: All preferences saved automatically

### 🎯 Seamless Integration

- **Direct Insertion**: Comments appear directly in Twitter's reply field
- **One-Click Generation**: Click "Generate Comment" and reply instantly
- **No Copy-Paste**: No need to manually copy and paste text
- **Smart Detection**: Automatically finds tweet content to analyze

## 🚀 Installation

1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get your free Gemini API key
2. **Download Extension**: Clone or download this repository
3. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder
4. **Configure**: Click the extension icon and enter your API key

## 📖 Usage

1. **Navigate to Twitter**: Go to any tweet on X (Twitter)
2. **Click Reply**: Open the reply interface
3. **Generate Comment**: Click the "Generate Comment" button
4. **Review & Send**: The AI-generated comment appears in the reply field
5. **Post**: Click "Reply" to send your comment

## ⚙️ Configuration

### Custom Prompts

Create your own AI prompts to generate different types of comments:

- Professional responses
- Casual conversations
- Humorous replies
- Supportive messages

Use `${tweet}` in your prompt to reference the original tweet content.

### API Key Setup

- Get your free API key from Google AI Studio
- Enter it in the extension popup
- Test the connection to ensure it works
- Your key is stored securely in Chrome's sync storage

## 🔒 Privacy & Security

- **Local Processing**: All text processing happens locally
- **Secure Storage**: API keys stored securely in Chrome's sync storage
- **No Data Collection**: Extension doesn't collect or store your data
- **Your API Key**: You control your own Gemini API usage

## 🛠️ Technical Details

- **Framework**: Vanilla JavaScript Chrome Extension
- **AI Provider**: Google Gemini 2.0 Flash
- **Integration**: React Props method for seamless Twitter integration
- **Compatibility**: Works with Twitter's Draft.js editor

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

---

**Note**: This extension is for personal use and should comply with Twitter's Terms of Service and API usage guidelines.
