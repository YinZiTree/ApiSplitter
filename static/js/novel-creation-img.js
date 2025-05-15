export const setupAiGenerateButton = (projectData, paths, storyboardFilePath) => {
  const aiGenerateButton = document.querySelector(".action-button:nth-child(2)");
  if (aiGenerateButton) {
    console.log("[INFO] 找到AI生成分镜按钮");
    aiGenerateButton.addEventListener("click", async () => {
      console.log("[INFO] AI生成分镜按钮被点击");

      try {
        // 获取项目描述
        const description = projectData.data.description;
        if (!description) {
          throw new Error("项目描述为空");
        }
        console.log("[DEBUG] 获取项目描述:", description);

        // 加载preset_config配置
        console.log("[INFO] 开始加载preset_config.json");
        const configResponse = await fetch("/api/config/preset");
        if (!configResponse.ok) {
          throw new Error("加载preset_config.json失败");
        }
        const presetConfig = await configResponse.json();
        console.log("[INFO] 成功加载preset_config.json:", presetConfig);

        // 构建请求参数
        const requestBody = {
          description: description,
          ...presetConfig,
        };
        console.log("[DEBUG] 构建的请求参数:", requestBody);

        // 发送生成分镜请求
        console.log("[INFO] 开始发送生成分镜请求");
        const response = await fetch("/api/generate-storyboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          console.error("[ERROR] 有个bug，刷新下网页就好了", response.status);
          throw new Error("生成分镜失败");
        }

        const result = await response.json();
        console.log("[INFO] 分镜生成成功:", result);

        // 更新storyboard_file内容
        if (result.status === "success") {
          console.log("[INFO] 开始更新storyboard_file内容");

          // 移除Markdown代码块标记
          const rawContent = result.data.choices[0].message.content;
          const jsonContent = rawContent
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          console.log("[DEBUG] 处理后的JSON内容:", jsonContent);

          try {
            const storyboards = JSON.parse(jsonContent).data;
            console.log("[DEBUG] 解析后的分镜数据:", storyboards);

            // 构建更新后的storyboard数据
            const updatedStoryboard = {
              data: storyboards,
              status: "success",
              lastUpdated: new Date().toISOString(),
            };
            console.log("[DEBUG] 更新后的storyboard数据:", updatedStoryboard);

            // 发送更新请求
            const updateResponse = await fetch(
              "/api/storyboard?path=" + encodeURIComponent(paths.storyboard_file),
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedStoryboard),
              }
            );

            if (!updateResponse.ok) {
              throw new Error("更新storyboard_file失败");
            }
            console.log("[INFO] 成功更新storyboard_file");

            // 重新加载分镜数据
            console.log("[INFO] 开始重新加载分镜数据");
            const reloadResponse = await fetch(storyboardFilePath);
            if (!reloadResponse.ok) {
              throw new Error("重新加载分镜数据失败");
            }
            const reloadedData = await reloadResponse.json();
            console.log("[INFO] 成功重新加载分镜数据:", reloadedData);

            // 动态更新页面分镜
            const storyboardContainer = document.querySelector(".storyboard-content");
            if (storyboardContainer) {
              storyboardContainer.innerHTML = "";

              // 确保reloadedData.data.data是一个数组
              const storyboards = Array.isArray(reloadedData.data.data)
                ? reloadedData.data.data
                : [reloadedData.data.data];
              console.log("[DEBUG] 解析后的分镜数据:", storyboards);

              // 在动态填充分镜数据时修改图片显示逻辑
              storyboards.forEach((storyboard, index) => {
                const storyboardItem = document.createElement("div");
                storyboardItem.className = "storyboard-item";
  
                storyboardItem.innerHTML = `
                  <div class="storyboard-field">
                      <textarea class="storyboard-text">${storyboard.text}</textarea>
                  </div>
                  <div class="storyboard-field">
                      <textarea class="storyboard-content">${storyboard.content}</textarea>
                  </div>
                  <div class="storyboard-field">
                      <textarea class="storyboard-prompt">${storyboard.prompt}</textarea>
                  </div>
                                              <div class="storyboard-field">
                                                  <div class="image-container"></div>
                                              </div>
                  <div class="storyboard-field">
                      <div class="storyboard-actions">
                          <button class="storyboard-action">
                              <i class="fas fa-image"></i> 生成图片
                          </button>
                          <button class="storyboard-action">
                              <i class="fas fa-volume-up"></i> 生成音频
                          </button>
                      </div>
                  </div>
                  <div class="storyboard-media">
                      <div class="image-container"></div>
                      <div class="audio-container"></div>
                  </div>
                `;
  
                // 获取图片容器
                const imageContainer = storyboardItem.querySelector(".image-container");
  
                // 检查并处理图片路径
                if (storyboard.image_paths && Array.isArray(storyboard.image_paths)) {
                  storyboard.image_paths.forEach((imagePath, imgIndex) => {
                    if (imgIndex < 4) { // 最多显示4张图片
                      const imageItem = document.createElement("div");
                      imageItem.className = "image-item";
                      
                      const img = document.createElement("img");
                      img.src = `/api/projects/${imagePath.replace(/\\/g, "/").split("books/")[1]}`;
                      img.alt = `Generated Image ${imgIndex + 1}`;
                      
                      imageItem.appendChild(img);
                      imageContainer.appendChild(imageItem);
                    }
                  });
  
                  // 如果图片超过4张，显示剩余数量
                  if (storyboard.image_paths.length > 4) {
                    const countOverlay = document.createElement("div");
                    countOverlay.className = "image-count";
                    countOverlay.textContent = `+${storyboard.image_paths.length - 4}`;
                    imageContainer.appendChild(countOverlay);
                  }
                }
  
                storyboardContainer.appendChild(storyboardItem);
              });
              console.log("[INFO] 成功更新页面分镜");
            }
          } catch (error) {
            console.error("[ERROR] 解析分镜数据时出错:", error);
            throw new Error("解析分镜数据失败");
          }
        }
      } catch (error) {
        console.error("[ERROR] 有个bug，刷新下网页就好了", error);
        alert("生成分镜失败，请稍后重试");
      }
    });
  } else {
    console.error("[ERROR] 未找到AI生成分镜按钮");
  }
};