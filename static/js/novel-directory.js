export const initializeNovelDirectory = async () => {
    console.log("[INFO] 开始初始化小说项目目录页面");
    
    try {
        const ongoingProjectsContainer = document.getElementById('ongoing-projects');
        if (!ongoingProjectsContainer) {
            console.error("[ERROR] 未找到进行中的项目容器");
            return;
        }

        console.log("[DEBUG] 清空进行中的项目容器");
        ongoingProjectsContainer.innerHTML = '';

        console.log("[INFO] 开始获取项目数据...");
        const response = await fetch('/api/projects');
        if (!response.ok) {
            console.error(`[ERROR] HTTP请求失败，状态码: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("[DEBUG] 成功获取项目数据:", data);

        if (data.status === 'success') {
            console.log(`[INFO] 共获取到 ${data.data.length} 个项目`);
            
            const ongoingProjects = data.data.filter(project => project.progress < 100);
            console.log(`[INFO] 其中 ${ongoingProjects.length} 个是进行中的项目`);

            // 添加删除项目函数
            const deleteProject = async (projectId) => {
                try {
                    const response = await fetch(`/api/projects/${projectId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('删除项目失败');
                    }

                    // 重新初始化页面
                    initializeNovelDirectory();
                } catch (error) {
                    console.error('删除项目时出错:', error);
                    alert('删除项目失败，请稍后重试');
                }
            };

                    // 添加编辑项目函数
                    const editProject = async (project) => {
                        console.log(`[INFO] 开始编辑项目: ${project.title}`)
                        console.log(`[DEBUG] 传递项目参数:`, project)

                        try {
                            // 获取项目文件路径
                            const response = await fetch(`/api/projects/${project.id}/paths`)
                            if (!response.ok) {
                                if (response.status === 404) {
                                    console.error(`[ERROR] 项目 ${project.id} 的文件路径未找到`)
                                    alert("项目文件路径未找到，请检查项目是否存在")
                                } else {
                                    throw new Error(`获取项目文件路径失败，状态码: ${response.status}`)
                                }
                                return
                            }

                            const pathsData = await response.json()
                            if (pathsData.status !== "success") {
                                throw new Error(pathsData.message || "获取项目文件路径失败")
                            }

                            console.log("[INFO] 成功获取项目文件路径:", pathsData)

                            // 直接使用API返回的绝对路径
                            const projectPaths = {
                                project_file: pathsData.data.project_file,
                                storyboard_file: pathsData.data.storyboard_file,
                                images_dir: pathsData.data.assets_dir.replace(/assets$/, 'images'),
                                mp3_dir: pathsData.data.assets_dir.replace(/assets$/, 'mp3'),
                                mp4_dir: pathsData.data.assets_dir.replace(/assets$/, 'mp4'),
                            }

                            // 存储项目文件路径到sessionStorage
                            sessionStorage.setItem("projectPaths", JSON.stringify(projectPaths))
                            console.log("[INFO] 项目文件路径已存储到sessionStorage:", projectPaths)

                            // 切换到小说创作界面
                            const tabButton = document.querySelector('.tab-button[data-page="novel-creation"]')
                            if (tabButton) {
                                tabButton.click()
                                console.log("[INFO] 成功切换到小说创作界面")
                            } else {
                                console.error("[ERROR] 未找到小说创作界面的标签按钮")
                            }
                        } catch (error) {
                            console.error("[ERROR] 获取项目文件路径时出错:", error)
                            alert(`获取项目文件路径失败: ${error.message}`)
                        }
                    }
                    ;

            // 在项目卡片渲染后添加事件监听
            if (ongoingProjects.length > 0) {
                console.log("[INFO] 开始渲染进行中的项目...");
                const projectCards = ongoingProjects.map(project => `
                    <div class="project-card">
                        <!-- 项目头部信息 -->
                        <div class="project-header">
                            <!-- 项目标题 -->
                            <div class="project-title">${project.title}</div>
                            <!-- 项目操作菜单 -->
                            <div class="project-menu">
                                <i class="fas fa-ellipsis-h"></i>
                                <div class="menu-dropdown">
                                    <button class="menu-item">编辑</button>
                                    <button class="menu-item">删除</button>
                                </div>
                            </div>
                        </div>
                        <!-- 项目描述 -->
                        <div class="project-description" style="color: #8e8e93;">内容：${project.description ? project.description.substring(0, 5) : '无描述'}</div>
                        <!-- 项目进度条 -->
                        <div class="project-progress">
                            <div class="progress-bar">
                                <!-- 进度条填充部分，宽度根据进度百分比动态设置 -->
                                <div class="progress-fill" style="width: ${project.progress}%"></div>
                            </div>
                            <!-- 进度百分比文本 -->
                            <div class="progress-text">${project.progress}% 完成</div>
                        </div>
                        <!-- 项目统计信息 -->
                        <div class="project-stats">
                            <!-- 段落数量统计 -->
                            <div class="project-stat">
                                <i class="fas fa-file-alt"></i> ${project.paragraphCount} 段落
                            </div>
                            <!-- 字数统计 -->
                            <div class="project-stat">
                                <i class="fas fa-pencil-alt"></i> ${project.wordCount} 字
                            </div>
                        </div>
                        <!-- 最后更新时间 -->
                        <div class="project-updated">最后更新: ${project.lastUpdated}</div>
                    </div>
                `).join('');

                ongoingProjectsContainer.innerHTML = projectCards;
                
                // 为每个项目的编辑按钮添加事件监听
                document.querySelectorAll('.menu-item').forEach(button => {
                    if (button.textContent === '编辑') {
                        button.addEventListener('click', (e) => {
                            const projectCard = e.target.closest('.project-card');
                            const project = ongoingProjects.find(p => p.title === projectCard.querySelector('.project-title').textContent);
                            if (project) {
                                editProject(project);
                            }
                        });
                    }
                });
                
                // 为每个项目的删除按钮添加事件监听
                document.querySelectorAll('.menu-item').forEach(button => {
                    if (button.textContent === '删除') {
                        button.addEventListener('click', (e) => {
                            const projectId = e.target.closest('.project-card').querySelector('.project-title').textContent;
                            if (confirm('确定要删除这个项目吗？此操作不可恢复！')) {
                                deleteProject(projectId);
                            }
                        });
                    }
                });

                console.log("[INFO] 成功渲染进行中的项目");
            } else {
                console.warn("[WARN] 没有进行中的项目");
                ongoingProjectsContainer.innerHTML = '<div class="no-projects">当前没有进行中的项目</div>';
            }
        } else {
            console.error("[ERROR] 获取项目数据失败:", data.message);
        }
    } catch (error) {
        console.error("[ERROR] 初始化过程中发生错误:", error);
    }
};
