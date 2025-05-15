from flask import Blueprint, request, jsonify, send_from_directory, abort
import logging
import time
from datetime import datetime
import os
import requests  # 添加这行导入
import json

images_bp = Blueprint('images', __name__)

@images_bp.route('/sd/generate', methods=['POST'])
def generate_image():
    """生成图像接口"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        negative_prompt = data.get('negative_prompt', '')
        width = data.get('width', 768)
        height = data.get('height', 1024)
        
        if not prompt:
            return jsonify({"status": "error", "message": "提示词不能为空"}), 400
        
        # 这里应该调用SD服务生成图像
        # 示例返回 - 实际应用中应返回生成的图像URL或Base64
        response = {
            "image_id": str(int(time.time())),
            "status": "processing",
            "message": "图像生成请求已提交，正在处理中"
        }
        return jsonify({"status": "success", "data": response})
    except Exception as e:
        logging.exception("生成图像时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@images_bp.route('/sd/status/<image_id>', methods=['GET'])
def check_image_status(image_id):
    """检查图像生成状态"""
    try:
        # 这里应该查询图像生成状态
        # 示例返回
        status = {
            "image_id": image_id,
            "status": "completed",
            "url": f"/outputs/images/{image_id}.png",
            "created_at": datetime.now().isoformat()
        }
        return jsonify({"status": "success", "data": status})
    except Exception as e:
        logging.exception(f"检查图像 {image_id} 状态时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@images_bp.route('/sd/presets', methods=['GET'])
def get_sd_presets():
    """获取SD预设列表"""
    try:
        # 示例预设数据
        presets = [
            {
                "id": "cover",
                "name": "小说封面",
                "description": "适合创建小说封面的高质量图像",
                "settings": {
                    "width": 768,
                    "height": 1024,
                    "sampler": "Euler a",
                    "steps": 30,
                    "cfg_scale": 7
                }
            },
            {
                "id": "character",
                "name": "角色肖像",
                "description": "生成小说角色的精细肖像",
                "settings": {
                    "width": 512,
                    "height": 768,
                    "sampler": "DPM++ 2M Karras",
                    "steps": 40,
                    "cfg_scale": 8
                }
            }
        ]
        return jsonify({"status": "success", "data": presets})
    except Exception as e:
        logging.exception("获取SD预设列表时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@images_bp.route('/outputs/images/<filename>')
def get_image(filename):
    """获取生成的图像"""
    try:
        return send_from_directory('outputs/images', filename)
    except Exception as e:
        logging.exception(f"获取图像 {filename} 时出错")
        abort(404)

@images_bp.route('/images/connect', methods=['POST'])
def connect_sd_server():
    """连接SD服务器"""
    try:
        data = request.get_json()
        ip = data.get('ip', '127.0.0.1')
        port = data.get('port', '7861')
        
        # 构造请求URL
        url = f"http://{ip}:{port}"
        
        # 发送HEAD请求检查服务器状态
        response = requests.head(url, headers={'accept': 'text/html'}, timeout=5)
        
        if response.status_code == 200:
            return jsonify({
                "status": "success",
                "message": "服务器连接成功",
                "data": {
                    "ip": ip,
                    "port": port,
                    "status": "connected"
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"服务器返回状态码: {response.status_code}"
            }), 400
            
    except requests.exceptions.ConnectionError:
        return jsonify({
            "status": "error",
            "message": "无法连接到服务器，请检查IP和端口"
        }), 400
    except requests.exceptions.Timeout:
        return jsonify({
            "status": "error", 
            "message": "连接超时，请检查服务器是否启动"
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@images_bp.route('/sd/models', methods=['GET'])
def get_sd_models():
    """获取SD模型"""
    try:
        # 从请求参数中获取IP和端口
        ip = request.args.get('ip', '127.0.0.1')
        port = request.args.get('port', '7861')
        
        # 从SD服务器获取模型
        response = requests.get(f'http://{ip}:{port}/sdapi/v1/sd-models')
        if response.status_code == 200:
            models = response.json()
            return jsonify({
                "status": "success",
                "data": [model["model_name"] for model in models]
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"SD服务器返回状态码: {response.status_code}"
            }), 400
    except Exception as e:
        logging.exception("获取模型时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@images_bp.route('/sd/samplers', methods=['GET'])
def get_sd_samplers():
    """获取SD采样方法"""
    try:
        # 从请求参数中获取IP和端口
        ip = request.args.get('ip', '127.0.0.1')
        port = request.args.get('port', '7861')
        
        # 从SD服务器获取采样方法
        response = requests.get(f'http://{ip}:{port}/sdapi/v1/samplers')
        if response.status_code == 200:
            samplers = response.json()
            return jsonify({
                "status": "success",
                "data": [sampler["name"] for sampler in samplers]
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"SD服务器返回状态码: {response.status_code}"
            }), 400
    except Exception as e:
        logging.exception("获取采样方法时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@images_bp.route('/sd/loras', methods=['GET'])
def get_sd_loras():
    """获取SD LoRA"""
    try:
        # 从请求参数中获取IP和端口
        ip = request.args.get('ip', '127.0.0.1')
        port = request.args.get('port', '7861')
        
        # 从SD服务器获取LoRA
        response = requests.get(f'http://{ip}:{port}/sdapi/v1/loras')
        if response.status_code == 200:
            loras = response.json()
            return jsonify({
                "status": "success",
                "data": [lora["name"] for lora in loras] if loras else []
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"SD服务器返回状态码: {response.status_code}"
            }), 400
    except Exception as e:
        logging.exception("获取LoRA时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@images_bp.route('/sd/save-preset', methods=['POST'])
def save_sd_preset():
    """保存SD预设"""
    try:
        data = request.get_json()
        
        # 检查是否已连接
        ip = data.get('ip')
        port = data.get('port')
        if not ip or not port:
            return jsonify({
                "status": "error",
                "message": "请先连接服务器"
            }), 400
        
        # 创建输出目录
        output_dir = os.path.join(os.getcwd(), 'outputs', 'SD')
        os.makedirs(output_dir, exist_ok=True)
        
        # 调试日志：打印输出目录
        logging.info(f"保存预设到目录: {output_dir}")
        
        # 固定文件名
        filename = 'preset.json'
        filepath = os.path.join(output_dir, filename)
        
        # 调试日志：打印文件路径
        logging.info(f"保存预设到文件: {filepath}")
        
        # 如果文件存在，读取原有内容
        existing_data = {}
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        
        # 合并新旧数据，新数据覆盖旧数据
        merged_data = {**existing_data, **data}
        
        # 调试日志：打印合并后的数据
        logging.info(f"合并后的预设数据: {merged_data}")
        
        # 保存预设
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=2)
        
        # 调试日志：确认文件写入成功
        logging.info("预设保存成功")
        
        return jsonify({
            "status": "success",
            "message": "预设保存成功",
            "data": {
                "filename": filename
            }
        })
    except Exception as e:
        logging.exception("保存预设时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

