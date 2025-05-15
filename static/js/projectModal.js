import { loadProjects } from "./projectManager.js"

/**
 * Create project modal
 */
export function createProjectModal() {
  // Show create project modal
  const modalHtml = `
    <div class="modal-overlay" id="create-project-modal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>创建新项目</h3>
          <button class="modal-close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>项目名称</label>
            <input type="text" id="project-name-input" placeholder="请输入项目名称" class="form-control">
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea id="project-description-input" placeholder="请输入项目描述（选填）" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>上传文件（可选）</label>
            <div class="file-upload-container">
              <button class="upload-btn" id="upload-text-btn">
                <i class="fas fa-file-alt"></i> 上传TXT文件
              </button>
              <button class="upload-btn" id="upload-srt-btn">
                <i class="fas fa-file-video"></i> 上传SRT文件
              </button>
              <input type="file" id="file-upload-input" accept=".txt,.srt" style="display: none;">
              <div id="upload-file-name" class="upload-file-name"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" id="cancel-project-btn">取消</button>
          <button class="primary-button" id="start-project-btn">开始项目</button>
        </div>
      </div>
    </div>
  `

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Add modal related styles
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }
    
    .modal-container {
      width: 90%;
      max-width: 500px;
      background-color: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .modal-header h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    
    .modal-close-btn {
      border: none;
      background: none;
      color: var(--text-secondary);
      font-size: 18px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .modal-close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--text-primary);
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-footer {
      padding: 16px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .form-control {
      width: 100%;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background-color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-family: inherit;
    }
    
    textarea.form-control {
      min-height: 80px;
      resize: vertical;
    }
    
    .file-upload-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 8px;
    }
    
    .upload-btn {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    
    .upload-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .upload-file-name {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `
  document.head.appendChild(styleElement)

  // Bind event handlers
  const modal = document.getElementById("create-project-modal")
  const closeBtn = modal.querySelector(".modal-close-btn")
  const cancelBtn = document.getElementById("cancel-project-btn")
  const startBtn = document.getElementById("start-project-btn")
  const fileInput = document.getElementById("file-upload-input")
  const uploadTextBtn = document.getElementById("upload-text-btn")
  const uploadSrtBtn = document.getElementById("upload-srt-btn")
  const fileNameDisplay = document.getElementById("upload-file-name")

  // Close modal function
  const closeModal = () => {
    modal.style.opacity = "0"
    setTimeout(() => {
      modal.remove()
      styleElement.remove()
    }, 300)
  }

  // Bind close button events
  closeBtn.addEventListener("click", closeModal)
  cancelBtn.addEventListener("click", closeModal)

  // Click modal background to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  // File upload handling
  uploadTextBtn.addEventListener("click", () => {
    fileInput.accept = ".txt"
    fileInput.click()
  })

  uploadSrtBtn.addEventListener("click", () => {
    fileInput.accept = ".srt"
    fileInput.click()
  })

  // Handle file selection
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      // 清除之前的文件名和识别内容
      fileNameDisplay.textContent = `已选择: ${file.name}`
      document.getElementById("project-name-input").value = ""
      document.getElementById("project-description-input").value = ""

      // Read file content
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result

        // Process content based on file type
        if (file.name.endsWith(".txt")) {
          parseTextFile(content)
        } else if (file.name.endsWith(".srt")) {
          parseSrtFile(content)
        }
      }
      reader.readAsText(file)
    }
  })

  // Process text file content
  function parseTextFile(content) {
    const lines = content.split("\n").filter(line => line.trim() !== "");
    if (lines.length > 0) {
        const projectNameInput = document.getElementById("project-name-input");
        const projectDescInput = document.getElementById("project-description-input");
        
        // 生成项目标题：前10个字 + 时间戳
        const firstLine = lines[0].trim();
        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/[^\d]/g, '');
        
        // 处理非法字符
        const projectName = firstLine.substring(0, 10)
            .replace(/[:\\/*?"<>|]/g, '') // 去除非法字符
            .trim() + '_' + timestamp;
        
        if (!projectNameInput.value) {
            projectNameInput.value = projectName;
        }
        
        // 自动填充描述为文件内容的前100字
        if (!projectDescInput.value) {
            const description = content.substring(0, 10000).replace(/\n/g, ' ');
            projectDescInput.value = description;
        }
    }
}

function parseSrtFile(content) {
    console.log('开始解析SRT文件...');
    
    // 保留原始SRT格式的正则表达式
    const srtRegex = /(\d+\s+)?\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s+([\s\S]*?)(?=\n\n|\r\n\r\n|$)/g;
    const srtBlocks = [];
    let match;

    console.log('正在提取SRT内容...');
    while ((match = srtRegex.exec(content)) !== null) {
        if (match[0].trim()) {
            // 保留完整的SRT块
            srtBlocks.push(match[0]);
            console.log(`提取到SRT块：${match[0].substring(0, 100)}...`);
        }
    }

    console.log(`共提取到${srtBlocks.length}个SRT块`);
    
    if (srtBlocks.length > 0) {
        const projectNameInput = document.getElementById("project-name-input");
        const projectDescInput = document.getElementById("project-description-input");
        
        // 生成项目标题：第一个SRT块的前50字 + 时间戳
        const firstBlock = srtBlocks[0];
        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/[^\d]/g, '');
        
        // 处理非法字符
        const projectName = firstBlock.substring(0, 50)
            .replace(/[:\\/*?"<>|]/g, '') // 去除非法字符
            .replace(/--> /g, '') // 去除SRT时间标记
            .trim() + '_' + timestamp;
        
        console.log(`自动生成项目标题：${projectName}`);
        
        if (!projectNameInput.value) {
            projectNameInput.value = projectName;
        }
        
        // 填充描述内容，保留原始SRT格式
        if (!projectDescInput.value) {
            const description = srtBlocks.join('\n\n').substring(0, 10000);
            console.log(`自动填充描述内容：${description.substring(0, 100)}...`);
            projectDescInput.value = description;
        }
    } else {
        console.warn('未在SRT文件中找到有效内容');
    }
    
    console.log('SRT文件解析完成');
}

  // Start project button click handler
  startBtn.addEventListener("click", () => {
    const projectName = document.getElementById("project-name-input").value.trim()
    const projectDesc = document.getElementById("project-description-input").value.trim()
    const content = document.getElementById("project-description-input").value

    if (!projectName) {
        alert("请输入项目名称")
        return
    }

    // 计算字数和段落数
    const wordCount = content.length
    const paragraphCount = content.split('\n').filter(line => line.trim() !== '').length

    // Build project data
    const projectData = {
        title: projectName,
        description: projectDesc || "无描述",
        wordCount: wordCount,
        paragraphCount: paragraphCount,
        // 添加分镜数据
        storyboard: {
            data: [{
                text: projectDesc.substring(0, 100) || "默认文本",
                content: "默认内容描述",
                prompt: "Default prompt for image generation",
                image_paths: [],
                audio_info: {
                    path: "",
                    duration: "0分0秒",
                    size: "0 MB"
                }
            }]
        }
    }

    // Create project directly
    createProject(projectData, closeModal)
})
}

/**
 * Create project API request
 * @param {Object} projectData - Project data
 * @param {Function} onSuccess - Callback on success
 */
function createProject(projectData, onSuccess) {
  fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        if (onSuccess) onSuccess()
        // Refresh project list
        loadProjects()
      } else {
        throw new Error(result.message || "创建项目失败")
      }
    })
    .catch((error) => {
      console.error("创建项目出错:", error)
      alert(`创建项目失败: ${error.message}`)
    })
}
