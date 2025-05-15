from flask import Blueprint, request, jsonify
import logging
import time

chapters_bp = Blueprint('chapters', __name__)

@chapters_bp.route('/projects/<project_id>/chapters', methods=['GET'])
def get_chapters(project_id):
    """获取项目的所有章节"""
    try:
        # 这里应该从数据库获取章节列表
        # 示例数据
        chapters = [
            {"id": "1", "title": "第1章：起航", "wordCount": 2500, "lastUpdated": "3天前"},
            {"id": "2", "title": "第2章：初遇", "wordCount": 3200, "lastUpdated": "2天前"},
            {"id": "3", "title": "第3章：危机", "wordCount": 2800, "lastUpdated": "昨天"},
            {"id": "4", "title": "第4章：解谜", "wordCount": 3100, "lastUpdated": "今天"},
            {"id": "5", "title": "第5章：星际跃迁", "wordCount": 3500, "lastUpdated": "今天"},
            {"id": "6", "title": "第6章：未知星球", "wordCount": 2900, "lastUpdated": "刚刚"}
        ]
        return jsonify({"status": "success", "data": chapters})
    except Exception as e:
        logging.exception(f"获取项目 {project_id} 章节列表时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@chapters_bp.route('/projects/<project_id>/chapters/<chapter_id>', methods=['GET'])
def get_chapter(project_id, chapter_id):
    """获取特定章节的内容"""
    try:
        # 这里应该从数据库获取章节内容
        # 示例数据
        chapter = {
            "id": chapter_id,
            "title": "第6章：未知星球",
            "content": "亚历克斯站在舰桥上，透过巨大的观察窗凝视着眼前这颗蔚蓝色的行星。这是他们在跃迁后发现的第一个类地行星，大气层中含有氧气，表面有大片的海洋和陆地。\n\n\"生命扫描仪显示有活动迹象，舰长。\"莉娜站在控制台前，手指在全息屏幕上快速滑动，\"初步分析显示，这里的生物形态与地球上的有相似之处，但也存在明显差异。\"\n\n亚历克斯点头，思考着下一步行动。",
            "wordCount": 285,
            "lastUpdated": "刚刚"
        }
        return jsonify({"status": "success", "data": chapter})
    except Exception as e:
        logging.exception(f"获取章节 {chapter_id} 内容时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@chapters_bp.route('/projects/<project_id>/chapters', methods=['POST'])
def create_chapter(project_id):
    """创建新章节"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data or not data.get('title'):
            return jsonify({"status": "error", "message": "章节标题不能为空"}), 400
        
        # 这里应该将章节保存到数据库
        # 示例返回
        new_chapter = {
            "id": str(int(time.time())),  # 使用时间戳作为临时ID
            "title": data.get('title'),
            "content": data.get('content', ''),
            "wordCount": len(data.get('content', '').split()),
            "lastUpdated": "刚刚"
        }
        return jsonify({"status": "success", "data": new_chapter}), 201
    except Exception as e:
        logging.exception(f"创建章节时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@chapters_bp.route('/projects/<project_id>/chapters/<chapter_id>', methods=['PUT'])
def update_chapter(project_id, chapter_id):
    """更新章节内容"""
    try:
        data = request.get_json()
        # 验证必要字段
        if not data:
            return jsonify({"status": "error", "message": "请提供更新内容"}), 400
        
        # 这里应该更新数据库中的章节
        # 示例返回
        updated_chapter = {
            "id": chapter_id,
            "title": data.get('title', "未命名章节"),
            "content": data.get('content', ''),
            "wordCount": len(data.get('content', '').split()),
            "lastUpdated": "刚刚"
        }
        return jsonify({"status": "success", "data": updated_chapter})
    except Exception as e:
        logging.exception(f"更新章节 {chapter_id} 时出错")
        return jsonify({"status": "error", "message": str(e)}), 500

@chapters_bp.route('/projects/<project_id>/chapters/<chapter_id>', methods=['DELETE'])
def delete_chapter(project_id, chapter_id):
    """删除章节"""
    try:
        # 这里应该从数据库删除章节
        return jsonify({"status": "success", "message": f"章节 {chapter_id} 已删除"})
    except Exception as e:
        logging.exception(f"删除章节 {chapter_id} 时出错")
        return jsonify({"status": "error", "message": str(e)}), 500
