from flask import Blueprint, request, jsonify
import logging
import time
from datetime import datetime
import json  # 添加json模块导入

bailian_bp = Blueprint('bailian', __name__)

@bailian_bp.route('/bailian/chat', methods=['POST'])
def bailian_chat():
    """百炼大模型对话接口"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        system_prompt = data.get('system_prompt', '')
        model = data.get('model', 'bailian-13b')
        temperature = data.get('temperature', 0.7)
        
        if not prompt:
            return jsonify({"status": "error", "message": "提示词不能为空"}), 400
        
        # 这里应该调用百炼API获取回复
        # 示例返回
        response = {
            "id": str(int(time.time())),
            "model": model,
            "created_at": datetime.now().isoformat(),
            "content": "以下是关于这颗蓝色行星的生态系统和生命形式的构思：\n\n行星基本特征\n这颗行星的表面被大量液态水覆盖（约75%），但与地球不同的是，它的重力略低（约0.8G），大气层更厚，含有较高比例的氧气（28%）和氮气（68%），以及少量甲烷和二氧化碳。行星自转周期约为30小时，公转周期约为280天。它围绕一颗橙矮星运行，接收的光照波长分布与地球不同，紫外线较少，红外线较多。"
        }
        return jsonify({"status": "success", "data": response})
    except Exception as e:
        logging.exception("调用百炼大模型时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@bailian_bp.route('/bailian/models', methods=['GET'])
def get_bailian_models():
    """获取可用的百炼模型列表"""
    try:
        import os
        from openai import OpenAI

        # 初始化客户端
        client = OpenAI(
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=os.getenv("DASHSCOPE_API_KEY")
        )

        # 获取模型列表
        logging.info("开始从DashScope API获取模型列表")
        models = client.models.list()
        logging.info(f"成功获取到{len(models.data)}个模型")

        # 格式化返回数据
        formatted_models = [
            {
                "id": model.id,
                "name": model.id,  # 直接使用id作为名称
                "description": f"由DashScope提供的{model.id}模型",
                "features": ["动态获取", "实时更新"]
            }
            for model in models.data
        ]

        return jsonify({"status": "success", "data": formatted_models})
    except Exception as e:
        logging.exception("获取百炼模型列表时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@bailian_bp.route('/bailian/save-preset', methods=['POST'])
def save_preset():
    """保存预设配置"""
    try:
        data = request.get_json()
        system_prompt = data.get('systemPrompt', '')
        api_key = data.get('apiKey', '')
        model = data.get('model', '')

        # 验证必要参数
        if not all([system_prompt, api_key, model]):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 确保输出目录存在
        import os
        output_dir = os.path.join(os.getcwd(), 'outputs', 'aliyun')
        os.makedirs(output_dir, exist_ok=True)

        # 始终保存到同一个文件
        output_path = os.path.join(output_dir, 'preset_config.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success", "path": output_path})
    except Exception as e:
        logging.exception("保存预设时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@bailian_bp.route('/bailian/load-preset', methods=['GET'])
def load_preset():
    """加载本地预设配置"""
    try:
        # 确保文件存在
        import os
        preset_path = os.path.join(os.getcwd(), 'outputs', 'aliyun', 'preset_config.json')
        
        if not os.path.exists(preset_path):
            return jsonify({"status": "error", "message": "未找到预设文件"}), 404

        # 读取文件内容
        with open(preset_path, 'r', encoding='utf-8') as f:
            preset_data = json.load(f)

        return jsonify({
            "status": "success",
            "data": {
                "systemPrompt": preset_data.get('systemPrompt', ''),
                "apiKey": preset_data.get('apiKey', ''),
                "model": preset_data.get('model', '')
            }
        })
    except Exception as e:
        logging.exception("加载预设时出错")
        return jsonify({"status": "error", "message": str(e)}), 500