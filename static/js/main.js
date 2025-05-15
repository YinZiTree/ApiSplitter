// 导入所有需要的模块
import { initTabNavigation } from "./tabNavigation.js"
import { loadPageContent } from "./pageLoader.js"

// 页面初始化加载
document.addEventListener("DOMContentLoaded", () => {
  // 初始化标签页导航
  initTabNavigation(loadPageContent)

  // 初始加载默认页面
  loadPageContent("novel-directory")
  
  // 移除小说创作界面的自动初始化
  // initializeNovelCreation();
})

// 标签页切换逻辑
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    // 移除所有页面的active类
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // 添加当前页面的active类
    const pageId = button.getAttribute('data-page');
    document.getElementById(pageId).classList.add('active');

    // 更新按钮的active状态
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
  });
});
