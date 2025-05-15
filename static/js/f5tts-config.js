// static\js\f5tts-config.js
document.addEventListener('DOMContentLoaded', function() {
    // 初始化语音合成页面
    initializeTTSConfig();
  });

  // 移除DOMContentLoaded事件监听，改为导出初始化函数
  export function initializeTTS() {
    initializeTTSConfig();
  }
  
  // 在initializeTTSConfig函数中添加以下代码
  function initializeTTSConfig() {
      // 初始化时获取参考音频选择框和提示元素
      const referenceAudioSelect = document.getElementById('reference-audio-select');
      const referenceAudioPrompt = document.getElementById('reference-audio-prompt');
      
      // 初始化时禁用选择框并显示提示
      if (referenceAudioSelect && referenceAudioPrompt) {
        referenceAudioSelect.disabled = true;
        referenceAudioPrompt.style.display = 'flex';
      }
  
      // 绑定保存预设按钮事件
      const savePresetBtn = document.getElementById('save-preset-btn');
      if (savePresetBtn) {
          savePresetBtn.addEventListener('click', async () => {
              const config = {
                  ip: document.getElementById('tts-ip-input').value,
                  port: document.getElementById('tts-port-input').value,
                  ttsModel: document.getElementById('tts-model-select').value,
                  voiceModel: document.getElementById('voices-model-select').value,
                  nfeStep: document.getElementById('nfe-step-input').value,
                  timestamp: new Date().toISOString()
              };
  
              try {
                  const response = await fetch('/api/audio/save_preset', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(config)
                  });
  
                  const result = await response.json();
                  if (result.status === 'success') {
                      alert('预设保存成功！');
                  } else {
                      throw new Error(result.message || '保存失败');
                  }
              } catch (error) {
                  console.error('保存预设时出错:', error);
                  alert('保存预设失败: ' + error.message);
              }
          });
      }
      // 服务器连接按钮事件
      const connectBtn = document.getElementById('tts-connect-btn');
      const ipInput = document.getElementById('tts-ip-input');
      const portInput = document.getElementById('tts-port-input');
      const connectionStatus = document.getElementById('tts-connection-status');
      
      // 在initializeTTSConfig函数中添加以下代码
      if (connectBtn && ipInput && portInput && connectionStatus) {
        connectBtn.addEventListener('click', async function() {
          console.log('[DEBUG] 连接服务器按钮被点击');
          
          const ip = ipInput.value.trim();
          const port = portInput.value.trim();
          
          console.log(`[DEBUG] 输入参数 - IP: ${ip}, Port: ${port}`);
          
          if (!ip || !port) {
            console.warn('[WARN] IP地址或端口为空');
            alert('请输入IP地址和端口');
            return;
          }
          
          // 更新连接状态为"连接中"
          connectionStatus.textContent = '连接中...';
          console.log('[DEBUG] 连接状态更新为: 连接中...');
          
          try {
            const response = await fetch(`/api/tts/connect`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ip: ip,
                port: port
              })
            });
            
            console.log('[DEBUG] 请求已发送，等待响应...');
            
            const result = await response.json();
            
            console.log('[DEBUG] 收到响应:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
              console.log('[DEBUG] 连接成功');
              connectionStatus.textContent = '已连接';
              connectionStatus.classList.add('connected');
              
              // 连接成功后获取音色模型列表
              await fetchVoicesList();
              
              // 连接成功后启用选择框并隐藏提示
              if (referenceAudioSelect && referenceAudioPrompt) {
                referenceAudioSelect.disabled = false;
                referenceAudioPrompt.style.display = 'none';
              }
            } else {
              console.error('[ERROR] 连接失败:', result.message || '未知错误');
              connectionStatus.classList.remove('connected');
              throw new Error(result.message || '连接失败');
            }
          } catch (error) {
            console.error('[ERROR] 连接TTS服务器出错:', error);
            connectionStatus.textContent = '连接失败: ' + error.message;
            connectionStatus.classList.remove('connected');
          }
        });
      }
  
      // 迭代步数同步逻辑
      const nfeStepSlider = document.getElementById('nfe-step-slider');
      const nfeStepInput = document.getElementById('nfe-step-input');
      
      if (nfeStepSlider && nfeStepInput) {
          // 滑块变化时更新输入框
          nfeStepSlider.addEventListener('input', function() {
              nfeStepInput.value = this.value;
          });
          
          // 输入框变化时更新滑块
          nfeStepInput.addEventListener('input', function() {
              let value = parseInt(this.value);
              if (value < 1) value = 1;
              if (value > 100) value = 100;
              nfeStepSlider.value = value;
              this.value = value; // 确保输入框显示正确的值
          });
      }
  }



async function fetchVoicesList() {
    console.log('[DEBUG] 开始获取音色模型列表');
    const voicesSelect = document.getElementById('voices-model-select');
    const voicesPrompt = document.getElementById('voices-model-prompt');
    
    try {
        const response = await fetch('/api/tts/get_voices');
        const result = await response.json();
        
        console.log('[DEBUG] 获取音色模型列表响应:', JSON.stringify(result, null, 2));
        
        if (result.status === 'success') {
            console.log('[DEBUG] 成功获取音色模型列表');
            
            // 清空现有选项
            voicesSelect.innerHTML = '';
            
            // 添加新选项
            result.data.voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                option.textContent = voice;
                voicesSelect.appendChild(option);
            });
            
            // 启用选择框并隐藏提示
            voicesSelect.disabled = false;
            voicesPrompt.style.display = 'none';
        } else {
            console.error('[ERROR] 获取音色模型列表失败:', result.message);
            throw new Error(result.message || '获取音色模型列表失败');
        }
    } catch (error) {
        console.error('[ERROR] 获取音色模型列表时出错:', error);
        voicesPrompt.textContent = '获取音色模型列表失败: ' + error.message;
        voicesPrompt.style.display = 'flex';
    }
}
