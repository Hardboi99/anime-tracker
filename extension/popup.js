document.addEventListener("DOMContentLoaded", async () => {
  const domainEl = document.getElementById("website-domain");

  try {
    // Query active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      const url = new URL(tab.url);
      // Clean up hostname (e.g. www.youtube.com -> youtube.com)
      const domain = url.hostname.replace("www.", "");
      domainEl.textContent = domain;
    } else {
      domainEl.textContent = "Unavailable";
    }
  } catch (error) {
    console.error("Failed to detect website:", error);
    domainEl.textContent = "Error";
  }
});
