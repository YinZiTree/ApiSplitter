from flask import Blueprint, request, jsonify
import logging
import os
import json
import time
from datetime import datetime

tomp4_bp = Blueprint('tomp4', __name__)

@tomp4_bp.route('/tomp4/list', methods=['POST'])
def list_videos():
    """获取指定目录下的视频文件列表"""
    try:
        data = request.get_json()
        if not data or 'directory' not in data:
            return jsonify({
                "status": "error",
                "message": "缺少必要参数"
            }), 400
        
        # 直接使用原始路径，不进行特殊字符替换
        directory = os.path.normpath(data['directory'])
        logging.info(f"[TOMP4] 获取视频列表: {directory}")
        
        # 确保目录存在
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            logging.info(f"[TOMP4] 创建视频目录: {directory}")
            
        # 获取目录下的所有文件
        video_files = []
        if os.path.exists(directory):
            for file in os.listdir(directory):
                if file.lower().endswith('.mp4'):
                    file_path = os.path.join(directory, file)
                    mod_time = os.path.getmtime(file_path)
                    video_files.append({
                        "path": file_path,
                        "name": file,
                        "modified": mod_time
                    })
        
        # 按修改时间排序，最新的在前面
        video_files.sort(key=lambda x: x["modified"], reverse=True)
        
        # 返回完整的视频路径
        video_paths = [f"/api/projects/{video['path'].replace('\\', '/')}" for video in video_files]
        
        return jsonify({
            "status": "success",
            "data": {
                "videos": video_paths,
                "count": len(video_paths)
            }
        })
        
    except Exception as e:
        logging.exception("[TOMP4] 获取视频列表时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@tomp4_bp.route('/tomp4/info', methods=['POST'])
def get_video_info():
    """获取视频文件信息"""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({
                "status": "error",
                "message": "缺少必要参数"
            }), 400
        
        video_path = os.path.normpath(data['path'])
        logging.info(f"[TOMP4] 获取视频信息: {video_path}")
        
        # 检查文件是否存在
        if not os.path.exists(video_path):
            return jsonify({
                "status": "error",
                "message": "视频文件不存在"
            }), 404
            
        # 获取文件信息
        file_stats = os.stat(video_path)
        file_size = file_stats.st_size
        modified_time = datetime.fromtimestamp(file_stats.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        
        # 获取文件名
        file_name = os.path.basename(video_path)
        
        return jsonify({
            "status": "success",
            "data": {
                "path": video_path,
                "name": file_name,
                "size": file_size,
                "modified": modified_time
            }
        })
        
    except Exception as e:
        logging.exception("[TOMP4] 获取视频信息时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@tomp4_bp.route('/tomp4/delete', methods=['POST'])
def delete_video():
    """删除视频文件"""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({
                "status": "error",
                "message": "缺少必要参数"
            }), 400
        
        video_path = os.path.normpath(data['path'])
        logging.info(f"[TOMP4] 删除视频: {video_path}")
        
        # 检查文件是否存在
        if not os.path.exists(video_path):
            return jsonify({
                "status": "error",
                "message": "视频文件不存在"
            }), 404
            
        # 删除文件
        os.remove(video_path)
        
        return jsonify({
            "status": "success",
            "message": "视频文件已删除"
        })
        
    except Exception as e:
        logging.exception("[TOMP4] 删除视频时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
