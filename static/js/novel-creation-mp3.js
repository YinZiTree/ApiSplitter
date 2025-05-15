// static\js\novel-creation-mp3.js

// 生成音频函数
export const generateAudio = async (text, index) => {
    console.log(`[INFO] 开始生成第 ${index + 1} 个分镜的音频`)
    console.log(`[DEBUG] 使用的文本: ${text}`)
    console.log(`[DEBUG] 分镜索引: ${index}`)
  
    try {
      // 从 sessionStorage 获取项目路径
      const projectPaths = sessionStorage.getItem("projectPaths")
      if (!projectPaths) {
        throw new Error("未找到项目路径信息")
      }
      const paths = JSON.parse(projectPaths)
      const mp3Dir = paths.mp3_dir
      console.log(`[DEBUG] 音频保存目录: ${mp3Dir}`)
  
      // 获取音频预设配置
      console.log("[INFO] 开始加载音频预设配置")
      console.log(`[DEBUG] 请求URL: /api/audio/preset`)
      const configResponse = await fetch("/api/audio/preset")
  
      if (!configResponse.ok) {
        console.error(`[ERROR] 加载音频预设配置失败，状态码: ${configResponse.status}`)
        throw new Error("加载音频预设配置失败")
      }
  
      const audioConfig = await configResponse.json()
      if (!audioConfig || !audioConfig.data) {
        console.error("[ERROR] 音频预设配置数据格式不正确")
        throw new Error("音频预设配置数据格式不正确")
      }
  
      console.log("[INFO] 成功加载音频预设配置:", audioConfig)
      console.log(`[DEBUG] 音色模型: ${audioConfig.data.voiceModel}`)
      console.log(`[DEBUG] NFE步数: ${audioConfig.data.nfeStep}`)
  
      // 构建请求参数
      const requestBody = {
        text: text,
        voice_model: audioConfig.data.voiceModel,
        nfe_step: audioConfig.data.nfeStep,
        speed: 0.95,
        refine_text: "开启",
        save_path: mp3Dir, // 添加保存路径参数
      }
      console.log("[DEBUG] 构建的音频请求参数:", JSON.stringify(requestBody, null, 2))
  
      // 发送生成音频请求
      console.log("[INFO] 开始发送生成音频请求")
      console.log(`[DEBUG] 请求URL: /api/audio/generate`)
      const response = await fetch("/api/audio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[ERROR] 生成音频请求失败，状态码: ${response.status}`)
        console.error(`[DEBUG] 错误信息: ${errorData.message}`)
        throw new Error(errorData.message || "生成音频失败")
      }
  
      const result = await response.json()
      console.log("[INFO] 音频生成成功:", result)
      console.log(`[DEBUG] 音频文件路径: ${result.data.path}`);
      console.log(`[DEBUG] 音频时长: ${result.data.duration}毫秒`);  // 修改日志输出
  
      // 从 sessionStorage 获取分镜文件路径
      const storyboardFilePath = JSON.parse(sessionStorage.getItem("projectPaths")).storyboard_file
      if (!storyboardFilePath) {
        throw new Error("未找到分镜文件路径")
      }
  
      // 更新分镜文件的 audio_info 字段
      const updateResponse = await fetch("/api/update-storyboard-item-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: storyboardFilePath,
          index: index,
          audio_info: {
            path: result.data.path.replace("\\", "/"),
            duration: result.data.duration  // 使用毫秒数
          },
        }),
      })
  
      if (!updateResponse.ok) {
        throw new Error("更新分镜项音频路径失败")
      }
  
      console.log("[INFO] 成功更新分镜项的音频信息")
  
      // 触发音频生成完成事件
      const event = new CustomEvent("audioGenerationComplete", {
        detail: {
          storyboardIndex: index,
          audioPath: result.data.path.replace("\\", "/"), // 修改这里，使用正确的路径字段
        },
      })
      document.dispatchEvent(event)
    } catch (error) {
      console.error("[ERROR] 生成音频时出错:", error)
      console.error(`[DEBUG] 错误堆栈: ${error.stack}`)
      alert("生成音频失败: " + error.message)
    }
  }
  
  // 批量生成音频函数
  export const batchGenerateAudio = async (storyboards) => {
    console.log("[INFO] 开始批量生成音频")
    try {
      // 从 sessionStorage 获取项目路径
      const projectPaths = sessionStorage.getItem("projectPaths")
      if (!projectPaths) {
        throw new Error("未找到项目路径信息")
      }
      const paths = JSON.parse(projectPaths)
      const mp3Dir = paths.mp3_dir
      console.log(`[DEBUG] 音频保存目录: ${mp3Dir}`)
  
      // 依次为每个分镜生成音频
      for (let i = 0; i < storyboards.length; i++) {
        const storyboard = storyboards[i]
        if (!storyboard.text) {
          console.warn(`[WARNING] 第 ${i + 1} 个分镜的文本为空，跳过`)
          continue
        }
  
        console.log(`[INFO] 开始生成第 ${i + 1} 个分镜的音频`)
        await generateAudio(storyboard.text, i)
      }
  
      console.log("[INFO] 批量生成音频完成")
      alert("批量生成音频成功")
    } catch (error) {
      console.error("[ERROR] 批量生成音频时出错:", error)
      alert("批量生成音频失败: " + error.message)
    }
  }
  