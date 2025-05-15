// Image enhancement features for novel creation system
// This module adds:
// 1. Delete button for thumbnails
// 2. Full-screen image preview
// 3. Hover preview functionality

// Create and append the image preview overlay to the document body
function createImagePreviewOverlay() {
    // Check if overlay already exists
    if (document.getElementById("image-preview-overlay")) {
      return
    }
  
    const overlay = document.createElement("div")
    overlay.id = "image-preview-overlay"
    overlay.className = "image-preview-overlay"
  
    overlay.innerHTML = `
      <div class="image-preview-container">
        <img id="preview-image" src="/placeholder.svg" alt="Preview" />
        <button class="close-preview-btn">&times;</button>
      </div>
    `
  
    document.body.appendChild(overlay)
  
    // Add click event to close the preview
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.className === "close-preview-btn") {
        closeImagePreview()
      }
    })
  
    // Add escape key to close preview
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeImagePreview()
      }
    })
  }
  
  // Open image preview in full screen
  function openImagePreview(imageSrc) {
    const overlay = document.getElementById("image-preview-overlay")
    const previewImage = document.getElementById("preview-image")
  
    if (overlay && previewImage) {
      previewImage.src = imageSrc
      overlay.classList.add("active")
      document.body.style.overflow = "hidden" // Prevent scrolling
    }
  }
  
  // Close image preview
  function closeImagePreview() {
    const overlay = document.getElementById("image-preview-overlay")
  
    if (overlay) {
      overlay.classList.remove("active")
      document.body.style.overflow = "" // Restore scrolling
    }
  }
  
  // Create hover preview element
  function createHoverPreview() {
    // Check if hover preview already exists
    if (document.getElementById("hover-preview")) {
      return
    }
  
    const hoverPreview = document.createElement("div")
    hoverPreview.id = "hover-preview"
    hoverPreview.className = "hover-preview"
    hoverPreview.innerHTML = '<img id="hover-preview-image" src="/placeholder.svg" alt="Hover Preview" />'
  
    document.body.appendChild(hoverPreview)
  }
  
  // Show hover preview
  function showHoverPreview(imageSrc, event) {
    const hoverPreview = document.getElementById("hover-preview")
    const hoverImage = document.getElementById("hover-preview-image")
  
    if (hoverPreview && hoverImage) {
      hoverImage.src = imageSrc
  
      // Position the preview near the cursor but not under it
      const x = event.clientX + 20
      const y = event.clientY - 10
  
      // Adjust position to keep preview within viewport
      const previewWidth = 300 // Estimated width
      const previewHeight = 300 // Estimated height
  
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
  
      let finalX = x
      let finalY = y
  
      if (x + previewWidth > viewportWidth) {
        finalX = x - previewWidth - 40 // Show on the left side of cursor
      }
  
      if (y + previewHeight > viewportHeight) {
        finalY = viewportHeight - previewHeight - 20
      }
  
      hoverPreview.style.left = `${finalX}px`
      hoverPreview.style.top = `${finalY}px`
      hoverPreview.classList.add("active")
    }
  }
  
  // Hide hover preview
  function hideHoverPreview() {
    const hoverPreview = document.getElementById("hover-preview")
  
    if (hoverPreview) {
      hoverPreview.classList.remove("active")
    }
  }
  
  // Delete image from storyboard using backend API
  async function deleteImageFromStoryboard(storyboardIndex, imagePath) {
    try {
      console.log(`[INFO] Deleting image at index ${storyboardIndex}, path: ${imagePath}`)
  
      // Get storyboard file path from sessionStorage
      const projectPaths = JSON.parse(sessionStorage.getItem("projectPaths"))
      if (!projectPaths || !projectPaths.storyboard_file) {
        throw new Error("Project paths not found in session storage")
      }
  
      // 构建API请求参数
      const requestData = {
        path: projectPaths.storyboard_file,
        index: storyboardIndex,
        image_path: imagePath,
      }
  
      // 调用后端API删除图片
      const response = await fetch("/api/delete-storyboard-item-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete image")
      }
  
      const result = await response.json()
      console.log("[INFO] Successfully deleted image from storyboard:", result)
      return true
    } catch (error) {
      console.error("[ERROR] Failed to delete image:", error)
      return false
    }
  }
  
  // 在initImageEnhancements函数中添加调试日志
  function initImageEnhancements() {
    console.log("[INFO] Initializing image enhancements")
  
    // Create the image preview overlay
    createImagePreviewOverlay()
  
    // Create the hover preview element
    createHoverPreview()
  
    // 立即增强现有图片
    setTimeout(() => {
      console.log("[INFO] Enhancing existing images")
      enhanceExistingImages()
    }, 1000)
  
    // Add event delegation for image container interactions
    document.addEventListener("click", (e) => {
      // Handle delete button clicks
      if (e.target.classList.contains("delete-image-btn")) {
        e.stopPropagation() // Prevent opening the preview
  
        const imageItem = e.target.closest(".image-item")
        if (!imageItem) return
  
        const storyboardItem = imageItem.closest(".storyboard-item")
        const storyboardIndex = Array.from(storyboardItem.parentNode.children).indexOf(storyboardItem)
  
        const img = imageItem.querySelector("img")
        if (!img) return
  
        const imageSrc = img.src
        const imagePath = decodeImagePathFromSrc(imageSrc)
  
        // 直接删除图片，不需要确认
        deleteImageFromStoryboard(storyboardIndex, imagePath).then((success) => {
          if (success) {
            // 保存对父节点的引用，因为移除后imageItem.parentNode将为null
            const parentNode = imageItem.parentNode
  
            // Remove the image item from the DOM
            imageItem.remove()
  
            // 确保父节点存在再操作
            if (parentNode) {
              // Update the image count if present
              const countOverlay = parentNode.querySelector(".image-count")
              if (countOverlay) {
                const currentCount = Number.parseInt(countOverlay.textContent.replace("+", ""), 10)
                if (currentCount > 1) {
                  countOverlay.textContent = `+${currentCount - 1}`
                } else {
                  countOverlay.remove()
                }
              }
            }
          }
        })
      }
      // Handle image clicks for full-screen preview
      else if (e.target.tagName === "IMG" && e.target.closest(".image-item")) {
        console.log("[INFO] Image clicked, opening preview")
        const imageSrc = e.target.src
        openImagePreview(imageSrc)
      }
    })
  
    // Add event delegation for hover effects
    document.addEventListener("mouseover", (e) => {
      if (e.target.tagName === "IMG" && e.target.closest(".image-item")) {
        const imageSrc = e.target.src
        showHoverPreview(imageSrc, e)
      }
    })
  
    document.addEventListener("mouseout", (e) => {
      if (e.target.tagName === "IMG" && e.target.closest(".image-item")) {
        hideHoverPreview()
      }
    })
  
    // Update hover preview position on mouse move
    document.addEventListener("mousemove", (e) => {
      const hoverPreview = document.getElementById("hover-preview")
      if (hoverPreview && hoverPreview.classList.contains("active")) {
        // Position the preview near the cursor but not under it
        const x = e.clientX + 20
        const y = e.clientY - 10
  
        // Adjust position to keep preview within viewport
        const previewWidth = 300 // Estimated width
        const previewHeight = 300 // Estimated height
  
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
  
        let finalX = x
        let finalY = y
  
        if (x + previewWidth > viewportWidth) {
          finalX = x - previewWidth - 40 // Show on the left side of cursor
        }
  
        if (y + previewHeight > viewportHeight) {
          finalY = viewportHeight - previewHeight - 20
        }
  
        hoverPreview.style.left = `${finalX}px`
        hoverPreview.style.top = `${finalY}px`
      }
    })
  
    console.log("[INFO] Image enhancements initialized successfully")
  }
  
  // 修改enhanceExistingImages函数，添加更多调试信息
  function enhanceExistingImages() {
    const imageItems = document.querySelectorAll(".image-item")
    console.log(`[INFO] Found ${imageItems.length} existing image items to enhance`)
  
    imageItems.forEach((item, index) => {
      // 检查图片是否正确加载
      const img = item.querySelector("img")
      if (img) {
        console.log(`[DEBUG] Enhancing image ${index + 1}: ${img.src}`)
  
        // 确保图片可见
        img.style.display = "block"
  
        // 添加加载错误处理
        img.onerror = () => {
          console.error(`[ERROR] Failed to load image: ${img.src}`)
          img.src = "/placeholder.svg?height=150&width=150"
          img.alt = "图片加载失败"
        }
  
        // 添加加载成功处理
        img.onload = () => {
          console.log(`[INFO] Successfully loaded image: ${img.src}`)
        }
  
        // 如果图片已经加载完成但没有显示，尝试重新加载
        if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
          console.warn(`[WARNING] Image appears to be loaded but has no dimensions: ${img.src}`)
          const originalSrc = img.src
          img.src = "/placeholder.svg?height=150&width=150"
          setTimeout(() => {
            img.src = originalSrc
          }, 100)
        }
      }
  
      // 只添加删除按钮如果它不存在
      if (!item.querySelector(".delete-image-btn")) {
        console.log(`[DEBUG] Adding delete button to image ${index + 1}`)
        const deleteBtn = document.createElement("button")
        deleteBtn.className = "delete-image-btn"
        deleteBtn.innerHTML = "&times;"
        deleteBtn.title = "删除图片"
        item.appendChild(deleteBtn)
      }
    })
  
    console.log("[INFO] Finished enhancing existing images")
  }
  
  // Helper function to extract image path from src URL
  function decodeImagePathFromSrc(src) {
    try {
      // Extract the path after /api/projects/
      const pathMatch = src.match(/\/api\/projects\/(.+)/)
      if (pathMatch && pathMatch[1]) {
        // Reconstruct the full path
        return `outputs/books/${pathMatch[1]}`
      }
      return null
    } catch (error) {
      console.error("[ERROR] Failed to decode image path:", error)
      return null
    }
  }
  
  // Override the original image rendering function to include delete buttons
  function overrideImageRendering() {
    // Store reference to the original function that creates image items
    const originalCreateImageItem = window.createImageItem
  
    // If the function exists, override it
    if (typeof originalCreateImageItem === "function") {
      window.createImageItem = (imagePath, imgIndex) => {
        const imageItem = originalCreateImageItem(imagePath, imgIndex)
  
        // Add delete button to the image item
        const deleteBtn = document.createElement("button")
        deleteBtn.className = "delete-image-btn"
        deleteBtn.innerHTML = "&times;"
        deleteBtn.title = "Delete image"
        imageItem.appendChild(deleteBtn)
  
        return imageItem
      }
    }
  }
  
  // Export functions
  export { initImageEnhancements, enhanceExistingImages, deleteImageFromStoryboard, openImagePreview, closeImagePreview }
  