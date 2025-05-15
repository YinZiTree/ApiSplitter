/**
 * 显示视频设置弹窗
 * 从sessionStorage获取项目分镜JSON，显示预设配置选项
 */
export const showVideoSettings = async () => {
    console.log("[VIDEO] 开始显示视频设置弹窗")
  
    try {
      // 从sessionStorage获取项目路径信息
      const projectPaths = sessionStorage.getItem("projectPaths")
      if (!projectPaths) {
        console.error("[ERROR] 未找到项目路径信息")
        alert("未找到项目路径信息，请重新打开项目")
        return
      }
  
      const paths = JSON.parse(projectPaths)
      console.log("[DEBUG] 项目路径信息:", paths)
  
      // 获取分镜文件路径
      const storyboardFilePath = paths.storyboard_file.replace(/\\/g, "/")
      console.log("[DEBUG] 分镜文件路径:", storyboardFilePath)
  
      // 获取视频保存路径
      const projectFile = paths.project_file.replace(/\\/g, "/")
      const lastSlashIndex = projectFile.lastIndexOf("/")
      const projectDir = projectFile.substring(0, lastSlashIndex + 1)
      const mp4Dir = `${projectDir}mp4`
      console.log("[DEBUG] 视频保存路径:", mp4Dir)
  
      // 加载分镜数据
      const storyboardResponse = await fetch(`/api/projects/${storyboardFilePath.split("books/")[1]}`)
      if (!storyboardResponse.ok) {
        throw new Error(`加载分镜文件失败，状态码: ${storyboardResponse.status}`)
      }
  
      const storyboardData = await storyboardResponse.json()
      console.log("[INFO] 成功加载分镜数据:", storyboardData)
  
      // 加载视频预设配置
      const videoConfigResponse = await fetch("/api/img2video/config")
      if (!videoConfigResponse.ok) {
        throw new Error(`加载视频预设配置失败，状态码: ${videoConfigResponse.status}`)
      }
  
      const videoConfig = await videoConfigResponse.json()
      console.log("[INFO] 成功加载视频预设配置:", videoConfig)
  
      // 创建弹窗
      createVideoSettingsModal(storyboardData, videoConfig.data.presets, mp4Dir, storyboardFilePath)
    } catch (error) {
      console.error("[ERROR] 显示视频设置弹窗时出错:", error)
      alert(`显示视频设置弹窗失败: ${error.message}`)
    }
  }
  
  /**
   * 创建视频设置弹窗
   * @param {Object} storyboardData - 分镜数据
   * @param {Array} presets - 预设配置列表
   * @param {String} mp4Dir - 视频保存路径
   * @param {String} storyboardFilePath - 分镜文件路径
   */
  const createVideoSettingsModal = (storyboardData, presets, mp4Dir, storyboardFilePath) => {
    console.log("[VIDEO] 创建视频设置弹窗")
  
    // 移除已存在的弹窗
    const existingModal = document.getElementById("video-settings-modal")
    if (existingModal) {
      existingModal.remove()
    }
  
    // 创建弹窗容器
    const modal = document.createElement("div")
    modal.id = "video-settings-modal"
    modal.className = "video-settings-modal"
  
    // 创建弹窗内容
    modal.innerHTML = `
     <div class="video-settings-content">
       <div class="video-settings-header">
         <h3>视频合成设置</h3>
         <button class="close-button">&times;</button>
       </div>
       <div class="video-settings-body">
         <div class="video-info">
           <p>将合成 <strong>${storyboardData.data.length}</strong> 个分镜为视频</p>
           <p>每个分镜的持续时间将根据音频时长自动调整</p>
         </div>
         <div class="video-presets">
           <h4>选择预设配置:</h4>
           <div class="preset-cards">
             ${presets
               .map(
                 (preset, index) => `
               <div class="preset-card" data-index="${index}">
                 <h5>${preset.title}</h5>
                 <p>风格: ${preset.style}</p>
                 <p>分辨率: ${preset.config.width}x${preset.config.height}</p>
                 <p>转场: ${preset.config.transition_type}</p>
               </div>
             `,
               )
               .join("")}
           </div>
         </div>
         <div class="video-progress" style="display: none;">
           <div class="progress-bar">
             <div class="progress-fill"></div>
           </div>
           <p class="progress-text">准备中...</p>
         </div>
       </div>
       <div class="video-settings-footer">
         <button class="cancel-button">取消</button>
         <button class="start-button">开始合成</button>
       </div>
     </div>
   `
  
    // 添加弹窗到页面
    document.body.appendChild(modal)
  
    // 添加事件监听
    const closeButton = modal.querySelector(".close-button")
    const cancelButton = modal.querySelector(".cancel-button")
    const startButton = modal.querySelector(".start-button")
    const presetCards = modal.querySelectorAll(".preset-card")
  
    // 关闭弹窗
    closeButton.addEventListener("click", () => {
      modal.remove()
    })
  
    cancelButton.addEventListener("click", () => {
      modal.remove()
    })
  
    // 选择预设
    let selectedPresetIndex = 0
    presetCards.forEach((card, index) => {
      card.addEventListener("click", () => {
        // 移除其他卡片的选中状态
        presetCards.forEach((c) => c.classList.remove("selected"))
        // 添加当前卡片的选中状态
        card.classList.add("selected")
        selectedPresetIndex = index
      })
  
      // 默认选中第一个预设
      if (index === 0) {
        card.classList.add("selected")
      }
    })
  
    // 开始合成视频
    startButton.addEventListener("click", async () => {
      console.log("[VIDEO] 用户点击开始合成按钮")
  
      try {
        // 显示进度条
        const progressContainer = modal.querySelector(".video-progress")
        const progressFill = modal.querySelector(".progress-fill")
        const progressText = modal.querySelector(".progress-text")
        progressContainer.style.display = "block"
  
        // 禁用按钮
        startButton.disabled = true
        cancelButton.disabled = true
  
        // 更新进度
        progressText.textContent = "正在准备合成..."
        progressFill.style.width = "10%"
  
        // 获取选中的预设配置
        const selectedPreset = presets[selectedPresetIndex]
        console.log("[DEBUG] 选中的预设配置:", selectedPreset)
  
        // 构建请求参数
        const requestData = {
          storyboard_path: storyboardFilePath,
          output_dir: mp4Dir,
          preset: selectedPreset,
        }
  
        console.log("[DEBUG] 发送合成视频请求:", requestData)
  
        // 发送合成视频请求
        progressText.textContent = "已开始在后台合成视频..."
        progressFill.style.width = "30%"
  
        // 发送合成视频请求
        fetch("/api/img2video/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((errorData) => {
                throw new Error(errorData.message || "合成视频失败")
              })
            }
            return response.json()
          })
          .then((result) => {
            console.log("[INFO] 视频合成成功:", result)
            // 触发视频列表更新事件
            const event = new CustomEvent("videoSynthesisComplete", {
              detail: { outputPath: result.data.output_path },
            })
            document.dispatchEvent(event)
          })
          .catch((error) => {
            console.error("[ERROR] 合成视频时出错:", error)
          })
  
        // 关闭弹窗并显示通知
        modal.remove()
        showNotification("视频正在后台合成中，完成后将自动显示在视频预览区域")
      } catch (error) {
        console.error("[ERROR] 合成视频时出错:", error)
        alert(`合成视频失败: ${error.message}`)
  
        // 恢复按钮状态
        startButton.disabled = false
        cancelButton.disabled = false
      }
    })
  }
  
  /**
   * 显示通知
   * @param {String} message - 通知消息
   */
  const showNotification = (message) => {
    // 创建通知元素
    const notification = document.createElement("div")
    notification.className = "video-notification"
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
      </div>
    `
  
    // 添加到页面
    document.body.appendChild(notification)
  
    // 3秒后自动移除
    setTimeout(() => {
      notification.classList.add("fade-out")
      setTimeout(() => {
        notification.remove()
      }, 500)
    }, 3000)
  }
  
  /**
   * 更新视频合成进度
   * @param {Number} progress - 进度百分比 (0-100)
   * @param {String} message - 进度消息
   */
  export const updateVideoProgress = (progress, message) => {
    const modal = document.getElementById("video-settings-modal")
    if (!modal) return
  
    const progressFill = modal.querySelector(".progress-fill")
    const progressText = modal.querySelector(".progress-text")
  
    if (progressFill && progressText) {
      progressFill.style.width = `${progress}%`
      progressText.textContent = message
    }
  }
  