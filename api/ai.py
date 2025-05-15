from flask import Blueprint, request, jsonify
import logging
import time
from datetime import datetime
from openai import OpenAI  # 新增引入
import json  # 新增引入
import requests  # 新增引入
import base64  # 新增引入
import os  # 添加os模块用于文件操作



ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ai/creative-assistant', methods=['POST'])
def creative_assistant():
    """AI创意助手接口"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({"status": "error", "message": "提示词不能为空"}), 400
        
        # 这里应该调用AI服务获取创意建议
        # 示例返回
        response = {
            "suggestions": [
                {
                    "type": "plot",
                    "title": "情节建议",
                    "content": "光束可能是防御系统自动激活、当地文明的通讯尝试或能量采集装置。"
                },
                {
                    "type": "character",
                    "title": "角色反应",
                    "content": "扎克可能会立即启动防御护盾、建议撤退到安全距离或尝试分析光束的性质。"
                },
                {
                    "type": "description",
                    "title": "描述优化",
                    "content": "光束穿透太空的寂静，如同一把锋利的剑刺向他们。亚历克斯感到舰桥上的温度似乎瞬间升高，警报声刺痛着每个人的耳膜。"
                }
            ]
        }
        return jsonify({"status": "success", "data": response})
    except Exception as e:
        logging.exception("调用AI创意助手时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/generate-storyboard', methods=['POST'])
def generate_storyboard():
    """生成小说分镜"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('description'):
            return jsonify({"status": "error", "message": "请提供小说描述"}), 400

        # 读取preset_config.json
        with open('outputs/aliyun/preset_config.json', 'r', encoding='utf-8') as f:
            preset_config = json.load(f)

        # 初始化OpenAI客户端
        client = OpenAI(
            api_key=preset_config['apiKey'],
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )

        # 构建请求参数
        messages = [
            {'role': 'system', 'content': preset_config['systemPrompt']},
            {'role': 'user', 'content': data['description']}
        ]

        # 调用阿里云百炼大模型
        completion = client.chat.completions.create(
            model=preset_config['model'],
            messages=messages
        )

        # 解析返回结果
        result = json.loads(completion.model_dump_json())
        
        # 返回格式化结果，移除Markdown代码块标记
        return jsonify({
            "status": "success",
            "data": {
                "choices": [{
                    "message": {
                        "content": result['choices'][0]['message']['content'].replace('\`\`\`json', '').replace('\`\`\`', '').strip()
                    }
                }]
            }
        })
    except Exception as e:
        logging.exception("生成分镜时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/config/preset', methods=['GET'])
def get_preset_config():
    """获取preset_config.json配置"""
    try:
        # 读取preset_config.json
        with open('outputs/aliyun/preset_config.json', 'r', encoding='utf-8') as f:
            preset_config = json.load(f)
        
        return jsonify({
            "status": "success",
            "data": preset_config
        })
    except Exception as e:
        logging.exception("读取preset_config.json时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/sd/config', methods=['GET'])
def get_sd_config():
    """获取Stable Diffusion预设配置"""
    try:
        # 读取preset.json
        with open('outputs/SD/preset.json', 'r', encoding='utf-8') as f:
            preset_config = json.load(f)
        
        return jsonify({
            "status": "success",
            "data": preset_config
        })
    except Exception as e:
        logging.exception("读取SD预设配置时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/sd/txt2img', methods=['POST'])
def txt2img():
    """调用Stable Diffusion生成图片"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('prompt'):
            return jsonify({"status": "error", "message": "请提供prompt"}), 400

        # 读取SD配置
        with open('outputs/SD/preset.json', 'r', encoding='utf-8') as f:
            sd_config = json.load(f)

        # 构建SD API请求参数
        sd_params = {
            "prompt": data['prompt'],
            "width": data.get('width', 512),
            "height": data.get('height', 512),
            "steps": data.get('steps', 20),
            "cfg_scale": data.get('cfg_scale', 7.5),
            "sampler_name": data.get('sampler_name', 'Euler a'),
            "seed": data.get('seed', -1),
            "batch_size": data.get('batch_size', 1),
            "negative_prompt": data.get('negative_prompt', ""),
            "restore_faces": data.get('restore_faces', True)
        }

        # 调用Stable Diffusion API
        sd_url = f"http://{sd_config['ip']}:{sd_config['port']}/sdapi/v1/txt2img"
        response = requests.post(sd_url, json=sd_params)

        if not response.ok:
            return jsonify({"status": "error", "message": "调用Stable Diffusion API失败"}), 500

        result = response.json()
        return jsonify({
            "status": "success",
            "data": {
                "images": result.get('images', [])
            }
        })

    except Exception as e:
        logging.exception("调用Stable Diffusion生成图片时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/storyboard', methods=['PUT'])
def update_storyboard():
    """更新分镜文件"""
    try:
        data = request.get_json()
        if not data or not data.get('data'):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 获取文件路径
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({"status": "error", "message": "缺少文件路径"}), 400

        # 写入更新后的分镜数据
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success"})
    except Exception as e:
        logging.exception("更新分镜文件时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/update-storyboard-item', methods=['POST'])
def update_storyboard_item():
    """更新单个分镜项"""
    try:
        data = request.get_json()
        if not data or 'index' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 获取文件路径
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({"status": "error", "message": "缺少文件路径"}), 400

        # 读取现有分镜数据
        with open(file_path, 'r', encoding='utf-8') as f:
            storyboard_data = json.load(f)

        # 更新指定分镜项
        index = data['index']
        if 0 <= index < len(storyboard_data['data']):
            # 只更新有变化的字段
            storyboard_data['data'][index] = {
                'text': data.get('text', storyboard_data['data'][index]['text']),
                'content': data.get('content', storyboard_data['data'][index]['content']),
                'prompt': data.get('prompt', storyboard_data['data'][index]['prompt'])
            }

            # 保存更新后的数据
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(storyboard_data, f, ensure_ascii=False, indent=2)

            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "error", "message": "无效的分镜索引"}), 400

    except Exception as e:
        logging.exception("更新分镜项时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/update-storyboard-item-image', methods=['POST'])
def update_storyboard_item_image():
    """更新分镜项的图片路径"""
    try:
        data = request.get_json()
        if not data or 'index' not in data or 'image_path' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 获取文件路径
        file_path = data.get('path')
        if not file_path:
            return jsonify({"status": "error", "message": "缺少文件路径"}), 400

        # 读取现有分镜数据
        with open(file_path, 'r', encoding='utf-8') as f:
            storyboard_data = json.load(f)

        # 更新指定分镜项的image_paths
        index = data['index']
        if 0 <= index < len(storyboard_data['data']):
            # 如果不存在image_paths字段，则创建
            if 'image_paths' not in storyboard_data['data'][index]:
                storyboard_data['data'][index]['image_paths'] = []
            
            # 追加新的图片路径
            storyboard_data['data'][index]['image_paths'].append(data['image_path'])

            # 保存更新后的数据
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(storyboard_data, f, ensure_ascii=False, indent=2)

            return jsonify({
                "status": "success",
                "data": storyboard_data['data'][index]  # 返回更新后的分镜项数据
            })
        else:
            return jsonify({"status": "error", "message": "无效的分镜索引"}), 400

    except Exception as e:
        logging.exception("更新分镜项图片路径时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/delete-storyboard-item-image', methods=['POST'])
def delete_storyboard_item_image():
    """删除分镜项的图片路径"""
    try:
        data = request.get_json()
        if not data or 'index' not in data or 'image_path' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 获取文件路径
        file_path = data.get('path')
        if not file_path:
            return jsonify({"status": "error", "message": "缺少文件路径"}), 400

        # 读取现有分镜数据
        with open(file_path, 'r', encoding='utf-8') as f:
            storyboard_data = json.load(f)

        # 更新指定分镜项的image_paths
        index = data['index']
        if 0 <= index < len(storyboard_data['data']):
            # 如果不存在image_paths字段，则返回错误
            if 'image_paths' not in storyboard_data['data'][index]:
                return jsonify({"status": "error", "message": "该分镜项没有图片"}), 400
            
            # 查找并删除图片路径
            image_path = data['image_path']
            image_paths = storyboard_data['data'][index]['image_paths']
            
            # 记录原始长度
            original_length = len(image_paths)
            
            # 尝试精确匹配
            if image_path in image_paths:
                image_paths.remove(image_path)
            else:
                # 尝试部分匹配（处理URL编码等问题）
                image_filename = os.path.basename(image_path)
                for path in image_paths[:]:  # 使用副本进行迭代
                    if os.path.basename(path) == image_filename:
                        image_paths.remove(path)
                        break
            
            # 检查是否删除成功
            if len(image_paths) == original_length:
                logging.warning(f"未找到要删除的图片路径: {image_path}")
                logging.warning(f"现有图片路径: {image_paths}")
                return jsonify({"status": "error", "message": "未找到要删除的图片路径"}), 400
            
            # 保存更新后的数据
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(storyboard_data, f, ensure_ascii=False, indent=2)

            # 尝试删除实际图片文件（可选）
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
                    logging.info(f"成功删除图片文件: {image_path}")
            except Exception as e:
                logging.warning(f"删除图片文件失败: {e}")
                # 不影响主流程，继续执行

            return jsonify({
                "status": "success",
                "data": storyboard_data['data'][index]  # 返回更新后的分镜项数据
            })
        else:
            return jsonify({"status": "error", "message": "无效的分镜索引"}), 400

    except Exception as e:
        logging.exception("删除分镜项图片路径时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/update-storyboard-item-audio', methods=['POST'])
def update_storyboard_item_audio():
    """更新分镜项的音频信息"""
    try:
        data = request.get_json()
        if not data or 'index' not in data or 'audio_info' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 获取文件路径
        file_path = data.get('path')
        if not file_path:
            return jsonify({"status": "error", "message": "缺少文件路径"}), 400

        # 读取现有分镜数据
        with open(file_path, 'r', encoding='utf-8') as f:
            storyboard_data = json.load(f)

        # 更新指定分镜项的audio_info
        index = data['index']
        if 0 <= index < len(storyboard_data['data']):
            # 如果不存在audio_info字段，则创建
            if 'audio_info' not in storyboard_data['data'][index]:
                storyboard_data['data'][index]['audio_info'] = {}
            
            # 更新音频信息
            storyboard_data['data'][index]['audio_info'] = data['audio_info']

            # 保存更新后的数据
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(storyboard_data, f, ensure_ascii=False, indent=2)

            return jsonify({
                "status": "success",
                "data": storyboard_data['data'][index]  # 返回更新后的分镜项数据
            })
        else:
            return jsonify({"status": "error", "message": "无效的分镜索引"}), 400

    except Exception as e:
        logging.exception("更新分镜项音频信息时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route('/save-image', methods=['POST'])
def save_image():
    """保存生成的图片"""
    try:
        data = request.get_json()
        if not data or not data.get('path') or not data.get('data'):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 解码base64数据
        image_data = base64.b64decode(data['data'])

        # 保存图片文件
        with open(data['path'], 'wb') as f:
            f.write(image_data)

        return jsonify({"status": "success"})

    except Exception as e:
        logging.exception("保存图片时出错")
        return jsonify({"status": "error", "message": str(e)}), 500
