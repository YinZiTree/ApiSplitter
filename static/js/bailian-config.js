// 更新模型卡片
export function updateModelCards(models) {
  const container = document.getElementById('model-cards-container');
  if (!container) return;

  // 设置容器样式
  container.style.maxHeight = '400px'; // 限制最大高度
  container.style.overflowY = 'auto';  // 添加垂直滚动条
  container.style.paddingRight = '8px'; // 为滚动条留出空间

  // 清空现有内容
  container.innerHTML = '';

  // 为每个模型生成卡片
  models.forEach(model => {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.innerHTML = `
      <div class="model-card-header">
        <div class="model-name">${model.name}</div>
        <div class="model-tag">${model.id.includes('70') ? 'ID' : model.id.includes('13') ? 'ID' : 'ID'}</div>
      </div>
      <div class="model-desc">${model.description}</div>
      <div class="model-features">
        ${(model.features || []).map(feature => `  <!-- 添加防御性检查 -->
          <div class="feature-item">
            <i class="fas fa-check-circle"></i>
            <span>${feature}</span>
          </div>
        `).join('')}
      </div>
    `;

    // 添加点击事件
    card.addEventListener('click', function() {
      // 移除所有卡片的激活状态
      container.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
      // 为当前卡片添加激活状态
      this.classList.add('active');
      // 打印选中的模型信息
      console.log('当前选中的模型:', model);
    });

    // 默认选中第一个模型
    if (models.indexOf(model) === 0) {
      card.classList.add('active');
    }

    container.appendChild(card);
  });
}

// 加载百炼模型列表
export function loadBailianModels() {
  const container = document.getElementById('model-cards-container');
  if (!container) return;

  // 显示加载状态
  container.innerHTML = `
    <div class="loading-models">
      <div class="loading-spinner"></div>
      <p>正在加载模型列表...</p>
    </div>
  `;

  fetch('/api/bailian/models')
    .then(response => response.json())
    .then(result => {
      // 直接打印原始响应
      console.log('API原始响应:', result);

      if (result.status === 'success' && result.data && result.data.length > 0) {
        // 更新模型列表
        updateModelCards(result.data);
      } else {
        throw new Error(result.message || '获取模型列表失败');
      }
    })
    .catch(error => {
      console.error('加载百炼模型列表时出错:', error);
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>加载模型列表失败: ${error.message}</p>
        </div>
      `;
    });
}

// 保存预设
// 修改savePreset函数
export function savePreset() {
  // 获取系统提示词
  const systemPrompt = document.querySelector('textarea[placeholder*="设置AI助手的角色"]').value;
  // 获取API Key
  const apiKey = document.querySelector('input[placeholder*="请输入您的API Key"]').value;
  // 获取当前选中的模型
  const activeModel = document.querySelector('.model-card.active .model-name')?.textContent;

  // 验证系统提示词
  if (!systemPrompt.trim()) {
    alert('请填写系统提示词');
    return;
  }

  // 验证API Key
  if (!apiKey.trim()) {
    alert('请填写API Key');
    return;
  }

  // 验证模型选择
  if (!activeModel) {
    alert('请选择一个模型');
    return;
  }

  // 构建保存数据
  const presetData = {
    systemPrompt,
    apiKey,
    model: activeModel
  };

  // 发送保存请求
  fetch('/api/bailian/save-preset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(presetData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.status === 'success') {
      alert('预设保存成功，已覆盖原有配置');
    } else {
      throw new Error(result.message || '保存失败');
    }
  })
  .catch(error => {
    console.error('保存预设时出错:', error);
    alert(`保存失败: ${error.message}`);
  });
}

// 删除或注释掉这行代码
// window.savePreset = savePreset;

// 修改initBailianConfig函数
// 添加加载本地预设函数
export function loadLocalPreset() {
  fetch('/api/bailian/load-preset')
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // 填充系统提示词
        const systemPromptTextarea = document.querySelector('textarea[placeholder*="设置AI助手的角色"]');
        if (systemPromptTextarea && data.data.systemPrompt) {
          systemPromptTextarea.value = data.data.systemPrompt;
        }

        // 填充API Key
        const apiKeyInput = document.querySelector('input[placeholder*="请输入您的API Key"]');
        if (apiKeyInput && data.data.apiKey) {
          apiKeyInput.value = data.data.apiKey;
        }

        // 选择对应的模型
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
          const modelName = card.querySelector('.model-name').textContent;
          if (modelName === data.data.model) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        });

        alert('本地预设加载成功');
      } else {
        throw new Error(data.message || '加载预设失败');
      }
    })
    .catch(error => {
      console.error('加载本地预设时出错:', error);
      alert(`加载本地预设失败: ${error.message}`);
    });
}

// 在initBailianConfig函数中绑定点击事件
export function initBailianConfig() {
  loadBailianModels();
  
  // 绑定保存按钮点击事件
  const saveButton = document.getElementById('send-prompt-btn');
  if (saveButton) {
    saveButton.addEventListener('click', function(event) {
      event.preventDefault(); // 阻止默认行为
      savePreset();
    });
  }

  // 绑定加载本地预设按钮点击事件
  const loadPresetButton = document.querySelector('.text-button');
  if (loadPresetButton) {
    loadPresetButton.addEventListener('click', function(event) {
      event.preventDefault();
      loadLocalPreset();
    });
  }
}

// Update default export
export default {
  updateModelCards,
  loadBailianModels,
  initBailianConfig
};