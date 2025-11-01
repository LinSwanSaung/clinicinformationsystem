import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-2.5-flash which has broader regional availability
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });
    
    console.log('[GeminiService] Initialized with Gemini API key');
  }

  /**
   * Generate health advice based on diagnosis
   */
  async generateHealthAdvice(diagnosisName, patientAge = null, patientGender = null) {
    try {
      const prompt = `You're a friendly and caring health advisor helping a patient understand their condition. They've been diagnosed with "${diagnosisName}".
      ${patientAge ? `They're ${patientAge} years old.` : ''}
      ${patientGender ? `Gender: ${patientGender}.` : ''}
      
      Write in a warm, supportive tone like you're talking to a friend or family member. Use simple everyday language, not medical jargon. Think of it as explaining things to someone you care about over a cup of tea. 🍵

      Cover these points (use emojis to make it friendly and scannable):
      
      ## 💪 What You Can Do
      Give 3-5 practical, easy-to-follow tips for managing this condition. Start with the simplest things they can do today.
      
      ## ⚠️ Things to Watch Out For
      List 3-5 warning signs or things to avoid. Be honest but not scary - frame it as "your body might be telling you something."
      
      ## 🚨 When to Call Your Doctor
      Explain specific symptoms that mean "don't wait, get help now." Make it clear and urgent but not panic-inducing.
      
      ## 🌟 Living Well With This
      Share 2-3 lifestyle changes that can make a real difference. Focus on what they CAN do, not just what they can't.
      
      ## 💡 One More Thing
      Add a brief, encouraging note - maybe a "did you know?" fact or a reassuring message.
      
      Use short paragraphs, bullet points where helpful, and a conversational tone. Include relevant emojis to break up the text and make it feel less clinical.
      
      End with: *Remember, this is general guidance to help you understand your condition better. Always follow your doctor's specific advice for your situation - they know you best! 💙*`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        advice: text,
        diagnosis: diagnosisName,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[GeminiService] Error generating health advice:', error);
      throw new Error(`Failed to generate health advice: ${error.message}`);
    }
  }

  /**
   * Generate general wellness tips (no specific diagnosis)
   */
  async generateWellnessTips() {
    try {
      const prompt = `Hey there! 👋 Share some friendly, practical wellness tips like you're giving advice to a good friend.

      Cover these areas, but make each tip feel personal and doable:
      
      🥗 **Eating Well** - Not a lecture about nutrition, just real talk about food choices
      🏃 **Getting Moving** - Exercise that doesn't feel like punishment 
      😌 **Taking Care of Your Mind** - Mental health without the heavy stuff
      😴 **Sleeping Better** - Actual tips that work, not just "go to bed earlier"
      🩺 **Staying Healthy** - Smart preventive care that's not overwhelming
      
      Write like you're texting a friend - short sentences, upbeat tone, maybe throw in an emoji or two. Focus on small wins and realistic changes, not perfection.
      
      Give 5-6 tips total, mixing from different areas. End each tip with a quick "why it matters" or a fun fact to keep it interesting.
      
      Format as a friendly numbered list with emojis. Make it feel like "you got this!" not "you should do this." ✨`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        tips: text,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[GeminiService] Error generating wellness tips:', error);
      throw new Error(`Failed to generate wellness tips: ${error.message}`);
    }
  }
}

export default new GeminiService();
