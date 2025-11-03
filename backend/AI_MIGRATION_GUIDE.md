# AI Model Migration Guide

## Status: Gemini → New AI Model

**Date:** November 2, 2025  
**Status:** Gemini code commented out, awaiting new AI model integration

---

## What Was Done

### 1. Commented Out Gemini Integration
- ✅ `backend/src/services/Gemini.service.js` - Original Gemini class fully commented with backup header
- ✅ `backend/src/routes/ai.routes.js` - Updated to use `aiService` instead of `geminiService`
- ✅ `backend/.env` - Gemini API keys commented out

### 2. Created Placeholder AIService
- New `AIService` class in `Gemini.service.js` (file not renamed to avoid breaking imports)
- Methods maintained: `generateHealthAdvice()`, `generateWellnessTips()`, `listAvailableModels()`
- Currently throws error: "New AI model not configured yet"

---

## Integration Steps for New AI Model

### Step 1: Add API Credentials to `.env`

Open `backend/.env` and add your new AI model credentials:

```env
# NEW AI MODEL Configuration
NEW_AI_API_KEY=your_api_key_here
NEW_AI_MODEL=your_model_name_here
NEW_AI_ENDPOINT=your_endpoint_url_here  # if applicable
```

**Example for OpenAI:**
```env
NEW_AI_API_KEY=sk-proj-...your-key...
NEW_AI_MODEL=gpt-4
```

**Example for Anthropic Claude:**
```env
NEW_AI_API_KEY=sk-ant-...your-key...
NEW_AI_MODEL=claude-3-sonnet-20240229
```

**Example for Cohere:**
```env
NEW_AI_API_KEY=...your-key...
NEW_AI_MODEL=command-r-plus
```

---

### Step 2: Install New AI SDK

Run in `backend/` directory:

**For OpenAI:**
```bash
npm install openai
```

**For Anthropic Claude:**
```bash
npm install @anthropic-ai/sdk
```

**For Cohere:**
```bash
npm install cohere-ai
```

---

### Step 3: Update `Gemini.service.js`

Open `backend/src/services/Gemini.service.js` and replace the `AIService` class constructor:

#### OpenAI Example:
```javascript
import OpenAI from 'openai';

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.NEW_AI_API_KEY
    });
    console.log('[AIService] Initialized with OpenAI');
  }
  
  // ... rest of methods
}
```

#### Anthropic Claude Example:
```javascript
import Anthropic from '@anthropic-ai/sdk';

class AIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.NEW_AI_API_KEY
    });
    console.log('[AIService] Initialized with Claude');
  }
  
  // ... rest of methods
}
```

#### Cohere Example:
```javascript
import { CohereClient } from 'cohere-ai';

class AIService {
  constructor() {
    this.client = new CohereClient({
      token: process.env.NEW_AI_API_KEY
    });
    console.log('[AIService] Initialized with Cohere');
  }
  
  // ... rest of methods
}
```

---

### Step 4: Update `generateHealthAdvice()` Method

Find the `generateHealthAdvice()` method and uncomment/implement the API call:

#### OpenAI Example:
```javascript
async generateHealthAdvice(diagnosisName, patientAge = null, patientGender = null, language = 'en') {
  try {
    const langConfig = this.getLanguageConfig(language);
    const { headings } = langConfig;

    const prompt = `
You are a caring healthcare coach. ${langConfig.description}
Keep explanations short, practical, and encouraging. Use friendly emojis where they help the reader.

Patient details:
- Diagnosed condition: ${diagnosisName}
${patientAge ? `- Age: ${patientAge}` : ''}
${patientGender ? `- Gender: ${patientGender}` : ''}

Write the response in Markdown using the following section headings exactly as provided:
## ${headings.whatYouCanDo}
List 3-5 simple, actionable steps the patient can begin right away.
## ${headings.watchOut}
Share 3-5 signs, symptoms, or habits they should be careful about.
## ${headings.callDoctor}
Explain specific situations when they should contact a doctor immediately.
## ${headings.livingWell}
Offer 2-3 lifestyle adjustments or daily habits that make living with this condition easier.
## ${headings.oneMoreThing}
Finish with a short uplifting reminder or surprising fact to keep them motivated.

