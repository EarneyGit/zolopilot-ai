# ZoloPilot AI - Advanced Startup Mind Map Generator

A sophisticated AI-powered mind map generator designed specifically for startup planning and business development. Built with React, Firebase, and modern web technologies.

## 🚀 Live Demo

**Deployed on Vercel**: [https://zolopilot-ai.vercel.app](https://zolopilot-ai.vercel.app)

## Features

### 🚀 Core Features
- **AI-Powered Mind Map Generation**: Convert startup ideas into structured visual mind maps
- **Multiple LLM Support**: Built-in support for Google Gemini, OpenAI, and Anthropic APIs
- **Interactive Editing**: Double-click to edit nodes, add children, and delete nodes
- **Real-time Persistence**: Automatic saving to Firebase Firestore
- **Anonymous Authentication**: Seamless user experience with Firebase Auth
- **Modern Dark UI**: Beautiful gradient backgrounds with glassmorphism effects
- **Responsive Design**: Works across desktop, tablet, and mobile devices

### 🧠 AI-Generated Content
- **Dynamic Goal Setting System**: AI suggests the best goal-setting framework for your startup
- **Team & Role Analysis**: AI recommends team composition with AI vs. Human role assignments
- **Comprehensive Business Structure**: 8 main categories covering all aspects of startup planning

### 📊 Mind Map Structure
1. **Idea & Market Validation**
2. **Business Planning**
3. **Team & Legal Structure**
4. **Marketing & Sales**
5. **Financials**
6. **Operations and Growth**
7. **Goal Setting System** (AI-customized)
8. **Team & Roles** (AI vs. Human analysis)

## Technology Stack

- **Frontend**: React 18 with Vite + Plain JavaScript (JSX)
- **Language**: Pure JavaScript (JSX) - No TypeScript for simplicity
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Anonymous)
- **AI Integration**: Google Gemini 2.0 Flash (configured), OpenAI GPT-3.5-turbo, Anthropic Claude
- **State Management**: React Hooks

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project (for data persistence)
- AI API key (optional - defaults to demo mode)

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd startup-mindmap-generator
npm install
```

2. **Firebase Setup**
   - Create a Firebase project at https://firebase.google.com/
   - Enable Authentication and Firestore
   - Copy your Firebase config to `src/firebase.js`

3. **AI API Configuration** (Optional)
   - Get an API key from your preferred provider:
     - Google AI Studio: https://makersuite.google.com/app/apikey
     - OpenAI: https://platform.openai.com/api-keys
     - Anthropic: https://console.anthropic.com/
   - Update the configuration in `src/App.jsx`

4. **Start Development Server**
```bash
npm run dev
```

## 🔒 Security Features

### Security Improvements
- **Environment Variables**: API keys moved from hardcoded values to environment variables
- **Input Validation**: Comprehensive validation and sanitization of user inputs
- **JSON Schema Validation**: Secure parsing of LLM responses with structure validation
- **XSS Protection**: Content sanitization to prevent cross-site scripting
- **Security Headers**: CSP, X-Frame-Options, and other protective headers
- **Dependency Scanning**: Automated security audits with npm audit

### Security Headers
The application includes the following security headers:
- `Content-Security-Policy`: Restricts resource loading to trusted sources
- `X-Frame-Options`: Prevents clickjacking attacks
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts access to browser features

### Secure Deployment
For production deployment:
1. Use environment variables for all sensitive data
2. Enable HTTPS/SSL certificates
3. Configure proper CORS policies
4. Run security audits regularly: `npm run security:audit`
5. Keep dependencies updated: `npm run security:fix`

## Configuration

### Environment Variables Setup
Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# LLM API Keys (at least one required)
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key

# Security Configuration
VITE_ENVIRONMENT=production
VITE_CSP_ENABLED=true
```

### Firebase Setup
**Note**: Firebase configuration is now handled via environment variables for security.

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### LLM Configuration
In `src/App.jsx`, the Google Gemini configuration is already set up:

```javascript
const [selectedLLM] = useState('gemini') // Currently configured for Gemini
const [llmApiKey] = useState('AIzaSy...') // Your Gemini API key is configured
```

