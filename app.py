from flask import Flask, send_from_directory, logging
from flask_cors import CORS
import os
import logging
from datetime import datetime
from pathlib import Path

# 创建必要的目录
os.makedirs('log', exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('uploads', exist_ok=True)
os.makedirs('outputs', exist_ok=True)
os.makedirs('outputs/json', exist_ok=True)
os.makedirs('outputs/images', exist_ok=True)
os.makedirs('outputs/audio', exist_ok=True)

# 配置日志系统
log_file_path = os.path.join('log', f"{datetime.now().strftime('%Y-%m-%d')}.log")
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file_path, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__, static_folder='static')
CORS(app)

# 配置常量
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'mp4', 'wav', 'srt'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS

# 导入并注册API蓝图
from api.projects import projects_bp
from api.chapters import chapters_bp
from api.uploads import uploads_bp
from api.ai import ai_bp
from api.images import images_bp
from api.audio import audio_bp
from api.bailian import bailian_bp
from api.files import files_bp
from api.img2video import img2video_bp  # 新增导入
from api.tomp4 import tomp4_bp


app.register_blueprint(projects_bp, url_prefix='/api')
app.register_blueprint(chapters_bp, url_prefix='/api')
app.register_blueprint(uploads_bp, url_prefix='/api')
# 注册蓝图
# 修改ai_bp的注册方式，统一使用/api前缀
app.register_blueprint(ai_bp, url_prefix='/api')
app.register_blueprint(images_bp, url_prefix='/api')
app.register_blueprint(audio_bp, url_prefix='/api')
app.register_blueprint(bailian_bp, url_prefix='/api')
app.register_blueprint(files_bp, url_prefix='/api')
app.register_blueprint(img2video_bp, url_prefix='/api')  # 新增注册

# 在蓝图注册部分修改为
app.register_blueprint(tomp4_bp, url_prefix='/api')


# 辅助函数
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 主页和标签页路由
@app.route('/')
def home():
    logging.info("访问首页 index.html")
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """提供静态文件服务"""
    logging.info(f"请求静态文件: {filename}")
    return send_from_directory('static', filename)

# 标签页路由
@app.route('/novel-directory.html')
def novel_directory():
    logging.info("访问小说项目目录页面")
    return send_from_directory('static', 'novel-directory.html')


@app.route('/api/projects/<path:filename>')
def serve_project_file(filename):
    return send_from_directory('outputs/books', filename)



@app.route('/novel-creation.html')
def novel_creation():
    logging.info("访问小说创作界面")
    return send_from_directory('static', 'novel-creation.html')

@app.route('/sd-config.html')
def sd_config():
    logging.info("访问SD参数配置页面")
    return send_from_directory('static', 'sd-config.html')

@app.route('/f5tts-config.html')
def f5tts_config():
    logging.info("访问F5TTS参数配置页面")
    return send_from_directory('static', 'f5tts-config.html')

@app.route('/bailian-config.html')
def bailian_config():
    logging.info("访问阿里云百炼参数配置页面")
    return send_from_directory('static', 'bailian-config.html')


# 在所有路由注册之后加上：
@app.route('/outputs/<path:filepath>')
def serve_outputs(filepath):
    # 返回 outputs 目录下的所有文件（如视频、图片等）
    return send_from_directory('outputs', filepath)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
