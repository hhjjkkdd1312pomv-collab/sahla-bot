const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const app = express();

const TWILIO_ACCOUNT_SID = 'AC103730371bdda1c6057eb93337723995';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = '+14155238886';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
app.use(express.urlencoded({ extended: false }));

const SYSTEM_PROMPT = `أنت مساعد ودود لمتجر ملابس.
رد على أسئلة المنتجات فقط.
كن احترافياً وودياً وبسيطاً.`;

async function processMessage(userMessage, fromNumber) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = response.data.choices[0].message.content;
    
    await client.messages.create({
      body: botReply,
      from: TWILIO_PHONE,
      to: fromNumber
    });
    
    console.log(`✅ Replied to ${fromNumber}`);
  } catch (error) {
    console.error('Error:', error.message);
    await client.messages.create({
      body: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
      from: TWILIO_PHONE,
      to: fromNumber
    });
  }
}

app.post('/webhook/twilio', async (req, res) => {
  const userMessage = req.body.Body;
  const fromNumber = req.body.From;
  await processMessage(userMessage, fromNumber);
  res.send('<Response></Response>');
});

app.get('/health', (req, res) => {
  res.json({ status: 'Bot is running ✅' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot running on port ${PORT}`);
});

module.exports = app;