To switch to other providers, change the `selectedLLM` and `llmApiKey` values.

## Usage

1. **Enter Startup Idea**: Type your startup concept in the text area
2. **Generate Mind Map**: Click "Generate Mind Map" to create your visual plan
3. **Try Demo**: Click "Try Demo" to see the interactive features immediately
4. **Test API**: Click "Test API" to verify your OpenAI connection is working
5. **Edit Nodes**: Double-click any node to edit its content
6. **Add Children**: Hover over nodes and click the "+" button to add sub-nodes
7. **Delete Nodes**: Hover over nodes and click the trash icon to remove them
8. **Auto-Save**: Changes are automatically saved to Firebase

## API Integration

### Supported LLM Providers

#### Google Gemini (Currently Configured)
- Model: `gemini-2.0-flash-exp`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- Header: `x-goog-api-key`
- Status: ✅ **Ready to use with your API key**

#### OpenAI
- Model: `gpt-3.5-turbo`
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Header: `Authorization: Bearer`

#### Anthropic
- Model: `claude-3-sonnet-20240229`
- Endpoint: `https://api.anthropic.com/v1/messages`
- Header: `x-api-key`

## Project Structure

```
startup-mindmap-generator/
├── src/
│   ├── components/
│   │   ├── MindMapNode.jsx     # Interactive mind map node component
│   │   └── LoadingSpinner.jsx  # Loading indicator component
│   ├── firebase.js             # Firebase configuration and utilities
│   ├── App.jsx                 # Main application component
│   ├── index.css               # Global styles with Tailwind
│   └── main.jsx                # Application entry point
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Features in Detail

### Mind Map Visualization
- **Hierarchical Layout**: Root → Categories → Subcategories
- **Modern Dark Theme**: Gradient backgrounds with glassmorphism effects
- **Visual Differentiation**: Purple/pink gradients for different node levels
- **Interactive Elements**: Hover effects, edit buttons, tooltips
- **Smooth Animations**: Transitions and shadow effects
- **Responsive Grid**: Adapts to different screen sizes

### AI-Generated Insights
- **Smart Goal Setting**: AI analyzes your startup and suggests OKRs, SMART goals, or other frameworks
- **Team Composition**: Recommends specific roles and whether AI or humans are better suited
- **Success Stories**: Provides examples of companies that used similar strategies
- **Customized Content**: All suggestions are tailored to your specific startup idea

### Data Persistence
- **Real-time Sync**: Changes are saved immediately to Firebase
- **User Sessions**: Anonymous authentication maintains user sessions
- **Automatic Recovery**: Mind maps are restored when users return
- **Conflict Resolution**: Handles concurrent edits gracefully

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production (includes security check)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run security:audit` - Run security audit
- `npm run security:fix` - Fix security vulnerabilities
- `npm run security:check` - Check for moderate+ security issues

### Adding New LLM Providers
1. Add configuration to the `configs` object in `callLLM` function
2. Define URL, headers, payload structure, and response parser
3. Test with your API key and update the `selectedLLM` state

## Troubleshooting

### Common Issues
1. **Firebase Not Configured**: Update `src/firebase.js` with your project credentials
2. **API Key Missing**: Add your LLM API key to the `llmApiKey` state
3. **CORS Issues**: Ensure your domain is whitelisted in your AI provider's settings
4. **Build Errors**: Check Node.js version compatibility

### Error Messages
- "Failed to authenticate user" - Check Firebase configuration
- "Please add your API key" - Update the LLM API key in the code
- "API Error: 401" - Verify your API key is correct and active
- "API Error: 400" - Check the console for detailed error messages
- "Invalid mind map structure" - The AI response format was unexpected

### Debugging API Issues
1. **Use the Test API button** - This will help verify your OpenAI connection
2. **Check the browser console** - Look for detailed error messages
3. **Try GPT-4 if needed** - Change `gpt-3.5-turbo` to `gpt-4` in the code
4. **Verify API key format** - Should start with `sk-proj-` or `sk-`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Firebase and AI provider documentation
3. Create an issue on the repository

---

Built with ❤️ for founders and entrepreneurs who want to visualize their startup journey.
