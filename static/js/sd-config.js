// 将函数重命名为initSDConfig以匹配导入
export function initSDConfig() {
  // 服务器连接按钮事件
  const connectBtn = document.getElementById('sd-connect-btn');
  const ipInput = document.getElementById('sd-ip-input');
  const portInput = document.getElementById('sd-port-input');
  const connectionStatus = document.getElementById('sd-connection-status');
  const samplerNotice = document.getElementById('sampler-notice');
  const modelNotice = document.getElementById('model-notice');
  const samplerSelect = document.querySelector('select[aria-label="采样方法"]');
  const modelSelect = document.getElementById('sd-model-select');
  const loraNotice = document.getElementById('lora-notice');
  const loraSelect = document.getElementById('sd-lora-select');
  
  // 初始化时禁用选择框并显示提示
  if (loraSelect && loraNotice) {
    loraSelect.disabled = true;
    loraNotice.style.display = 'block';
  }
  if (samplerSelect && samplerNotice) {
    samplerSelect.disabled = true;
    samplerNotice.style.display = 'block';
  }
  if (modelSelect && modelNotice) {
    modelSelect.disabled = true;
    modelNotice.style.display = 'block';
  }


  // 添加获取LoRA的方法
  const getLoRAs = () => {
    const ip = document.getElementById('sd-ip-input').value.trim();
    const port = document.getElementById('sd-port-input').value.trim();
    
    fetch(`/api/sd/loras?ip=${ip}&port=${port}`)
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          updateLoRADropdown(result.data);
        }
      })
      .catch(error => {
        console.error('获取LoRA时出错:', error);
      });
  };
  

  
  // 连接成功后获取LoRA
  getLoRAs();
  
  // 添加更新LoRA下拉菜单的函数
  function updateLoRADropdown(loras) {
    const loraSelect = document.getElementById('sd-lora-select');
    if (loraSelect) {
      // 清空现有选项
      loraSelect.innerHTML = '';
      
      // 添加默认选项，值为空字符串
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '未选择';
      loraSelect.appendChild(defaultOption);
      
      // 添加新选项
      loras.forEach(lora => {
        const option = document.createElement('option');
        option.value = lora;
        option.textContent = lora;
        loraSelect.appendChild(option);
      });
    }
  }

  // 获取模型
  const getModels = () => {
    const ip = document.getElementById('sd-ip-input').value.trim();
    const port = document.getElementById('sd-port-input').value.trim();
    
    fetch(`/api/sd/models?ip=${ip}&port=${port}`)
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          updateModelDropdown(result.data);
        }
      })
      .catch(error => {
        console.error('获取模型时出错:', error);
      });
  };
  
  // 获取采样方法
  const getSamplers = () => {
    const ip = document.getElementById('sd-ip-input').value.trim();
    const port = document.getElementById('sd-port-input').value.trim();
    
    fetch(`/api/sd/samplers?ip=${ip}&port=${port}`)
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          updateSamplerDropdown(result.data);
        }
      })
      .catch(error => {
        console.error('获取采样方法时出错:', error);
      });
  };
  
  // 在连接服务器成功后调用获取模型和采样方法
  if (connectBtn && ipInput && portInput && connectionStatus) {
    connectBtn.addEventListener('click', function() {
      const ip = ipInput.value.trim();
      const port = portInput.value.trim();
      
      if (!ip || !port) {
        alert('请输入IP地址和端口');
        return;
      }
      
      // 更新连接状态为"连接中"
      connectionStatus.textContent = '连接中...';
      connectionStatus.classList.remove('connected', 'error');
      
      // 尝试连接到SD服务器
      fetch('/api/images/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip: ip,
          port: port
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        if (result.status === 'success') {
          connectionStatus.textContent = '已连接';
          connectionStatus.classList.remove('error', 'connecting');
          connectionStatus.classList.add('connected');
          
          // 启用选择框并隐藏提示
          if (samplerSelect && samplerNotice) {
            samplerSelect.disabled = false;
            samplerNotice.style.display = 'none';
          }
          if (modelSelect && modelNotice) {
            modelSelect.disabled = false;
            modelNotice.style.display = 'none';
          }
          
          // ... 在连接成功后的代码中添加 ...
          if (loraSelect && loraNotice) {
            loraSelect.disabled = false;
            loraNotice.style.display = 'none';
          } 

          // 连接成功后获取模型和采样方法和loar
          getModels();
          getSamplers();
          getLoRAs();
        } else {
          throw new Error(result.message || '连接失败');
        }
      })
      .catch(error => {
        console.error('连接SD服务器出错:', error);
        connectionStatus.textContent = '连接失败: ' + error.message;
        connectionStatus.classList.remove('connected', 'connecting');
        connectionStatus.classList.add('error');
        alert('连接失败: ' + error.message);
      });
    });
  }
    // 采样步数同步
    const stepsRange = document.getElementById('sampling-steps-range');
    const stepsInput = document.getElementById('sampling-steps-input');
    if (stepsRange && stepsInput) {
    stepsRange.addEventListener('input', () => {
        stepsInput.value = stepsRange.value;
    });
    stepsInput.addEventListener('input', () => {
        stepsRange.value = stepsInput.value;
    });
    }

    // 提示词引导CFG Scale同步
    const cfgRange = document.getElementById('cfg-scale-range');
    const cfgInput = document.getElementById('cfg-scale-input');
    if (cfgRange && cfgInput) {
    cfgRange.addEventListener('input', () => {
        cfgInput.value = cfgRange.value;
    });
    cfgInput.addEventListener('input', () => {
        cfgRange.value = cfgInput.value;
    });
    }
    
    // 保存预设功能
    const savePresetBtn = document.getElementById('save-preset-btn');
    // 添加IP/端口变化监听
    function setupIpPortChangeListener() {
      const ipInput = document.getElementById('sd-ip-input');
      const portInput = document.getElementById('sd-port-input');
      const connectionStatus = document.getElementById('sd-connection-status');
    
      if (ipInput && portInput && connectionStatus) {
        const handleChange = () => {
          if (connectionStatus.classList.contains('connected')) {
            // 如果已连接，提示用户需要重新连接
            if (confirm('IP或端口已更改，需要重新连接服务器。是否立即连接？')) {
              connectBtn.click();
            } else {
              // 重置连接状态
              connectionStatus.textContent = '未连接';
              connectionStatus.classList.remove('connected');
            }
          }
        };
    
        ipInput.addEventListener('change', handleChange);
        portInput.addEventListener('input', handleChange);
      }
    }
    
    // 在initSDConfig函数中调用
    setupIpPortChangeListener();
    
    // 修改保存预设逻辑，添加连接状态检查
    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', function() {
        // 检查是否已连接
        const connectionStatus = document.getElementById('sd-connection-status');
        if (!connectionStatus.classList.contains('connected')) {
          alert('请先成功连接服务器后再保存预设');
          return;
        }
    
        // 使用更安全的元素获取方式
        const getValue = (selector, defaultValue = '') => {
          const element = document.querySelector(selector);
          return element ? element.value : defaultValue;
        };
    
        // 获取用户实际输入的值
        const widthInput = document.querySelector('input[type="number"][aria-label="宽度"]');
        const heightInput = document.querySelector('input[type="number"][aria-label="高度"]');
        const batchSizeInput = document.querySelector('input[type="number"][aria-label="生成数量"]');
        const seedInput = document.querySelector('input[type="number"][aria-label="随机种子"]');
    
        const presetData = {
          ip: getValue('#sd-ip-input'),
          port: getValue('#sd-port-input'),
          width: widthInput ? widthInput.value : '512',
          height: heightInput ? heightInput.value : '512',
          batch_size: batchSizeInput ? batchSizeInput.value : '2',
          seed: seedInput ? seedInput.value : '-1',
          sampler: getValue('select[aria-label="采样方法"]'),
          steps: getValue('#sampling-steps-input', '20'),
          cfg_scale: getValue('#cfg-scale-input', '7.5'),
          model: getValue('#sd-model-select'),
          lora: getValue('#sd-lora-select')
        };
    
        // 检查必填项
        if (!presetData.ip || !presetData.port) {
          alert('请先填写IP地址和端口');
          return;
        }
    
        // 在保存预设的代码中添加调试日志
        console.log('保存预设数据:', presetData);
    
        fetch('/api/sd/save-preset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(presetData)
        })
        .then(response => {
          console.log('服务器响应:', response);
          return response.json();
        })
        .then(result => {
          console.log('保存结果:', result);
          if (result.status === 'success') {
            alert('预设保存成功');
          } else {
            throw new Error(result.message || '保存失败');
          }
        })
        .catch(error => {
          console.error('保存预设时出错:', error);
          alert('保存失败: ' + error.message);
        });
      });
    }

    // 在initSDConfig函数中添加加载预设的逻辑
    const loadPreset = () => {
        fetch('/api/sd/load-preset')
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data) {
            const preset = result.data;
            // 填充表单
            document.getElementById('sd-ip-input').value = preset.ip || '';
            document.getElementById('sd-port-input').value = preset.port || '';
            // ... 其他字段的填充
            }
        })
        .catch(error => {
            console.error('加载预设时出错:', error);
        });
    };
        // 在DOM加载完成后调用
    document.addEventListener('DOMContentLoaded', function() {
        initSDConfig();
        loadPreset();
    });




}


















function updateSamplerDropdown(samplers) {
  const samplerSelect = document.querySelector('select[aria-label="采样方法"]');
  if (samplerSelect) {
    // 清空现有选项
    samplerSelect.innerHTML = '';
    
    // 添加新选项
    samplers.forEach(sampler => {
      const option = document.createElement('option');
      option.value = sampler;
      option.textContent = sampler;
      samplerSelect.appendChild(option);
    });
  }
}

function updateModelDropdown(models) {
  const modelSelect = document.getElementById('sd-model-select');
  if (modelSelect) {
    // 清空现有选项
    modelSelect.innerHTML = '';
    
    // 添加新选项
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }
}





