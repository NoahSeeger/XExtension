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

function findReplyTextbox() {
  // Find the Draft.js editor container
  const draftEditor = document.querySelector(
    "div.DraftEditor-editorContainer div[data-offset-key]"
  );
  if (draftEditor) {
    console.log("Found Draft.js editor");
    return draftEditor;
  }

  // Fallback to contenteditable
  const contentEditable = document.querySelector(
    '[contenteditable="true"][role="textbox"]'
  );
  if (contentEditable) {
    console.log("Found contenteditable element");
    return contentEditable;
  }

  return null;
}

async function insertTextViaReactProps(textbox, text) {
  console.log("Using React props method to insert text");

  try {
    // Focus the textbox
    textbox.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    textbox.focus();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clear existing content
    textbox.textContent = "";

    // Set the new text
    textbox.textContent = text;

    // Find and trigger React's internal event handlers
    const reactKey = Object.keys(textbox).find((key) =>
      key.startsWith("__reactProps$")
    );
    if (reactKey) {
      console.log("Found React props, triggering internal handlers");
      const reactProps = textbox[reactKey];

      // Create a proper event object
      const eventObject = {
        target: textbox,
        currentTarget: textbox,
        type: "input",
        bubbles: true,
        cancelable: true,
      };

      // Trigger React's internal handlers
      if (reactProps.onInput) {
        reactProps.onInput(eventObject);
      }
      if (reactProps.onChange) {
        reactProps.onChange(eventObject);
      }

      console.log("React props triggered successfully");
    } else {
      console.log("No React props found, using fallback events");
      // Fallback: trigger standard events
      textbox.dispatchEvent(new Event("input", { bubbles: true }));
      textbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } catch (error) {
    console.error("Error inserting text via React props:", error);
  }
}

function insertTextIntoReply(text) {
  const textbox = findReplyTextbox();

  if (textbox) {
    console.log("Found textbox, current content:", textbox.textContent);

    // Check if textbox is empty to avoid duplicates
    if (textbox.textContent.trim() === "") {
      insertTextViaReactProps(textbox, text)
        .then(() => {
          console.log("Text inserted successfully:", text);
        })
        .catch((error) => {
          console.error("Error inserting text:", error);
        });

      return true;
    } else {
      console.log("Reply textbox is not empty, skipping text insertion");
      return false;
    }
  } else {
    console.log("No textbox found");
  }

  return false;
}

function waitForReplyTextboxAndInsert(text) {
  // First try to find existing textbox
  if (insertTextIntoReply(text)) {
    return;
  }

  // If not found, set up observer to wait for it
  const observer = new MutationObserver((mutations, obs) => {
    const textbox = findReplyTextbox();
    if (textbox) {
      // Small delay to ensure the textbox is fully initialized
      setTimeout(() => {
        if (insertTextIntoReply(text)) {
          obs.disconnect(); // Stop observing once text is inserted
        }
      }, 300);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Stop observing after 10 seconds to prevent memory leaks
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
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
      white-space: nowrap;
      margin: 0 4px;
    `;
    recommendButton.onmouseover = () => {
      recommendButton.style.backgroundColor = "#0c85d0";
    };
    recommendButton.onmouseout = () => {
      recommendButton.style.backgroundColor = "#1DA1F2";
    };

    presentationDiv.appendChild(recommendButton);
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
            // Insert the recommendation directly into the reply textbox
            waitForReplyTextboxAndInsert(response.recommendation);

            // Show success feedback
            recommendButton.textContent = "✓ Inserted!";
            setTimeout(() => {
              recommendButton.textContent = "Generate Comment";
            }, 2000);
          } else {
            alert("Error generating comment: " + response.error);
            recommendButton.textContent = "Generate Comment";
          }
        } catch (error) {
          console.error("Error during recommendation process:", error);
          alert("An error occurred while generating the comment.");
          recommendButton.textContent = "Generate Comment";
        }
      } else {
        alert("Could not find tweet text to analyze.");
        recommendButton.textContent = "Generate Comment";
      }

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
