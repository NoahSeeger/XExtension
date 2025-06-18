// content.js

let commentButtonEnabled = true; // Default state

function getTweetTextFromDOM() {
  // Try to find the main tweet article element first
  const tweetArticle = document.querySelector('article[data-testid="tweet"]');

  if (tweetArticle) {
    // Prioritize div with data-testid="tweetText" as it's often the most direct container for the main text.
    const tweetTextContainer = tweetArticle.querySelector(
      '[data-testid="tweetText"]'
    );

    if (tweetTextContainer) {
      return tweetTextContainer.innerText.trim();
    }

    // Fallback: if data-testid="tweetText" is not working, try a div with a lang attribute.
    const langDiv = tweetArticle.querySelector("div[lang]");
    if (langDiv) {
      return langDiv.innerText.trim();
    }

    // Last resort: find any paragraph or span that seems to contain a significant amount of text.
    const potentialTextElements = tweetArticle.querySelectorAll("p, span");
    for (const element of Array.from(potentialTextElements)) {
      if (
        element.innerText.length > 50 &&
        !element.closest("a") &&
        !element.closest("time")
      ) {
        return element.innerText.trim();
      }
    }
  }
  return null;
}

function setCaretToEnd(element) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false); // false means to the end
  sel.removeAllRanges();
  sel.addRange(range);
}

function injectRecommendButton() {
  // Check if button should be enabled
  if (!commentButtonEnabled) {
    return;
  }

  // Find the tablist container where other action buttons are.
  const tabListContainer = document.querySelector(
    '[role="tablist"][data-testid="ScrollSnap-List"]'
  );

  if (tabListContainer && !document.getElementById("recommendCommentButton")) {
    const presentationDiv = document.createElement("div");
    presentationDiv.setAttribute("role", "presentation");
    presentationDiv.classList.add("css-175oi2r", "r-14tvyh0", "r-cpa5s6");

    const recommendButton = document.createElement("button");
    recommendButton.id = "recommendCommentButton";
    recommendButton.textContent = "Generate Comment";
    recommendButton.type = "button";

    recommendButton.style.cssText = `
      background-color: #1DA1F2;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 5px 10px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 12px;
      line-height: 16px;
      min-height: 28px;
      /* Ensure it fits in the button row */
      white-space: nowrap;
      margin: 0 4px; /* Add some horizontal margin */
    `;
    recommendButton.onmouseover = () => {
      recommendButton.style.backgroundColor = "#0c85d0";
    };
    recommendButton.onmouseout = () => {
      recommendButton.style.backgroundColor = "#1DA1F2";
    };

    presentationDiv.appendChild(recommendButton);

    // Append the new button to the tabListContainer
    tabListContainer.appendChild(presentationDiv);

    recommendButton.addEventListener("click", async () => {
      recommendButton.textContent = "Generating...";
      recommendButton.disabled = true;

      const tweetContent = getTweetTextFromDOM();

      if (tweetContent) {
        try {
          const response = await chrome.runtime.sendMessage({
            action: "getRecommendation",
            tweet: tweetContent,
          });
          if (response.success) {
            // Copy the recommendation to the clipboard
            await navigator.clipboard.writeText(response.recommendation);
          } else {
            alert("Error generating comment: " + response.error);
          }
        } catch (error) {
          console.error("Error during recommendation process:", error);
          alert("An error occurred while generating the comment.");
        }
      } else {
        alert("Could not find tweet text to analyze.");
      }

      recommendButton.textContent = "Generate Comment";
      recommendButton.disabled = false;
    });
  }
}

function removeRecommendButton() {
  const existingButton = document.getElementById("recommendCommentButton");
  if (existingButton) {
    existingButton.closest('[role="presentation"]').remove();
  }
}

// Load initial settings
chrome.storage.sync.get(["commentButtonEnabled"], (result) => {
  commentButtonEnabled = result.commentButtonEnabled !== false; // Default to true
  if (commentButtonEnabled) {
    injectRecommendButton();
  }
});

// Use a MutationObserver to detect when the reply input area is added to the DOM
const observer = new MutationObserver((mutationsList, observer) => {
  // Look for the tweetTextarea_0_label which signifies the reply input area is present
  if (document.querySelector('[data-testid="tweetTextarea_0_label"]')) {
    if (commentButtonEnabled) {
      injectRecommendButton();
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTweetText") {
    let tweetText = getTweetTextFromDOM();
    if (tweetText) {
      sendResponse({ success: true, tweet: tweetText });
    } else {
      sendResponse({
        success: false,
        error: "Tweet text not found in content script.",
      });
    }
  } else if (request.action === "toggleCommentButton") {
    commentButtonEnabled = request.enabled;
    if (commentButtonEnabled) {
      injectRecommendButton();
    } else {
      removeRecommendButton();
    }
    sendResponse({ success: true });
  }
});
