# Ajala AI SDK

🌍 A unified JavaScript SDK for seamless AI provider integration

Ajala (Yoruba for "traveler") moves effortlessly between AI providers like Claude, OpenAI, and others with a single, consistent API. Built to eliminate repetitive boilerplate and solve common AI integration pain points.

## Why Ajala?

- **Stop rewriting AI integration code** for every project
- **Unified API** across multiple AI providers  
- **Smart variable interpolation** with validation
- **Type-safe JSON responses** with structure validation
- **Built-in reliability** with retry logic and caching
- **Secure key management** with remote fetching support

## Installation

```bash
npm install ajala-ai-sdk
```

## Quick Start

```javascript
import { ajala } from 'ajala-ai-sdk'

// Initialize once
const ai = ajala.initialize({
  auth: {
    type: "embedded",
    keys: {
      claude: {
        public: "your-claude-public-key",
        private: "your-claude-private-key",
        model: "claude-2" // optional, defaults to latest
      },
      openai: {
        public: "your-openai-public-key",
        private: "your-openai-private-key",
        model: "gpt-4" // optional, defaults to latest
      }
    }
  }
})

// Use anywhere
const result = await ai.prompt('Get weather for {{city}}', {
  expectJson: true,
  jsonStructure: {
    temperature: {
      type: "number",
      minimum: -50,
      maximum: 60,
      description: "Temperature in Celsius"
    },
    condition: {
      type: "string",
      enum: ["sunny", "cloudy", "rainy", "snowy"],
      description: "Weather condition"
    },
    humidity: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Humidity percentage"
    }
  },
  validateJSON: true
}, {
  city: "San Francisco"
})

console.log(result) // { temperature: 22, condition: "sunny", humidity: 65 }
```

## API Reference

### `ajala.initialize(config)`

Initialize the SDK with your configuration.

```javascript
const ai = ajala.initialize({
  auth: {
    type: "embedded" | "fetch",
    url?: "https://your-api.com/keys", // required if type is "fetch" returns the keys structure below
    keys?: {
      claude: {
        public: "key",
        private: "key",
        model: "claude-2"
      },
      openai: {
        public: "key",
        private: "key",
        model: "gpt-4"
      }
      // add more providers
    }
  },
  settings?: {
    retryOnFail: true,      // retry failed requests
    cachable: false,        // cache responses
    trimPrompt: false       // trim whitespace from prompts
  }
})
```

#### Authentication Options

**Embedded Keys:**
```javascript
auth: {
  type: "embedded",
  keys: {
    claude: "sk-ant-...",
    openai: "sk-..."
  }
}
```

**Remote Key Fetching:**
```javascript
auth: {
  type: "fetch",
  url: "https://your-secure-endpoint.com/ai-keys"
}
```
*Your endpoint should return JSON matching the keys structure above.*

### `ai.prompt(promptString, options?, variables?)`

Send a prompt to an AI provider with smart variable interpolation and response handling.

```javascript
const result = await ai.prompt(
  'Analyze the sentiment of: {{text}}',
  {
    expectJson?: boolean,
    jsonStructure?: object,
    validateJSON?: boolean,
    errorOnInvalidJSON?: boolean,
    retryOnFail?: boolean,      // override global setting
    cachable?: boolean,         // override global setting
    trimPrompt?: boolean        // override global setting
  },
  {
    text: "I love this product!"
  }
)
```

#### Parameters

**`promptString`** *(string, required)*
- Your prompt template with optional `{{VARIABLE}}` placeholders
- Variables must be provided in the `variables` parameter

**`options`** *(object, optional)*
- `expectJson` - Set to `true` if you expect a JSON response
- `jsonStructure` - Define the expected JSON structure for validation
- `validateJSON` - Validate response against `jsonStructure` (requires `expectJson: true`)
- `errorOnInvalidJSON` - Throw error if JSON validation fails
- Settings overrides: `retryOnFail`, `cachable`, `trimPrompt`

**`variables`** *(object, optional)*
- Key-value pairs for `{{VARIABLE}}` interpolation in your prompt
- All variables referenced in prompt string must be provided

