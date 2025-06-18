// background.js

const GEMINI_API_KEY = "AIzaSyBRvSmhoUiF5cFMpGpwx7XHflu9NkacUNw"; // Replace with your actual Gemini API Key

const DEFAULT_PROMPT = `You are a clever, authentic Twitter user with a sharp sense for timing and tone. You've just seen this tweet and want to reply with a short, natural-sounding comment.

Your reply must:
- Add value: insight, reflection, or a unique perspective
- Or: be witty, clever, sarcastic (only if the tone fits)
- Or: express subtle agreement or disagreement, like a real user would
- Feel spontaneous, human, and casual – no robotic or overly polished phrasing
- Be tailored to the tweet's style and tone
- Stay under 280 characters

Avoid:
- Any mention of being AI
- Overexplaining or summarizing the tweet
- Generic or vague statements

→ Only reply with the comment. No intro, no explanations, no markdown.

Here's the tweet:
"\${tweet}"`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRecommendation") {
    const tweet = request.tweet;

    async function fetchGeminiRecommendation() {
      try {
        // Get custom prompt from storage
        const result = await chrome.storage.sync.get(["customPrompt"]);
        const prompt = result.customPrompt || DEFAULT_PROMPT;

        // Replace ${tweet} placeholder with actual tweet content
        const finalPrompt = prompt.replace(/\${tweet}/g, tweet);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: finalPrompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Gemini API error: ${response.status} ${response.statusText} - ${errorData.error.message}`
          );
        }

        const data = await response.json();
        const recommendation = data.candidates[0].content.parts[0].text;
        sendResponse({ success: true, recommendation: recommendation });
      } catch (error) {
        console.error("Error fetching Gemini recommendation:", error);
        sendResponse({ success: false, error: error.message });
      }
    }

    fetchGeminiRecommendation();
    return true; // Indicates that the response will be sent asynchronously
  }
});
