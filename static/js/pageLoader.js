import {
  initializeNovelDirectory,
  initializeNovelCreation,
  initializeSDConfig,
  initializeTTSConfig,
  initializeBailianConfig,
} from "./pageInitializers.js"

/**
 * Load content for a specific page
 * @param {string} pageId - ID of the page to load
 */
export function loadPageContent(pageId) {
  const page = document.getElementById(pageId)

  // Show loading animation
  page.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>'

  // Load corresponding page content
  fetch(`/${pageId}.html`)
    .then((response) => {
      if (response.ok) {
        return response.text()
      }
      throw new Error("页面加载失败")
    })
    .then((html) => {
      // Replace page content after successful loading
      setTimeout(() => {
        page.innerHTML = html

        // Bind events for specific pages
        if (pageId === "novel-directory") {
          initializeNovelDirectory()
        } else if (pageId === "novel-creation") {
          import('./novel-creation.js').then(module => {
            module.initNovelCreation();
          });
        } else if (pageId === "sd-config") {
          initializeSDConfig()
        } else if (pageId === "f5tts-config") {
          initializeTTSConfig()
        } else if (pageId === "bailian-config") {
          initializeBailianConfig()
        }
      }, 300) // Add short delay to show loading animation
    })
    .catch((error) => {
      console.error("加载页面出错:", error)
      page.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <div>
            <h3>页面加载失败</h3>
            <p>${error.message}</p>
          </div>
        </div>
      `
    })
}

// Remove the duplicate loadPageContent function