Keep paragraphs short (1-2 sentences each) and use bullet lists where it improves readability. End with a brief reminder to follow their doctor's personal advice.`;

    const completion = await this.client.chat.completions.create({
      model: process.env.NEW_AI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const text = completion.choices[0].message.content;

    return {
      success: true,
      advice: text,
      diagnosis: diagnosisName,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[AIService] Error generating health advice:', error);
    throw new Error(`Failed to generate health advice: ${error.message}`);
  }
}
```

#### Anthropic Claude Example:
```javascript
const completion = await this.client.messages.create({
  model: process.env.NEW_AI_MODEL || 'claude-3-sonnet-20240229',
  max_tokens: 1500,
  messages: [{ role: 'user', content: prompt }]
});

const text = completion.content[0].text;
```

#### Cohere Example:
```javascript
const completion = await this.client.generate({
  model: process.env.NEW_AI_MODEL || 'command-r-plus',
  prompt: prompt,
  max_tokens: 1500,
  temperature: 0.7
});

const text = completion.generations[0].text;
```

---

### Step 5: Update `generateWellnessTips()` Method

Similar pattern to `generateHealthAdvice()` - use the same API call structure with the wellness tips prompt.

---

### Step 6: Test the Integration

1. **Restart backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test endpoints:**
   ```bash
   # Get wellness tips (no diagnosis needed)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "http://localhost:3001/ai/wellness-tips?lang=en"

   # Get health advice for patient
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "http://localhost:3001/ai/health-advice/PATIENT_ID?lang=en"
   ```

3. **Check logs:**
   Look for `[AIService] Initialized with [YourAI]` in console output.

---

## Rollback to Gemini (If Needed)

If the new AI model doesn't work and you need to rollback:

1. **Uncomment Gemini code** in `Gemini.service.js`:
   - Remove `//` from all commented Gemini lines
   - Delete or comment out the new `AIService` class

2. **Uncomment Gemini API keys** in `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyDusbls37oZ-ci4Rrv1atT9fYKFpaQ326M
   GOOGLE_API_KEY=AIzaSyDusbls37oZ-ci4Rrv1atT9fYKFpaQ326M
   ```

3. **Update imports** in `ai.routes.js`:
   ```javascript
   import geminiService from '../services/Gemini.service.js';
   // Change all aiService → geminiService
   ```

4. **Restart server**

---

## Current Language Support

The system supports English and Myanmar (Burmese) languages:
- `lang=en` → English health advice
- `lang=my` or `lang=mm` → Myanmar language advice

Make sure your new AI model can handle Myanmar Unicode text if keeping multilingual support.

---

## Files Modified

1. `backend/src/services/Gemini.service.js` - Original commented, new AIService added
2. `backend/src/routes/ai.routes.js` - Updated to use aiService
3. `backend/.env` - Gemini keys commented, placeholders added

---

## Next Steps

1. **Provide me with:**
   - New AI model name (OpenAI, Claude, Cohere, etc.)
   - API key
   - Model identifier (e.g., `gpt-4`, `claude-3-sonnet`, etc.)

2. **I will:**
   - Install the SDK
   - Implement the API calls
   - Test the integration
   - Confirm it's working

3. **Once confirmed working:**
   - We can delete the commented Gemini code
   - Clean up the service file

---

## Questions?

**Q: Will this break the patient portal AI features?**  
A: Currently, the endpoints will return errors until the new AI is configured. The frontend will show "Failed to load" messages.

**Q: Can we keep both Gemini and the new AI?**  
A: Yes! We can create a config flag to switch between them without deleting code.

**Q: What if the new AI model has different pricing?**  
A: Monitor your API usage dashboard. Most models charge per token (input + output).

---

**Ready to integrate?** Provide the new AI model details and I'll complete the integration!
