// File: api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  // Vercel sẽ tự động lấy GEMINI_API_KEY từ phần cài đặt bảo mật của bạn
  const API_KEY = process.env.GEMINI_API_KEY; 

  const SYSTEM_PROMPT = `You are a friendly, patient foreign English teacher named Linh. Your goal is to help beginners practice English speaking conversationally. 
  1. Tone & Pace: Be extremely gentle, patient, and encouraging. 
  2. Language: Primarily use English. However, you MUST seamlessly insert short Vietnamese explanations if you introduce a new concept. 
  3. Vocabulary & Grammar: Strictly restrict vocabulary to A1-A2 levels. NO complex grammar.
  4. Response Length: Provide slightly longer responses to practice listening.
  5. Conversation Flow: Never let the conversation die. Ask open-ended questions.
  6. INCOMPLETE SENTENCES: If the user's sentence is incomplete (e.g., "Uhm..."), DO NOT correct grammar. Say: "Take your time...", "I'm listening...".
  7. SPEECH-TO-TEXT ERROR HANDLING: If the user's input contains weird words due to mic errors, guess what they meant based on context.
  8. Voice Optimization: Use fillers (Hmm..., Well...). Use commas and ellipses... to slow down.
  OUTPUT FORMAT:
  [English response]
  ---
  *(Vietnamese translation)*
  **🛠 Sửa lỗi ngữ pháp (Grammar Check):**
  - [Explain errors or praise them]
  **💡 Gợi ý từ vựng (Vocabulary):**
  - [Word]: [Meaning]`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    
    // Trả về duy nhất câu text của AI cho Frontend
    res.status(200).json({ text: data.candidates[0].content.parts[0].text });
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống máy chủ." });
  }
}