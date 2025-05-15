from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
import logging
import time
import json
from datetime import datetime

uploads_bp = Blueprint('uploads', __name__)

def allowed_file(filename):
    """检查文件扩展名是否符合要求"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']



@uploads_bp.route('/generate-image', methods=['POST'])
def generate_image():
    """图像生成API"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('prompt'):
            return jsonify({"status": "error", "message": "请提供图像生成提示词"}), 400
        
        # 这里应该调用图像生成服务
        # 示例返回
        result = {
            "id": str(int(time.time())),
            "prompt": data.get('prompt'),
            "imageUrl": "/outputs/images/sample.jpg",
            "generatedAt": "刚刚"
        }
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        logging.exception("图像生成时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@uploads_bp.route('/generate-audio', methods=['POST'])
def generate_audio():
    """音频生成API"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('text'):
            return jsonify({"status": "error", "message": "请提供要转换为语音的文本"}), 400
        
        # 这里应该调用语音合成服务
        # 示例返回
        result = {
            "id": str(int(time.time())),
            "text": data.get('text'),
            "audioUrl": "/outputs/audio/sample.mp3",
            "generatedAt": "刚刚"
        }
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        logging.exception("音频生成时出错")
        return jsonify({"status": "error", "message": str(e)}), 500
