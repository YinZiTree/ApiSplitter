/**
 * 音频显示和管理模块
 * 负责加载、显示和播放分镜音频文件
 */

// 初始化音频显示功能
export const initAudioDisplay = () => {
    console.log("[AUDIO_DISPLAY] 初始化音频显示功能")
  
    // 立即加载现有音频
    loadExistingAudio()
  
    // 监听音频生成完成事件
    document.addEventListener("audioGenerationComplete", (event) => {
      console.log("[AUDIO_DISPLAY] 收到音频生成完成事件:", event.detail)
      updateAudioDisplay(event.detail.storyboardIndex, event.detail.audioPath)
    })
  }
  
  // 加载现有音频文件
  const loadExistingAudio = async () => {
    console.log("[AUDIO_DISPLAY] 开始加载现有音频文件")
  
    try {
      // 从sessionStorage获取项目路径信息
      const projectPaths = sessionStorage.getItem("projectPaths")
      if (!projectPaths) {
        console.error("[ERROR] 未找到项目路径信息")
        return
      }
  
      const paths = JSON.parse(projectPaths)
      console.log("[AUDIO_DISPLAY] 项目路径信息:", paths)
  
      // 获取分镜文件路径
      const storyboardFilePath = paths.storyboard_file.replace(/\\/g, "/")
      console.log("[AUDIO_DISPLAY] 分镜文件路径:", storyboardFilePath)
  
      // 加载分镜数据
      const storyboardResponse = await fetch(`/api/projects/${storyboardFilePath.split("books/")[1]}`)
      if (!storyboardResponse.ok) {
        throw new Error(`加载分镜文件失败，状态码: ${storyboardResponse.status}`)
      }
  
      const storyboardData = await storyboardResponse.json()
      console.log("[AUDIO_DISPLAY] 成功加载分镜数据:", storyboardData)
  
      // 遍历分镜项，加载音频
      if (storyboardData.data && storyboardData.data.data) {
        const storyboards = Array.isArray(storyboardData.data.data)
          ? storyboardData.data.data
          : [storyboardData.data.data]
  
        storyboards.forEach((storyboard, index) => {
          if (storyboard.audio_info && storyboard.audio_info.path) {
            console.log(`[AUDIO_DISPLAY] 分镜 ${index + 1} 有音频文件:`, storyboard.audio_info.path)
            updateAudioDisplay(index, storyboard.audio_info.path)
          } else {
            console.log(`[AUDIO_DISPLAY] 分镜 ${index + 1} 没有音频文件`)
          }
        })
      }
    } catch (error) {
      console.error("[ERROR] 加载现有音频文件时出错:", error)
    }
  }
  
  // 更新音频显示
  const updateAudioDisplay = (storyboardIndex, audioPath) => {
    console.log(`[AUDIO_DISPLAY] 更新分镜 ${storyboardIndex + 1} 的音频显示，路径:`, audioPath)
  
    try {
      // 获取对应分镜项的音频容器
      const audioContainer = document.querySelector(`.storyboard-item:nth-child(${storyboardIndex + 1}) .audio-container`)
      if (!audioContainer) {
        console.error(`[ERROR] 未找到分镜 ${storyboardIndex + 1} 的音频容器`)
        return
      }
  
      // 构建音频URL - 使用新的音频文件API
      // 从路径中提取相对路径部分
      const relativePath = audioPath.replace(/\\/g, "/") // 统一路径格式
      const audioUrl = `/api/audio/file/${encodeURIComponent(relativePath)}`
      console.log(`[AUDIO_DISPLAY] 音频URL:`, audioUrl)
  
      // 创建音频播放器
      audioContainer.innerHTML = `
        <div class="audio-player">
          <audio src="${audioUrl}" controls preload="metadata"></audio>
          <div class="audio-controls">
            <button class="audio-control-btn play-btn" title="播放">
              <i class="fas fa-play"></i>
            </button>
            <button class="audio-control-btn pause-btn" title="暂停">
              <i class="fas fa-pause"></i>
            </button>
            <button class="audio-control-btn stop-btn" title="停止">
              <i class="fas fa-stop"></i>
            </button>
            <button class="audio-control-btn delete-btn" title="删除" data-path="${audioPath}" data-index="${storyboardIndex}">
              <i class="fas fa-trash-alt"></i>
            </button>
            <div class="audio-info">
              <span class="audio-time">00:00 / 00:00</span>
            </div>
          </div>
        </div>
      `
  
      // 添加音频控制事件
      const audio = audioContainer.querySelector("audio")
      const playBtn = audioContainer.querySelector(".play-btn")
      const pauseBtn = audioContainer.querySelector(".pause-btn")
      const stopBtn = audioContainer.querySelector(".stop-btn")
      const deleteBtn = audioContainer.querySelector(".delete-btn")
      const audioTime = audioContainer.querySelector(".audio-time")
  
      // 音频加载事件
      audio.addEventListener("loadedmetadata", () => {
        const duration = formatTime(audio.duration)
        audioTime.textContent = `00:00 / ${duration}`
      })
  
      // 音频加载错误事件
      audio.addEventListener("error", (e) => {
        console.error(`[ERROR] 音频加载失败:`, e)
        audioContainer.innerHTML = `
          <div class="audio-error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>音频加载失败</span>
          </div>
        `
      })
  
      // 音频时间更新事件
      audio.addEventListener("timeupdate", () => {
        const currentTime = formatTime(audio.currentTime)
        const duration = formatTime(audio.duration)
        audioTime.textContent = `${currentTime} / ${duration}`
      })
  
      // 播放按钮事件
      playBtn.addEventListener("click", () => {
        audio.play()
      })
  
      // 暂停按钮事件
      pauseBtn.addEventListener("click", () => {
        audio.pause()
      })
  
      // 停止按钮事件
      stopBtn.addEventListener("click", () => {
        audio.pause()
        audio.currentTime = 0
      })
  
      // 删除按钮事件
      deleteBtn.addEventListener("click", async () => {
        if (confirm("确定要删除这个音频文件吗？")) {
          await deleteAudio(audioPath, storyboardIndex)
          // 清空音频容器
          audioContainer.innerHTML = ""
        }
      })
  
      console.log(`[AUDIO_DISPLAY] 成功更新分镜 ${storyboardIndex + 1} 的音频显示`)
    } catch (error) {
      console.error(`[ERROR] 更新分镜 ${storyboardIndex + 1} 的音频显示时出错:`, error)
    }
  }
  
  // 删除音频文件
  const deleteAudio = async (audioPath, storyboardIndex) => {
      console.log(`[AUDIO_DISPLAY] 删除音频文件:`, audioPath);
  
      try {
          // 从sessionStorage获取分镜文件路径
          const projectPaths = sessionStorage.getItem("projectPaths");
          if (!projectPaths) {
              throw new Error("未找到项目路径信息");
          }
  
          const paths = JSON.parse(projectPaths);
          const storyboardFilePath = paths.storyboard_file;
  
          // 确保索引是数字类型
          const index = Number(storyboardIndex);
          
          // 调用删除音频API
          const response = await fetch("/api/audio/delete", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  path: audioPath,  // 直接使用绝对路径
                  storyboard_path: storyboardFilePath,
                  index: index
              }),
          });
  
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "删除音频文件失败")
          }
  
          console.log(`[AUDIO_DISPLAY] 成功删除音频文件`)
          return true
      } catch (error) {
          console.error(`[ERROR] 删除音频文件时出错:`, error);
          alert(`删除音频文件失败: ${error.message}`);
          return false;
      }
  }
  
  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  // 导出函数
  export { updateAudioDisplay, deleteAudio }
  