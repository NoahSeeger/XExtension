// popup.js

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

document.addEventListener("DOMContentLoaded", () => {
  const enableToggle = document.getElementById("enableToggle");
  const customPrompt = document.getElementById("customPrompt");
  const savePromptBtn = document.getElementById("savePrompt");
  const resetPromptBtn = document.getElementById("resetPrompt");
  const statusDiv = document.getElementById("status");

  // Load saved settings
  loadSettings();

  // Toggle functionality
  enableToggle.addEventListener("click", () => {
    const isEnabled = enableToggle.classList.contains("active");
    const newState = !isEnabled;

    enableToggle.classList.toggle("active");
    saveSetting("commentButtonEnabled", newState);

    // Send message to content script to show/hide button
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        tabs[0] &&
        (tabs[0].url.includes("twitter.com") || tabs[0].url.includes("x.com"))
      ) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleCommentButton",
          enabled: newState,
        });
      }
    });

    showStatus(
      "Comment generation " + (newState ? "enabled" : "disabled"),
      "success"
    );
  });

  // Save custom prompt
  savePromptBtn.addEventListener("click", () => {
    const prompt = customPrompt.value.trim();
    if (prompt) {
      saveSetting("customPrompt", prompt);
      showStatus("Custom prompt saved successfully!", "success");
    } else {
      showStatus("Please enter a custom prompt", "error");
    }
  });

  // Reset to default prompt
  resetPromptBtn.addEventListener("click", () => {
    customPrompt.value = DEFAULT_PROMPT;
    saveSetting("customPrompt", DEFAULT_PROMPT);
    showStatus("Reset to default prompt", "success");
  });

  function loadSettings() {
    chrome.storage.sync.get(
      ["commentButtonEnabled", "customPrompt"],
      (result) => {
        // Load toggle state
        const isEnabled = result.commentButtonEnabled !== false; // Default to true
        if (isEnabled) {
          enableToggle.classList.add("active");
        }

        // Load custom prompt
        const savedPrompt = result.customPrompt || DEFAULT_PROMPT;
        customPrompt.value = savedPrompt;
      }
    );
  }

  function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving setting:", chrome.runtime.lastError);
        showStatus("Error saving setting", "error");
      }
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }
});
