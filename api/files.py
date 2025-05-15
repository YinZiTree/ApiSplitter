from flask import Blueprint, request, jsonify, send_from_directory, current_app, abort
import logging
import os
import re
from werkzeug.utils import secure_filename
from datetime import datetime
import json

files_bp = Blueprint('files', __name__)

def allowed_file(filename):
    """检查文件扩展名是否符合要求"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def sanitize_project_name(project_name):
    """去掉项目名称中的特殊字符，直接忽略掉"""
    # 使用正则表达式去掉非字母、数字、下划线和中文的字符
    sanitized_name = re.sub(r'[^\w\u4e00-\u9fff]', '', project_name)
    return sanitized_name

@files_bp.route('/upload', methods=['POST'])
def upload_file():
    """文件上传接口"""
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "没有文件部分"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "未选择文件"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            return jsonify({
                "status": "success", 
                "data": {
                    "filename": filename,
                    "path": file_path,
                    "url": f"/uploads/{filename}",
                    "size": os.path.getsize(file_path),
                    "uploaded_at": datetime.now().isoformat()
                }
            })
        else:
            return jsonify({"status": "error", "message": "不允许的文件类型"}), 400
    except Exception as e:
        logging.exception("上传文件时出错")
        return jsonify({"status": "error", "message": str(e)}), 500