#### Return Value

Returns the AI response as a string, or parsed JSON object if `expectJson: true`.

## Examples

### Basic Text Response

```javascript
const ai = ajala.initialize({
  auth: { type: "embedded", keys: { claude: "your-key" }}
})

const story = await ai.prompt('Write a short story about {{topic}}', {}, {
  topic: "space exploration"
})

console.log(story) // Returns the generated story as a string
```

### Advanced JSON Validation

```javascript
const analysis = await ai.prompt(
  'Analyze this text for sentiment: {{text}}',
  {
    expectJson: true,
    jsonStructure: {
      sentiment: {
        type: "string",
        enum: ["positive", "negative", "neutral"],
        description: "The sentiment of the text",
        required: true
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score between 0 and 1",
        required: true
      },
      keywords: {
        type: "array",
        items: {
          type: "string",
          minLength: 2,
          maxLength: 20
        },
        minItems: 1,
        uniqueItems: true,
        description: "Key words found in the text"
      },
      entities: {
        type: "object",
        properties: {
          people: {
            type: "array",
            items: { type: "string" }
          },
          places: {
            type: "array", 
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    },
    validateJSON: true,
    errorOnInvalidJSON: true
  },
  {
    text: "I absolutely love this new feature!"
  }
)

console.log(analysis)
// {
//   sentiment: "positive",
//   confidence: 0.95,
//   keywords: ["love", "feature", "new"],
//   entities: { people: [], places: [] }
// }
```

### Remote Authentication

```javascript
// Your secure endpoint returns: { claude: "key1", openai: "key2" }
const ai = ajala.initialize({
  auth: {
    type: "fetch",
    url: "https://your-api.com/ai-keys"
  }
})

const result = await ai.prompt('Hello {{name}}!', {}, { name: "World" })
```

### Error Handling

```javascript
try {
  const result = await ai.prompt('Process {{data}}', {
    expectJson: true,
    validateJSON: true,
    errorOnInvalidJSON: true,
    jsonStructure: { 
      result: {
        type: "string",
        required: true
      }, 
      status: {
        type: "number",
        minimum: 0,
        maximum: 999
      }
    }
  }, {
    data: "some input"
  })
} catch (error) {
  if (error.type === 'MISSING_VARIABLE') {
    console.log('Required variable not provided:', error.variable)
  } else if (error.type === 'INVALID_JSON') {
    console.log('Response doesn\'t match expected structure')
  } else if (error.type === 'API_ERROR') {
    console.log('AI provider error:', error.message)
  }
}
```

## Configuration Best Practices

### Environment-Based Setup

```javascript
// Development
const ai = ajala.initialize({
  auth: {
    type: "embedded",
    keys: {
      claude: process.env.CLAUDE_DEV_KEY
    }
  },
  settings: {
    retryOnFail: true,
    cachable: true // Cache for faster development
  }
})

// Production
const ai = ajala.initialize({
  auth: {
    type: "fetch",
    url: process.env.AI_KEYS_ENDPOINT // Secure remote key fetching
  },
  settings: {
    retryOnFail: true,
    cachable: false // Fresh responses in production
  }
})
```

## Error Types

Ajala provides specific error types for better error handling:

- `MISSING_VARIABLE` - Required variable not provided
- `INVALID_JSON` - Response doesn't match expected JSON structure  
- `API_ERROR` - AI provider returned an error
- `NETWORK_ERROR` - Request failed (retry may help)
- `AUTH_ERROR` - Authentication failed
- `VALIDATION_ERROR` - Input validation failed

## Roadmap

### V2 Features (Coming Soon)
- **Streaming responses** for real-time output
- **Template management** for reusable prompts
- **Usage tracking** and cost estimation
- **Advanced middleware** and hooks

### Development Setup

```bash
git clone https://github.com/spiderocious/ajala-ai-sdk
cd ajala-ai-sdk
npm install
npm run dev
```

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with ❤️ for developers who want to focus on features, not AI provider differences.