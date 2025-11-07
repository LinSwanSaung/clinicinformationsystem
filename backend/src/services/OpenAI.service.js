/* ============================================================================
 * AI SERVICE - GITHUB MODELS (OpenAI SDK)
 * Using GitHub Marketplace free tier: https://github.com/marketplace/models
 * Model: gpt-4o-mini via OpenAI SDK
 * ============================================================================ */

import OpenAI from 'openai';

const LANGUAGE_CONFIGS = {
  en: {
    code: 'en',
    description: 'Respond in warm, encouraging English that feels conversational.',
    headings: {
      whatYouCanDo: 'What You Can Do',
      watchOut: 'Things to Watch Out For',
      callDoctor: 'When to Call Your Doctor',
      livingWell: 'Living Well With This',
      oneMoreThing: 'One More Thing'
    },
    wellnessSections: [
      { emoji: '🥗', title: 'Eating Well' },
      { emoji: '🏃‍♀️', title: 'Getting Moving' },
      { emoji: '🧘', title: 'Taking Care of Your Mind' },
      { emoji: '😴', title: 'Sleeping Better' },
      { emoji: '🛡️', title: 'Staying Healthy' }
    ]
  },
  my: {
    code: 'my',
    description: 'Respond entirely in Burmese (Myanmar language) using Unicode Myanmar script. Keep the tone respectful, warm, and easy to understand for Myanmar patients.',
    headings: {
      whatYouCanDo: 'လုပ်ဆောင်နိုင်သောအချက်များ',
      watchOut: 'သတိထားရမည့်အချက်များ',
      callDoctor: 'ဘယ်အချိန်ဆရာဝန်ကိုခေါ်သင့်သလဲ',
      livingWell: 'ရောဂါနှင့်တည်တံ့နေရန်',
      oneMoreThing: 'နောက်ထပ်အကြောင်းတစ်ခု'
    },
    wellnessSections: [
      { emoji: '🥗', title: 'အာဟာရပြည့်ဝစွာ စားသောက်ပါ' },
      { emoji: '🏃‍♀️', title: 'ခန္ဓာကိုယ်ကို လှုပ်ရှားစေပါ' },
      { emoji: '🧘', title: 'စိတ်ကျန်းမာရေးကို ဂရုစိုက်ပါ' },
      { emoji: '😴', title: 'အိပ်စက်ချိန်ကို ရှင်းလင်းစွာထားပါ' },
      { emoji: '🛡️', title: 'ကျန်းမာရေးကို ကာကွယ်စောင့်ရှောက်ပါ' }
    ]
  }
};

class AIService {
  constructor() {
    // Initialize OpenAI client with GitHub Models endpoint
    this.client = new OpenAI({
      baseURL: process.env.AI_BASE_URL || "https://models.github.ai/inference",
      apiKey: process.env.GITHUB_TOKEN
    });
    this.model = process.env.AI_MODEL || "gpt-4o-mini";
    // AIService initialized with GitHub Models
  }

  getLanguageConfig(language) {
    const key = (language || 'en').toLowerCase();
    const normalizedKey = key === 'mm' || key === 'my-mm' || key === 'my' ? 'my' : key;
    const config = LANGUAGE_CONFIGS[normalizedKey] || LANGUAGE_CONFIGS.en;
    return config;
  }

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

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "You are a caring healthcare coach providing patient-friendly health advice." },
          { role: "user", content: prompt }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1
      });

      const text = response.choices[0].message.content;

      return {
        success: true,
        advice: text,
        diagnosis: diagnosisName,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[AIService] Error generating health advice:', error);
      throw new Error(`Failed to generate health advice: ${error.message}`);
    }
  }

  async generateWellnessTips(language = 'en') {
    try {
      const langConfig = this.getLanguageConfig(language);
      const sections = langConfig.wellnessSections;

      const prompt = `
You are a cheerful wellness coach. ${langConfig.description}
Create a numbered list with the following section titles. For each number:
- Start with the emoji and title (e.g. "1. ${sections[0].emoji} ${sections[0].title}")
- Give 1-2 encouraging sentences with practical advice.
- End with a short note in parentheses that explains why it matters.

Sections to cover:
${sections.map((section, index) => `${index + 1}. ${section.emoji} ${section.title}`).join('\n')}

Keep the tone motivating, friendly, and realistic.`;

      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "You are a cheerful wellness coach providing motivating health tips." },
          { role: "user", content: prompt }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1
      });

      const text = response.choices[0].message.content;

      return {
        success: true,
        tips: text,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[AIService] Error generating wellness tips:', error);
      throw new Error(`Failed to generate wellness tips: ${error.message}`);
    }
  }

  async listAvailableModels() {
    // GitHub Models API doesn't have a list endpoint
    // Return static list of available models
    return [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Current)' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ];
  }
}

export default new AIService();
