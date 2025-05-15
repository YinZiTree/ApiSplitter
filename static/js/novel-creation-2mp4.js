/**
 * 视频预览功能模块
 * 负责加载和显示已生成的视频
 */

// 初始化视频预览功能
export const initVideoPreview = () => {
    console.log("[VIDEO_PREVIEW] 开始初始化视频预览功能")
  
    // 从sessionStorage获取项目路径信息
    const projectPaths = sessionStorage.getItem("projectPaths")
    if (!projectPaths) {
      console.error("[ERROR] 未找到项目路径信息，请确保已正确加载项目")
      return
    }
  
    console.log("[VIDEO_PREVIEW] 从sessionStorage获取的项目路径信息:", projectPaths)
  
    const paths = JSON.parse(projectPaths)
    console.log("[VIDEO_PREVIEW] 解析后的项目路径对象:", paths)
  
    // 直接使用sessionStorage中的mp4_dir路径
    const mp4Dir = paths.mp4_dir
    console.log("[VIDEO_PREVIEW] 视频目录路径:", mp4Dir)
  
    // 加载已有视频列表
    console.log("[VIDEO_PREVIEW] 开始加载视频列表...")
    loadVideoList(mp4Dir)
  
    // 监听视频合成完成事件
    document.addEventListener("videoSynthesisComplete", (event) => {
      console.log("[VIDEO_PREVIEW] 收到视频合成完成事件，详情:", event.detail)
      console.log("[VIDEO_PREVIEW] 重新加载视频列表...")
      loadVideoList(mp4Dir)
    })
  
    // 每30秒自动刷新一次视频列表
    console.log("[VIDEO_PREVIEW] 设置自动刷新定时器，间隔30秒")
    setInterval(() => {
      console.log("[VIDEO_PREVIEW] 定时器触发，自动刷新视频列表...")
      loadVideoList(mp4Dir)
    }, 30000)
}
  
  /**
   * 加载视频列表
   * @param {String} mp4Dir - 视频目录路径
   */
  const loadVideoList = async (mp4Dir) => {
    try {
      console.log("[VIDEO_PREVIEW] 开始加载视频列表，目录:", mp4Dir)
  
      // 直接使用原始路径，不进行特殊字符替换
      const encodedDir = mp4Dir
      console.log("[VIDEO_PREVIEW] 编码后的目录路径:", encodedDir)
  
      // 发送请求获取视频列表
      console.log("[VIDEO_PREVIEW] 发送请求获取视频列表...")
      const response = await fetch("/api/tomp4/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ directory: encodedDir }),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[ERROR] 获取视频列表失败，错误详情:", errorData)
        throw new Error(errorData.message || "获取视频列表失败")
      }
  
      const result = await response.json()
      console.log("[VIDEO_PREVIEW] 成功获取视频列表，结果:", result)
      console.log("[VIDEO_PREVIEW] 视频数量:", result.data.count)
      console.log("[VIDEO_PREVIEW] 视频列表:", result.data.videos)
  
      // 更新视频预览区域
      console.log("[VIDEO_PREVIEW] 开始更新视频预览区域...")
      updateVideoPreview(result.data.videos, encodedDir)
    } catch (error) {
      console.error("[ERROR] 加载视频列表时出错，错误详情:", error)
      console.error("[ERROR] 错误堆栈:", error.stack)
    }
}
  
  /**
   * 更新视频预览区域
   * @param {Array} videos - 视频列表
   * @param {String} mp4Dir - 视频目录路径
   */
  const updateVideoPreview = (videos, mp4Dir) => {
    console.log("[VIDEO_PREVIEW] 开始更新视频预览区域...")
  
    // 获取视频容器
    const videoContainer = document.querySelector(".video-container")
    if (!videoContainer) {
      console.error("[ERROR] 未找到视频容器，请确保HTML结构正确")
      return
    }
  
    // 如果没有视频，显示提示信息
    if (!videos || videos.length === 0) {
      videoContainer.innerHTML = `
        <div class="no-video-message">
          <i class="fas fa-film"></i>
          <p>暂无生成的视频</p>
        </div>
      `
      return
    }
  
    // 获取当前选中的视频索引
    let currentIndex = 0
    const currentVideo = videoContainer.querySelector(".video-player")
    if (currentVideo && currentVideo.src) {
      const currentSrc = currentVideo.src
      const currentFileName = currentSrc.substring(currentSrc.lastIndexOf("/") + 1)
      const index = videos.findIndex((video) => video.endsWith(currentFileName))
      if (index !== -1) {
        currentIndex = index
      }
    }
  
    // 修正视频路径：替换前缀为 /outputs/...
    const videoPath = videos[currentIndex] // "/api/projects/outputs/..."
    // 保证路径不是双斜杠
    const fixedVideoPath = videoPath.replace(/^\/api\/projects/, '') 
  
    // 构建HTML
    const videoPreviewHTML = `
      <video controls class="video-player" id="video-player">
        <source src="${fixedVideoPath}" type="video/mp4">
        您的浏览器不支持视频播放
      </video>
      <div class="video-controls">
        <button class="control-button" onclick="document.getElementById('video-player').play()">
          <i class="fas fa-play"></i> 播放
        </button>
        <button class="control-button" onclick="document.getElementById('video-player').pause()">
          <i class="fas fa-pause"></i> 暂停
        </button>
        <button class="control-button" onclick="document.getElementById('video-player').load()">
          <i class="fas fa-sync-alt"></i> 重播
        </button>
      </div>
      ${videos.length > 1 ? `
      <div class="video-selector">
        <div class="video-selector-header">
          <span>选择视频 (${currentIndex + 1}/${videos.length})</span>
        </div>
        <div class="video-selector-buttons">
          <button class="selector-button prev-button" ${currentIndex === 0 ? "disabled" : ""}>
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="selector-button next-button" ${currentIndex === videos.length - 1 ? "disabled" : ""}>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      ` : ""}
    `
    
    videoContainer.innerHTML = videoPreviewHTML
  
    // 切换按钮事件...
    if (videos.length > 1) {
      const prevButton = videoContainer.querySelector(".prev-button")
      const nextButton = videoContainer.querySelector(".next-button")
      prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--
          updateVideoPreview(videos, mp4Dir)
        }
      })
      nextButton.addEventListener("click", () => {
        if (currentIndex < videos.length - 1) {
          currentIndex++
          updateVideoPreview(videos, mp4Dir)
        }
      })
    }
  }
  
  // 导出初始化函数
  export default initVideoPreview
  