from flask import Blueprint, request, jsonify, send_file
import logging
import time
import os
import json
from datetime import datetime
import shutil
from .files import sanitize_project_name  # 导入处理项目名称的函数

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/projects', methods=['GET'])
def get_projects():
    """获取所有小说项目"""
    try:
        logging.info("开始处理获取项目列表请求")
        
        # 定义项目根目录
        projects_dir = os.path.join('outputs', 'books')
        
        # 获取所有项目目录
        project_folders = [f for f in os.listdir(projects_dir) 
                         if os.path.isdir(os.path.join(projects_dir, f))]
        
        projects = []
        for folder in project_folders:
            # 构建项目文件路径
            project_file = os.path.join(projects_dir, folder, f"{folder}.json")
            
            # 检查项目文件是否存在
            if os.path.exists(project_file):
                # 读取项目文件
                with open(project_file, 'r', encoding='utf-8') as f:
                    project_data = json.load(f)
                    projects.append({
                        "id": project_data.get("id"),
                        "title": project_data.get("title"),
                        "description": project_data.get("description", "无描述") or "无描述",  # 确保描述不为空
                        "wordCount": project_data.get("wordCount", 0),
                        "paragraphCount": project_data.get("paragraphCount", 0),
                        "progress": project_data.get("progress", 0),
                        "lastUpdated": project_data.get("lastUpdated", "未知")
                    })
        
        logging.info(f"成功获取 {len(projects)} 个项目")
        return jsonify({"status": "success", "data": projects})
    except Exception as e:
        logging.exception("获取项目列表时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects', methods=['POST'])
def create_project():
    """创建新的小说项目"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('title'):
            return jsonify({"status": "error", "message": "项目标题不能为空"}), 400
        
        # 处理项目名称，去掉特殊字符
        sanitized_title = sanitize_project_name(data['title'])
        
        # 添加时间戳后缀
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        project_name_with_timestamp = f"{sanitized_title}_{timestamp}"
        
        # 创建项目目录
        project_dir = os.path.join('outputs', 'books', project_name_with_timestamp)
        os.makedirs(project_dir, exist_ok=True)
        
        # 创建子文件夹
        for folder in ['images', 'mp3', 'mp4']:
            os.makedirs(os.path.join(project_dir, folder), exist_ok=True)
        
        # 构建项目数据
        new_project = {
            "id": str(int(time.time())),  # 使用时间戳作为临时ID
            "title": project_name_with_timestamp,
            "description": data.get('description', '无描述'),
            "wordCount": data.get('wordCount', 0),
            "paragraphCount": data.get('paragraphCount', 0),
            "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 保存项目文件
        project_file = os.path.join(project_dir, f"{project_name_with_timestamp}.json")
        with open(project_file, 'w', encoding='utf-8') as f:
            json.dump(new_project, f, ensure_ascii=False, indent=2)
            
        # 创建分镜文件
        storyboard_data = data.get('storyboard', {
            "data": [{
                "text": data.get('description', '无描述')[:100],
                "content": "默认内容描述",
                "prompt": "Default prompt for image generation",
                "image_paths": [],
                "audio_info": {
                    "path": "",
                    "duration": "0分0秒",
                    "size": "0 MB"
                }
            }]
        })
        
        storyboard_file = os.path.join(project_dir, "storyboard.json")
        with open(storyboard_file, 'w', encoding='utf-8') as f:
            json.dump(storyboard_data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"status": "success", "data": new_project}), 201
    except Exception as e:
        logging.exception("创建项目时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """获取特定项目的详细信息"""
    try:
        logging.info(f"开始获取项目 {project_id} 的详细信息")
        
        # 构建项目文件路径
        project_dir = os.path.join('outputs', 'books')
        project_file = os.path.join(project_dir, f"{project_id}.json")
        
        # 检查文件是否存在
        if not os.path.exists(project_file):
            logging.warning(f"项目文件 {project_file} 不存在")
            return jsonify({"status": "error", "message": "项目不存在"}), 404
        
        # 读取项目文件
        with open(project_file, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
        
        logging.info(f"成功获取项目 {project_id} 的详细信息: {project_data}")
        return jsonify({"status": "success", "data": project_data})
    except Exception as e:
        logging.exception(f"获取项目 {project_id} 详情时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目信息"""
    try:
        data = request.get_json()
        # 这里应该更新数据库中的项目
        # 示例返回
        updated_project = {
            "id": project_id,
            "title": data.get('title', "未命名项目"),
            "genre": data.get('genre', "未分类"),
            "progress": data.get('progress', 0),
            "lastUpdated": "刚刚"
        }
        return jsonify({"status": "success", "data": updated_project})
    except Exception as e:
        logging.exception(f"更新项目 {project_id} 时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    """删除项目"""
    try:
        # 构建项目路径
        project_dir = os.path.join('outputs', 'books', project_id)
        
        # 检查项目是否存在
        if not os.path.exists(project_dir):
            return jsonify({"status": "error", "message": "项目不存在"}), 404
            
        # 删除项目文件夹及其内容
        shutil.rmtree(project_dir)
        
        return jsonify({"status": "success", "message": f"项目 {project_id} 已删除"})
    except Exception as e:
        logging.exception(f"删除项目 {project_id} 时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects/<project_id>/paths', methods=['GET'])
def get_project_paths(project_id):
    """获取项目文件路径"""
    try:
        logging.info(f"开始获取项目 {project_id} 的文件路径")
        
        # 构建项目目录路径
        project_dir = os.path.abspath(os.path.join('outputs', 'books'))
        
        # 获取所有项目目录
        project_folders = [f for f in os.listdir(project_dir) 
                          if os.path.isdir(os.path.join(project_dir, f))]
        
        # 查找与project_id匹配的文件夹
        target_folder = None
        for folder in project_folders:
            # 获取项目文件路径
            project_file = os.path.join(project_dir, folder, f"{folder}.json")
            
            if os.path.exists(project_file):
                # 读取项目文件
                with open(project_file, 'r', encoding='utf-8') as f:
                    project_data = json.load(f)
                    # 检查项目ID是否匹配
                    if project_data.get("id") == project_id:
                        target_folder = folder
                        break
        
        if not target_folder:
            logging.warning(f"未找到与 {project_id} 匹配的项目文件夹")
            return jsonify({"status": "error", "message": "项目不存在"}), 404
            
        # 构建完整项目路径
        project_path = os.path.abspath(os.path.join(project_dir, target_folder))
        
        # 获取项目文件路径
        project_files = {
            "project_file": os.path.abspath(os.path.join(project_path, f"{target_folder}.json")),
            "storyboard_file": os.path.abspath(os.path.join(project_path, "storyboard.json")),
            "assets_dir": os.path.abspath(os.path.join(project_path, "assets"))
        }
        
        # 检查文件是否存在
        if not os.path.exists(project_files["project_file"]):
            logging.warning(f"项目文件 {project_files['project_file']} 不存在")
            return jsonify({"status": "error", "message": "项目文件不存在"}), 404
        
        logging.info(f"成功获取项目 {project_id} 的文件路径: {project_files}")
        return jsonify({
            "status": "success",
            "data": project_files
        })
    except Exception as e:
        logging.exception(f"获取项目 {project_id} 文件路径时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@projects_bp.route('/projects/<path:file_path>', methods=['GET'])
def get_project_file(file_path):
    """获取项目文件内容"""
    try:
        logging.info(f"开始获取项目文件: {file_path}")
        
        # 构建完整文件路径
        full_path = os.path.join('outputs', 'books', file_path)
        
        # 检查文件是否存在
        if not os.path.exists(full_path):
            logging.warning(f"项目文件 {full_path} 不存在")
            return jsonify({"status": "error", "message": "项目文件不存在"}), 404
        
        # 检查文件类型
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # 如果是图片文件，直接返回图片内容
        if file_ext in ['.png', '.jpg', '.jpeg', '.gif']:
            try:
                return send_file(full_path, mimetype=f'image/{file_ext[1:]}')
            except Exception as e:
                logging.exception(f"发送图片文件 {file_path} 时出错")
                return jsonify({"status": "error", "message": f"发送图片文件失败: {str(e)}"}), 500
        
        # 如果是JSON文件，读取并返回JSON内容
        with open(full_path, 'r', encoding='utf-8') as f:
            file_content = json.load(f)
        
        logging.info(f"成功获取项目文件: {file_path}")
        return jsonify({
            "status": "success",
            "data": file_content
        })
    except Exception as e:
        logging.exception(f"获取项目文件 {file_path} 时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

