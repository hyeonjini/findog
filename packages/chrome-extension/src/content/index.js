chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXTRACT_PRODUCT") {
    sendResponse({
      name: document.title,
      url: window.location.href
    });
  }
  return false;
});
