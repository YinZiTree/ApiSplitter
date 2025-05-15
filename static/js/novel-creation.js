// 引入AI生成分镜按钮事件监听
import { setupAiGenerateButton } from "./novel-creation-img.js"
// 引入批量生图功能
import { setupBatchImageGeneration } from "./novel-creation-imgs.js"
// 引入生成音频功能
import { generateAudio, batchGenerateAudio } from "./novel-creation-mp3.js" // 添加 batchGenerateAudio
// 引入生成视频功能
import { showVideoSettings } from "./novel-creation-img2video.js"
// 引入视频预览功能
import initVideoPreview from "./novel-creation-2mp4.js"
// 引入图片增强功能
import { initImageEnhancements, enhanceExistingImages } from "./novel-creation-image-enhancements.js"
// 引入音频显示功能
import { initAudioDisplay } from "./novel-creation-audio-display.js"

// 初始化小说创作页面
// 在initializeNovelCreation函数中，确保在加载完项目数据后初始化视频预览
const initializeNovelCreation = async () => {
  console.log("[INFO] 开始初始化小说创作页面")

  // 从sessionStorage获取项目文件路径
  const projectPaths = sessionStorage.getItem("projectPaths")
  if (projectPaths) {
    console.log("[INFO] 接收到项目文件路径:", projectPaths)

    try {
      const paths = JSON.parse(projectPaths)
      console.log("[DEBUG] 解析后的项目文件路径:", paths)

      // 获取项目根目录路径 (去掉文件名部分)
      const projectFile = paths.project_file.replace(/\\/g, "/")
      const lastSlashIndex = projectFile.lastIndexOf("/")
      const projectDir = projectFile.substring(0, lastSlashIndex + 1)

      // 正确构建子文件夹路径
      const imagesDir = `${projectDir}images`
      const mp3Dir = `${projectDir}mp3`
      const mp4Dir = `${projectDir}mp4`

      console.log("[DEBUG] 图片文件夹路径:", imagesDir)
      console.log("[DEBUG] 音频文件夹路径:", mp3Dir)
      console.log("[DEBUG] 视频文件夹路径:", mp4Dir)

      // 修正文件路径，确保以/api/projects/开头
      const projectFilePath = `/api/projects/${paths.project_file.replace(/\\/g, "/").split("books/")[1]}`
      console.log("[DEBUG] 修正后的项目文件路径:", projectFilePath)

      // 加载项目文件
      const response = await fetch(projectFilePath)
      if (!response.ok) {
        throw new Error(`加载项目文件失败，状态码: ${response.status}`)
      }
      const projectData = await response.json()
      console.log("[INFO] 成功加载项目数据:", projectData)

      // 填充项目描述到输入框
      const descriptionInput = document.querySelector(".chapter-param-input")
      if (descriptionInput) {
        descriptionInput.value = projectData.data.description || ""
        console.log("[INFO] 成功填充项目描述到输入框")
      } else {
        console.error("[ERROR] 未找到项目描述输入框")
      }

      // 加载分镜文件
      const storyboardFilePath = `/api/projects/${paths.storyboard_file.replace(/\\/g, "/").split("books/")[1]}`
      console.log("[DEBUG] 修正后的分镜文件路径:", storyboardFilePath)

      const storyboardResponse = await fetch(storyboardFilePath)
      if (!storyboardResponse.ok) {
        throw new Error(`加载分镜文件失败，状态码: ${storyboardResponse.status}`)
      }
      const storyboardData = await storyboardResponse.json()
      console.log("[INFO] 成功加载分镜数据:", storyboardData)

      // 动态填充分镜数据
      const storyboardContainer = document.querySelector(".storyboard-content")
      if (storyboardContainer) {
        // 清空现有内容
        storyboardContainer.innerHTML = ""
        console.log("[DEBUG] 已清空分镜容器")

        // 确保storyboardData.data.data是一个数组
        const storyboards = Array.isArray(storyboardData.data.data)
          ? storyboardData.data.data
          : [storyboardData.data.data]

        // 在这里调用setupBatchImageGeneration
        setupBatchImageGeneration(storyboards, paths, storyboardFilePath)

        // (storyboards, paths, storyboardFilePath)

        // 自动填充image_paths字段
        storyboards.forEach((storyboard) => {
          if (!storyboard.image_paths) {
            storyboard.image_paths = []
          }
        })

        console.log("[DEBUG] 解析后的分镜数据:", storyboards)

        // 添加实时更新分镜内容的函数
        const setupStoryboardUpdateListener = (storyboardItem, storyboardIndex) => {
          const textArea = storyboardItem.querySelector(".storyboard-text")
          const contentArea = storyboardItem.querySelector(".storyboard-content")
          const promptArea = storyboardItem.querySelector(".storyboard-prompt")

          // 在initializeNovelCreation函数中修改路径处理逻辑
          const storyboardFilePath = paths.storyboard_file.replace(/\\/g, "/")
          console.log("[DEBUG] 修正后的分镜文件路径:", storyboardFilePath)

          // 修改updateStoryboard函数中的请求URL
          const updateStoryboard = async () => {
            try {
              const updatedData = {
                text: textArea.value,
                content: contentArea.value,
                prompt: promptArea.value,
                index: storyboardIndex,
              }

              // 使用sessionStorage中的storyboard_file路径
              const url = `/api/update-storyboard-item?path=${encodeURIComponent(storyboardFilePath)}`

              const response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "更新分镜项失败")
              }

              console.log("[INFO] 成功更新分镜项:", updatedData)
            } catch (error) {
              console.error("[ERROR] 更新分镜项时出错:", error)
              alert("更新分镜项失败: " + error.message)
            }
          }

          // 添加输入事件监听
          textArea.addEventListener("input", updateStoryboard)
          contentArea.addEventListener("input", updateStoryboard)
          promptArea.addEventListener("input", updateStoryboard)
        }

        // 添加生成图片的函数
        const generateImage = async (prompt, index) => {
          console.log(`[INFO] 开始生成第 ${index + 1} 个分镜的图片`)
          console.log(`[DEBUG] 使用的Prompt: ${prompt}`)

          try {
            // 获取SD预设配置
            console.log("[INFO] 开始加载SD预设配置")
            const configResponse = await fetch("/api/sd/config")
            if (!configResponse.ok) {
              throw new Error("加载SD预设配置失败")
            }
            const sdConfig = await configResponse.json()
            console.log("[INFO] 成功加载SD预设配置:", sdConfig)

            // 构建请求参数
            const requestBody = {
              prompt: prompt,
              width: Number.parseInt(sdConfig.data.width, 10),
              height: Number.parseInt(sdConfig.data.height, 10),
              steps: Number.parseInt(sdConfig.data.steps, 10),
              cfg_scale: Number.parseFloat(sdConfig.data.cfg_scale),
              sampler_name: sdConfig.data.sampler,
              seed: Number.parseInt(sdConfig.data.seed, 10),
              batch_size: Number.parseInt(sdConfig.data.batch_size, 10),
              negative_prompt: "",
              restore_faces: true,
            }
            console.log("[DEBUG] 构建的SD请求参数:", requestBody)

            // 发送生成图片请求
            console.log("[INFO] 开始发送生成图片请求")
            const response = await fetch("/api/sd/txt2img", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "生成图片失败")
            }

            const result = await response.json()
            console.log("[INFO] 图片生成成功:", result)

            // 处理多张图片
            const images = result.data.images
            console.log(`[INFO] 接收到 ${images.length} 张图片`)

            // 保存所有图片并更新分镜项
            for (let i = 0; i < images.length; i++) {
              const base64Data = images[i].replace(/^data:image\/\w+;base64,/, "")
              const binaryString = atob(base64Data)
              const bytes = new Uint8Array(binaryString.length)
              for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j)
              }

              // 生成唯一文件名
              const timestamp = Date.now()
              const imageFileName = `image_${timestamp}_${i}.png`
              const imagePath = `${imagesDir}/${imageFileName}`
              console.log(`[DEBUG] 生成的图片保存路径: ${imagePath}`)

              // 保存图片文件
              const saveResponse = await fetch("/api/save-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: imagePath,
                  data: base64Data,
                }),
              })

              if (!saveResponse.ok) {
                throw new Error("保存图片文件失败")
              }

              // 更新分镜项的image_paths字段
              const updateImagePathResponse = await fetch("/api/update-storyboard-item-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: paths.storyboard_file,
                  index: index,
                  image_path: imagePath,
                }),
              })

              if (!updateImagePathResponse.ok) {
                throw new Error("更新分镜项图片路径失败")
              }
            }

            // 重新加载分镜数据以获取更新后的图片列表
            const reloadResponse = await fetch(storyboardFilePath)
            if (!reloadResponse.ok) {
              throw new Error("重新加载分镜数据失败")
            }
            const reloadedData = await reloadResponse.json()

            // 获取更新后的图片路径列表
            const updatedStoryboard = reloadedData.data.data[index]
            const imagePaths = updatedStoryboard.image_paths || []

            // 更新图片容器显示
            const imageContainer = document.querySelector(`.storyboard-item:nth-child(${index + 1}) .image-container`)
            if (imageContainer) {
              // 清空现有内容
              imageContainer.innerHTML = ""

              // 显示所有图片（最多4张）
              imagePaths.slice(-4).forEach((imagePath, imgIndex) => {
                const imageItem = document.createElement("div")
                imageItem.className = "image-item"

                const img = document.createElement("img")
                img.src = `/api/projects/${imagePath.replace(/\\/g, "/").split("books/")[1]}`
                img.alt = `Generated Image ${imgIndex + 1}`

                // 添加删除按钮
                const deleteBtn = document.createElement("button")
                deleteBtn.className = "delete-image-btn"
                deleteBtn.innerHTML = "&times;"
                deleteBtn.title = "删除图片"

                imageItem.appendChild(img)
                imageItem.appendChild(deleteBtn)
                imageContainer.appendChild(imageItem)
              })

              // 如果图片超过4张，显示剩余数量
              if (imagePaths.length > 4) {
                const countOverlay = document.createElement("div")
                countOverlay.className = "image-count"
                countOverlay.textContent = `+${imagePaths.length - 4}`
                imageContainer.appendChild(countOverlay)
              }
            }

            console.log("[INFO] 成功更新分镜项的图片显示")
          } catch (error) {
            console.error("[ERROR] 生成图片时出错:", error)
            alert("生成图片失败: " + error.message)
          }
        }

        // 在动态填充分镜数据时修改图片显示逻辑
        storyboards.forEach((storyboard, index) => {
          console.log(`[DEBUG] 正在处理第 ${index + 1} 个分镜项`)

          const storyboardItem = document.createElement("div")
          storyboardItem.className = "storyboard-item"

          // 确保audio_info字段存在
          if (!storyboard.audio_info) {
            storyboard.audio_info = {}
          }

          // 先创建基本结构
          storyboardItem.innerHTML = `
               <div class="storyboard-field">
                   <textarea class="storyboard-text">${storyboard.text || ""}</textarea>
               </div>
               <div class="storyboard-field">
                   <textarea class="storyboard-content">${storyboard.content || ""}</textarea>
               </div>
               <div class="storyboard-field">
                   <textarea class="storyboard-prompt">${storyboard.prompt || ""}</textarea>
               </div>
               <div class="storyboard-field">
                   <div class="image-container"></div>
               </div>
               <div class="storyboard-field">
                   <div class="storyboard-actions">
                       <button class="storyboard-action">
                           <i class="fas fa-image"></i> 生成图片
                       </button>
                       <button class="storyboard-action generate-audio">
                           <i class="fas fa-volume-up"></i> 生成音频
                       </button>
                   </div>
               </div>
               <div class="storyboard-field">
                 <div class="audio-container"></div>
               </div>
          `

          // 添加到DOM
          storyboardContainer.appendChild(storyboardItem)

          // 现在获取图片容器并填充图片
          const imageContainer = storyboardItem.querySelector(".image-container")

          // 添加图片填充日志
          console.log(`[INFO] 开始填充第 ${index + 1} 个分镜项的图片`)
          console.log(`[DEBUG] 当前分镜项图片路径数量: ${storyboard.image_paths ? storyboard.image_paths.length : 0}`)

          // 显示所有图片
          if (storyboard.image_paths && storyboard.image_paths.length > 0) {
            storyboard.image_paths.forEach((imagePath, imgIndex) => {
              if (imgIndex < 4) {
                console.log(`[DEBUG] 正在填充第 ${imgIndex + 1} 张图片，路径: ${imagePath}`)
                const imageItem = document.createElement("div")
                imageItem.className = "image-item"

                const img = document.createElement("img")
                img.src = `/api/projects/${imagePath.replace(/\\/g, "/").split("books/")[1]}`
                img.alt = `Generated Image ${imgIndex + 1}`
                img.onerror = () => {
                  console.error(`[ERROR] 图片加载失败: ${img.src}`)
                  img.src = "/placeholder.svg?height=150&width=150"
                  img.alt = "图片加载失败"
                }
                img.onload = () => {
                  console.log(`[INFO] 图片加载成功: ${img.src}`)
                }

                // 添加删除按钮
                const deleteBtn = document.createElement("button")
                deleteBtn.className = "delete-image-btn"
                deleteBtn.innerHTML = "&times;"
                deleteBtn.title = "删除图片"

                imageItem.appendChild(img)
                imageItem.appendChild(deleteBtn)
                imageContainer.appendChild(imageItem)
              }
            })

            // 如果图片超过4张，显示剩余数量
            if (storyboard.image_paths.length > 4) {
              console.log(`[INFO] 当前分镜项图片数量超过4张，剩余 ${storyboard.image_paths.length - 4} 张未显示`)
              const countOverlay = document.createElement("div")
              countOverlay.className = "image-count"
              countOverlay.textContent = `+${storyboard.image_paths.length - 4}`
              imageContainer.appendChild(countOverlay)
            }
          } else {
            console.log(`[INFO] 第 ${index + 1} 个分镜项没有图片需要填充`)
          }

          console.log(`[INFO] 第 ${index + 1} 个分镜项图片填充完成`)

          setupStoryboardUpdateListener(storyboardItem, index)
          console.log(`[DEBUG] 成功添加第 ${index + 1} 个分镜项`)

          // 为生成图片按钮添加事件监听
          const generateImageButton = storyboardItem.querySelector(".storyboard-action:nth-child(1)")
          if (generateImageButton) {
            generateImageButton.addEventListener("click", () => {
              generateImage(storyboard.prompt, index)
            })
          }

          // 为生成音频按钮添加事件监听
          const generateAudioButton = storyboardItem.querySelector(".generate-audio")
          if (generateAudioButton) {
            generateAudioButton.addEventListener("click", () => {
              generateAudio(storyboard.text, index, paths.mp3_dir)
            })
          }
        })

        console.log("[INFO] 成功填充分镜数据，共添加了", storyboards.length, "个分镜项")
      } else {
        console.error("[ERROR] 未找到分镜容器")
      }

      // 为AI生成分镜按钮添加事件监听
      setupAiGenerateButton(projectData, paths, storyboardFilePath)

      // 添加合成视频按钮事件
      const videoButton = document.querySelector(".assistant-action:nth-child(3)")
      if (videoButton) {
        videoButton.addEventListener("click", () => {
          console.log("[VIDEO] 用户点击合成视频按钮")
          showVideoSettings()
        })
      }

      // 初始化视频预览功能
      initVideoPreview()

      // 初始化图片增强功能
      initImageEnhancements()

      // 增强现有图片
      enhanceExistingImages()

      // 初始化音频显示功能
      initAudioDisplay()
    } catch (error) {
      console.error("[ERROR] 初始化项目时出错:", error)
      alert("初始化项目失败，请稍后重试")
    }
  }
}
// 在页面切换时手动调用初始化函数
export const initNovelCreation = () => {
  initializeNovelCreation()
}

// 为批量配音按钮添加事件监听
const batchAudioButton = document.querySelector(".assistant-action:nth-child(2)")
if (batchAudioButton) {
  batchAudioButton.addEventListener("click", async () => {
    console.log("[INFO] 批量配音按钮被点击")

    // 获取所有分镜项
    const storyboardItems = document.querySelectorAll(".storyboard-item")
    if (!storyboardItems.length) {
      alert("未找到分镜项")
      return
    }

    // 提取分镜文本
    const storyboards = []
    storyboardItems.forEach((item, index) => {
      const text = item.querySelector(".storyboard-text").value
      storyboards.push({
        text: text,
        index: index,
      })
    })

    // 调用批量生成音频函数
    await batchGenerateAudio(storyboards)
  })
}

// 初始化页面
initializeNovelCreation()
