import { browser } from 'wxt/browser';
import type { Browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractProductData } from '../lib/product/extractor';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    if (document.body.hasAttribute('data-findog-injected')) return;
    document.body.setAttribute('data-findog-injected', 'true');

    browser.runtime.onMessage.addListener(
      (message: { type: string }, _sender: Browser.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
      if (message?.type === 'EXTRACT_PRODUCT') {
        const data = extractProductData();
        sendResponse({ type: 'EXTRACT_PRODUCT', data });
        return true;
      }
      },
    );
  },
});
