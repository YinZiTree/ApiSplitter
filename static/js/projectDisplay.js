import { navigateToProject, editProject, deleteProject } from "./projectManager.js"
import { formatDate } from "./utils.js"

/**
 * Display project list
 * @param {Array} projects - List of projects to display
 */
export function displayProjects(projects) {
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

  // Bind project card click events
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Ignore clicks on edit and delete buttons
      if (!e.target.closest(".project-actions")) {
        const projectId = this.getAttribute("data-id")
        navigateToProject(projectId)
      }
    })
  })

  // Bind edit and delete button events
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
