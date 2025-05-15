// 批量生图功能
export const setupBatchImageGeneration = (storyboards, paths, storyboardFilePath) => {
  const batchImageButton = document.querySelector(".assistant-action:nth-child(1)")
  if (batchImageButton) {
    console.log("[INFO] 找到批量生图按钮")
    batchImageButton.addEventListener("click", async () => {
      console.log("[INFO] 批量生图按钮被点击")

      try {
        // 获取所有分镜项
        const storyboardItems = document.querySelectorAll(".storyboard-item")
        if (!storyboardItems.length) {
          throw new Error("未找到分镜项")
        }

        // 依次为每个分镜生成图片
        for (let i = 0; i < storyboardItems.length; i++) {
          const storyboardItem = storyboardItems[i]
          const prompt = storyboardItem.querySelector(".storyboard-prompt").value

          if (!prompt) {
            console.warn(`[WARNING] 第 ${i + 1} 个分镜的prompt为空，跳过`)
            continue
          }

          console.log(`[INFO] 开始为第 ${i + 1} 个分镜生成图片`)
          console.log(`[DEBUG] 使用的Prompt: ${prompt}`)

          // 调用生成图片逻辑
          await generateImageForStoryboard(prompt, i, paths, storyboardFilePath)

          console.log(`[INFO] 成功为第 ${i + 1} 个分镜生成图片`)
        }

        console.log("[INFO] 批量生图完成")
        alert("批量生图完成")
      } catch (error) {
        console.error("[ERROR] 批量生图时出错:", error)
        alert("批量生图失败: " + error.message)
      }
    })
  } else {
    console.error("[ERROR] 未找到批量生图按钮")
  }
}

// 修改generateImageForStoryboard函数中的图片显示逻辑
const generateImageForStoryboard = async (prompt, index, paths, storyboardFilePath) => {
  try {
    // 获取SD预设配置
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

    // 解码base64图片并保存
    const base64Data = result.data.images[0].replace(/^data:image\/\w+;base64,/, "")
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 获取项目图片文件夹路径
    const projectFile = paths.project_file.replace(/\\/g, "/")
    const lastSlashIndex = projectFile.lastIndexOf("/")
    const projectDir = projectFile.substring(0, lastSlashIndex + 1)
    const imagesDir = `${projectDir}images`
    console.log("[DEBUG] 修正后的图片文件夹路径:", imagesDir)

    // 生成唯一文件名
    const timestamp = Date.now()
    const imageFileName = `image_${timestamp}.png`
    const imagePath = `${imagesDir}/${imageFileName}`
    console.log("[DEBUG] 生成的图片保存路径:", imagePath)

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
      console.log(`[DEBUG] 更新第 ${index + 1} 个分镜项的图片容器`)

      // 清空现有内容
      imageContainer.innerHTML = ""
      console.log(`[DEBUG] 已清空图片容器`)

      // 显示所有图片（最多4张）
      imagePaths.slice(-4).forEach((imagePath, imgIndex) => {
        console.log(`[DEBUG] 添加第 ${imgIndex + 1} 张图片: ${imagePath}`)

        const imageItem = document.createElement("div")
        imageItem.className = "image-item"

        const img = document.createElement("img")
        const imgSrc = `/api/projects/${imagePath.replace(/\\/g, "/").split("books/")[1]}`
        img.src = imgSrc
        img.alt = `Generated Image ${imgIndex + 1}`

        // 添加图片加载事件
        img.onerror = () => {
          console.error(`[ERROR] 图片加载失败: ${imgSrc}`)
          img.src = "/placeholder.svg?height=150&width=150"
        }

        img.onload = () => {
          console.log(`[INFO] 图片加载成功: ${imgSrc}`)
        }

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
        console.log(`[DEBUG] 图片数量超过4张，显示剩余数量: ${imagePaths.length - 4}`)
        const countOverlay = document.createElement("div")
        countOverlay.className = "image-count"
        countOverlay.textContent = `+${imagePaths.length - 4}`
        imageContainer.appendChild(countOverlay)
      }

      console.log(`[INFO] 成功更新第 ${index + 1} 个分镜项的图片显示`)
    } else {
      console.error(`[ERROR] 未找到第 ${index + 1} 个分镜项的图片容器`)
    }
  } catch (error) {
    console.error("[ERROR] 生成图片时出错:", error)
    throw error // 抛出错误以便批量生图逻辑处理
  }
}
