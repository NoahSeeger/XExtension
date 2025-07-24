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
  const automationToggle = document.getElementById("automationToggle");
  const likesCountSpan = document.getElementById("likesCount");
  const retweetsCountSpan = document.getElementById("retweetsCount");
  const commentsCountSpan = document.getElementById("commentsCount");
  const automationLogsDiv = document.getElementById("automationLogs");

  // API Key elements
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKey");
  const testApiKeyBtn = document.getElementById("testApiKey");
  const apiKeyStatus = document.getElementById("apiKeyStatus");

  // Automation Action Settings
  const likeEnabled = document.getElementById("likeEnabled");
  const likeChance = document.getElementById("likeChance");
  const likeChanceValue = document.getElementById("likeChanceValue");
  const retweetEnabled = document.getElementById("retweetEnabled");
  const retweetChance = document.getElementById("retweetChance");
  const retweetChanceValue = document.getElementById("retweetChanceValue");
  const commentEnabled = document.getElementById("commentEnabled");
  const commentChance = document.getElementById("commentChance");
  const commentChanceValue = document.getElementById("commentChanceValue");

  // Load saved settings
  loadSettings();

  // Load stats and logs
  loadAutomationStatsAndLogs();

  // Listen for updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateAutomationStats") {
      updateStats(message.stats);
    } else if (message.action === "addAutomationLog") {
      addLog(message.log);
    }
  });

  // API Key functionality
  saveApiKeyBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      saveSetting("geminiApiKey", apiKey);
      updateApiKeyStatus("valid", "✅ API Key saved");
      showStatus("API Key saved successfully!", "success");
    } else {
      showStatus("Please enter a valid API key", "error");
    }
  });

  testApiKeyBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus("Please enter an API key first", "error");
      return;
    }

    testApiKeyBtn.disabled = true;
    testApiKeyBtn.textContent = "Testing...";

    try {
      const response = await chrome.runtime.sendMessage({
        action: "testApiKey",
        apiKey: apiKey,
      });

      if (response.success) {
        updateApiKeyStatus("valid", "✅ API Key valid");
        showStatus("API Key is working correctly!", "success");
      } else {
        updateApiKeyStatus("invalid", "❌ Invalid API Key");
        showStatus("API Key test failed: " + response.error, "error");
      }
    } catch (error) {
      updateApiKeyStatus("invalid", "❌ Connection failed");
      showStatus("Failed to test API key", "error");
    }

    testApiKeyBtn.disabled = false;
    testApiKeyBtn.textContent = "Test Connection";
  });

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

  // Update chance value displays
  likeChance.addEventListener("input", () => {
    likeChanceValue.textContent = likeChance.value + "%";
    saveAutomationConfig();
  });
  retweetChance.addEventListener("input", () => {
    retweetChanceValue.textContent = retweetChance.value + "%";
    saveAutomationConfig();
  });
  commentChance.addEventListener("input", () => {
    commentChanceValue.textContent = commentChance.value + "%";
    saveAutomationConfig();
  });
  likeEnabled.addEventListener("change", saveAutomationConfig);
  retweetEnabled.addEventListener("change", saveAutomationConfig);
  commentEnabled.addEventListener("change", saveAutomationConfig);

  function saveAutomationConfig() {
    const config = {
      likeEnabled: likeEnabled.checked,
      likeChance: parseInt(likeChance.value, 10),
      retweetEnabled: retweetEnabled.checked,
      retweetChance: parseInt(retweetChance.value, 10),
      commentEnabled: commentEnabled.checked,
      commentChance: parseInt(commentChance.value, 10),
    };
    chrome.storage.sync.set({ automationConfig: config });
  }

  function loadAutomationConfig(cb) {
    chrome.storage.sync.get(["automationConfig"], (result) => {
      const config = result.automationConfig || {
        likeEnabled: true,
        likeChance: 20,
        retweetEnabled: true,
        retweetChance: 10,
        commentEnabled: true,
        commentChance: 30,
      };
      likeEnabled.checked = config.likeEnabled;
      likeChance.value = config.likeChance;
      likeChanceValue.textContent = config.likeChance + "%";
      retweetEnabled.checked = config.retweetEnabled;
      retweetChance.value = config.retweetChance;
      retweetChanceValue.textContent = config.retweetChance + "%";
      commentEnabled.checked = config.commentEnabled;
      commentChance.value = config.commentChance;
      commentChanceValue.textContent = config.commentChance + "%";
      if (cb) cb(config);
    });
  }

  // Load config on startup
  loadAutomationConfig();

  // Automation Mode toggle functionality
  automationToggle.addEventListener("click", () => {
    const isEnabled = automationToggle.classList.contains("active");
    const newState = !isEnabled;
    automationToggle.classList.toggle("active");
    saveSetting("automationModeEnabled", newState);

    // Send message to content script to enable/disable automation and config
    loadAutomationConfig((config) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (
          tabs[0] &&
          (tabs[0].url.includes("twitter.com") || tabs[0].url.includes("x.com"))
        ) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleAutomationMode",
            enabled: newState,
            config,
          });
        }
      });
    });

    showStatus(
      "Automation Mode " + (newState ? "enabled" : "disabled"),
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
      [
        "commentButtonEnabled",
        "customPrompt",
        "geminiApiKey",
        "automationModeEnabled",
      ],
      (result) => {
        // Load toggle state
        const isEnabled = result.commentButtonEnabled !== false; // Default to true
        if (isEnabled) {
          enableToggle.classList.add("active");
        }
        // Load automation mode state
        const automationEnabled = result.automationModeEnabled === true;
        if (automationEnabled) {
          automationToggle.classList.add("active");
        } else {
          automationToggle.classList.remove("active");
        }

        // Load custom prompt
        const savedPrompt = result.customPrompt || DEFAULT_PROMPT;
        customPrompt.value = savedPrompt;

        // Load API key
        if (result.geminiApiKey) {
          apiKeyInput.value = result.geminiApiKey;
          updateApiKeyStatus("valid", "✅ API Key configured");
        } else {
          updateApiKeyStatus("missing", "⚠️ API Key required");
        }
      }
    );
  }

  function updateApiKeyStatus(type, message) {
    apiKeyStatus.className = `api-key-status ${type}`;
    apiKeyStatus.innerHTML = `<span>${
      message.split(" ")[0]
    }</span><span>${message.split(" ").slice(1).join(" ")}</span>`;
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

  function loadAutomationStatsAndLogs() {
    chrome.storage.sync.get(["automationStats", "automationLogs"], (result) => {
      if (result.automationStats) {
        updateStats(result.automationStats);
      }
      if (result.automationLogs) {
        automationLogsDiv.innerHTML = result.automationLogs
          .map((log) => `<div>${log}</div>`)
          .join("");
        automationLogsDiv.scrollTop = automationLogsDiv.scrollHeight;
      }
    });
  }

  function updateStats(stats) {
    likesCountSpan.textContent = stats.likes || 0;
    retweetsCountSpan.textContent = stats.retweets || 0;
    commentsCountSpan.textContent = stats.comments || 0;
  }

  function addLog(log) {
    if (!log) return;
    const div = document.createElement("div");
    div.textContent = log;
    automationLogsDiv.appendChild(div);
    automationLogsDiv.scrollTop = automationLogsDiv.scrollHeight;
    // Persist logs (keep last 100)
    chrome.storage.sync.get(["automationLogs"], (result) => {
      let logs = result.automationLogs || [];
      logs.push(log);
      if (logs.length > 100) logs = logs.slice(-100);
      chrome.storage.sync.set({ automationLogs: logs });
    });
  }
});
