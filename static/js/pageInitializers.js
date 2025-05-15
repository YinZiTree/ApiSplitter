import { loadProjects, createNewProject } from "./projectManager.js"
import { initBailianConfig } from "./bailian-config.js"
import { initSDConfig } from "./sd-config.js"
import { initializeTTS } from "./f5tts-config.js"
import { initializeNovelDirectory as initNovelDirectory } from "./novel-directory.js"  // 新增导入

/**
 * Initialize novel directory page
 */
export function initializeNovelDirectory() {
  console.log("初始化小说项目目录页面")
  initNovelDirectory()  // 调用初始化函数
  loadProjects()

  // Bind create new project button event
  const createButton = document.getElementById("create-project-btn")
  if (createButton) {
    createButton.addEventListener("click", createNewProject)
  }
}

/**
 * Initialize novel creation page
 */
export function initializeNovelCreation() {
  // 注释掉所有初始化逻辑
  // console.log("初始化小说创作界面");
  // 从sessionStorage获取项目参数
  // const projectData = sessionStorage.getItem('currentProject');
  // if (projectData) {
  //   console.log('[INFO] 接收到项目参数:', projectData);
  //   try {
  //     const project = JSON.parse(projectData);
  //     console.log('[DEBUG] 解析后的项目数据:', project);
  //     const descriptionInput = document.querySelector('.chapter-param-input');
  //     if (descriptionInput) {
  //       descriptionInput.value = project.description || '';
  //       console.log('[INFO] 成功填充项目描述到输入框');
  //     } else {
  //       console.error('[ERROR] 未找到项目描述输入框');
  //     }
  //   } catch (error) {
  //     console.error('[ERROR] 解析项目数据时出错:', error);
  //   }
  // } else {
  //   console.log('[INFO] 未接收到项目参数，使用默认值初始化');
  // }
}

/**
 * Initialize SD config page
 */
export function initializeSDConfig() {
  console.log("初始化SD参数配置")
  initSDConfig()  // 调用初始化函数
  // Load SD preset list, etc.
}

/**
 * Initialize TTS config page
 */
export function initializeTTSConfig() {
  console.log("初始化TTS参数配置")
  initializeTTS()  // 调用初始化函数
  // Load voice list, etc.
}

/**
 * Initialize Bailian config page
 */
export function initializeBailianConfig() {
  initBailianConfig()
}
