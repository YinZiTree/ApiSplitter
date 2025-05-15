import { displayProjects as displayProjectList } from "./projectDisplay.js"
import { createProjectModal } from "./projectModal.js"
import { formatDate } from "./utils.js"

/**
 * Load project list
 */
export function loadProjects() {
  const projectsContainer = document.getElementById("projects-container")
  if (!projectsContainer) return

  fetch("/api/projects")
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        displayProjectList(result.data)
      } else {
        throw new Error(result.message || "获取项目失败")
      }
    })
    .catch((error) => {
      console.error("加载项目列表出错:", error)
      projectsContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <div>
            <h3>加载项目失败</h3>
            <p>${error.message}</p>
          </div>
        </div>
      `
    })
}

/**
 * Create new project
 */
export function createNewProject() {
  createProjectModal()
}

/**
 * 显示项目列表
 * @param {Array} projects - 要显示的项目列表
 */
function displayProjects(projects) {
  const projectsContainer = document.getElementById("projects-container")
  if (!projectsContainer) return

  if (projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <h3>暂无项目</h3>
        <p>点击"创建新项目"按钮开始您的创作之旅</p>
      </div>
    `
    return
  }

  let projectsHTML = '<div class="projects-grid">'

  projects.forEach((project) => {
    projectsHTML += `
      <div class="project-card" data-id="${project.id}">
        <div class="project-cover">
          <img src="${project.cover_image || "/img/default-cover.jpg"}" alt="${project.title}">
        </div>
        <div class="project-info">
          <h3>${project.title}</h3>
          <p>${project.description || "暂无简介"}</p>
          <div class="project-meta">
            <span><i class="fas fa-file-alt"></i> ${project.chapter_count || 0}章</span>
            <span><i class="fas fa-calendar-alt"></i> ${formatDate(project.updated_at)}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="edit-project-btn" data-id="${project.id}">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="delete-project-btn" data-id="${project.id}">
            <i class="fas fa-trash-alt"></i> 删除
          </button>
        </div>
      </div>
    `
  })

  projectsHTML += "</div>"
  projectsContainer.innerHTML = projectsHTML

  // 绑定项目卡片点击事件
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // 忽略编辑和删除按钮的点击
      if (!e.target.closest(".project-actions")) {
        const projectId = this.getAttribute("data-id")
        navigateToProject(projectId)
      }
    })
  })

  // 绑定编辑和删除按钮事件
  document.querySelectorAll(".edit-project-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation()
      const projectId = this.getAttribute("data-id")
      editProject(projectId)
    })
  })

  document.querySelectorAll(".delete-project-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation()
      const projectId = this.getAttribute("data-id")
      deleteProject(projectId)
    })
  })
}

/**
 * 导航到项目详情
 * @param {string} projectId - 项目ID
 */
export function navigateToProject(projectId) {
  console.log("导航到项目:", projectId)
  // 在这里实现跳转到项目详情页的逻辑
}

/**
 * 编辑项目
 * @param {string} projectId - 项目ID
 */
export function editProject(projectId) {
  console.log("编辑项目:", projectId)
  // 在这里实现编辑项目的逻辑
}

/**
 * 删除项目
 * @param {string} projectId - 项目ID
 */
export function deleteProject(projectId) {
  if (!confirm("确定要删除这个项目吗？此操作无法撤销。")) {
    return
  }

  fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        // 刷新项目列表
        loadProjects()
      } else {
        throw new Error(result.message || "删除项目失败")
      }
    })
    .catch((error) => {
      console.error("删除项目出错:", error)
      alert(`删除失败: ${error.message}`)
    })
}
