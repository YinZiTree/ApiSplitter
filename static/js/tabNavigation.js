/**
 * Initialize tab navigation functionality
 * @param {Function} loadPageContentCallback - Callback to load page content
 */
export function initTabNavigation(loadPageContentCallback) {
  const tabButtons = document.querySelectorAll(".tab-button")
  const pages = document.querySelectorAll(".page")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.getAttribute("data-page")

      // Activate current tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Show corresponding page
      pages.forEach((page) => page.classList.remove("active"))
      document.getElementById(pageId).classList.add("active")

      // Load page content
      loadPageContentCallback(pageId)
    })
  })
}
