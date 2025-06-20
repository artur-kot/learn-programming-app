# AI Assistant Integration

This Electron app now includes an AI Assistant that uses Ollama to provide local AI-powered coding assistance.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

2. **Pull the Qwen2.5 Coder model**:
   ```bash
   ollama pull qwen2.5-coder:14b
   ```

3. **Start Ollama service**:
   ```bash
   ollama serve
   ```

## Features

- **Local AI Processing**: All AI processing happens locally on your machine using Ollama
- **Streaming Responses**: Real-time streaming of AI responses for better user experience
- **Dynamic Model Detection**: Automatically detects and lists all available models from Ollama
- **Model Information**: Shows model sizes and last modified dates
- **Connection Status**: Visual indicator showing if Ollama is connected
- **Error Handling**: Clear error messages when connection issues occur
- **Model Refresh**: Button to refresh the list of available models

## Usage

1. **Access the AI Assistant**: 
   - Click on your profile menu in the top-right corner
   - Select "AI Assistant"

2. **Select a Model**: 
   - Choose from your available models in the dropdown
   - Models show their size in GB for reference
   - Use the refresh button to update the model list

3. **Ask Questions**: 
   - Type your coding questions in the input field
   - Press Enter or click Send
   - Watch the AI response stream in real-time

4. **Example Prompts**:
   - "How do I create a React component?"
   - "Debug this JavaScript code: [paste your code]"
   - "Explain the difference between let, const, and var"
   - "Help me optimize this function"

## Technical Details

### Architecture
- **Main Process**: Handles HTTP requests to Ollama API
- **Renderer Process**: UI components and user interaction
- **IPC Communication**: Secure communication between processes via preload script

### API Endpoints Used
- `POST http://localhost:11434/api/generate` - Stream AI responses
- `GET http://localhost:11434/api/tags` - Get available models

### Streaming Implementation
- Uses node-fetch v3 for HTTP requests
- Processes streaming responses line by line
- Real-time UI updates as responses stream in

### Model Management
- Automatically fetches available models on startup
- Shows model sizes and modification dates
- Allows manual refresh of model list
- Handles model selection and validation

## Troubleshooting

### Connection Issues
1. **Ollama not running**: Start with `ollama serve`
2. **Model not found**: Pull the model with `ollama pull qwen2.5-coder:14b`
3. **Port conflicts**: Ensure port 11434 is available

### Model Issues
1. **No models shown**: Click the refresh button or restart the app
2. **Model not working**: Try pulling the model again with `ollama pull [model-name]`
3. **Model size issues**: Ensure you have enough disk space

### Performance Issues
1. **Slow responses**: Consider using a smaller model
2. **High memory usage**: Close other applications to free up RAM
3. **Model loading**: First request may be slower as the model loads

### Development
- The AI Assistant is located at `/ai-assistant` route
- Main component: `src/components/AIAssistant.tsx`
- IPC handlers: `src/main.ts`
- Preload script: `src/preload.ts`

## Security Notes

- All AI processing happens locally on your machine
- No data is sent to external servers
- Ollama API runs on localhost only
- IPC communication is restricted to specific methods only 