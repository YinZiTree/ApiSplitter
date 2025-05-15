from flask import Blueprint, request, jsonify
import logging
import os
import json
import time
import subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import shutil
from datetime import datetime
import wave

img2video_bp = Blueprint('img2video', __name__)

@img2video_bp.route('/img2video/config', methods=['GET'])
def get_video_config():
    """获取视频合成预设配置"""
    try:
        # 确保配置目录存在
        os.makedirs('outputs/json', exist_ok=True)
        
        # 检查配置文件是否存在，不存在则创建默认配置
        config_path = 'outputs/json/auto_video.json'
        if not os.path.exists(config_path):
            # 创建默认配置
            default_config = {
                "presets": [
                    {
                        "title": "标准配置",
                        "style": "标准",
                        "config": {
                            "width": 1080,
                            "height": 1920,
                            "background_color": [0, 0, 0],
                            "background_image": None,
                            "scale": 1.0,
                            "transition_type": "淡入淡出",
                            "transition_duration": 1.0,
                            "subtitle_x": 0,
                            "subtitle_y": 300,
                            "subtitle_size": 50,
                            "char_spacing": 5,
                            "line_spacing": 10,
                            "text_color": [255, 255, 255],
                            "font_file": "SimHei.ttf",
                            "fps": 24
                        }
                    },
                    {
                        "title": "悬疑风格",
                        "style": "悬疑",
                        "config": {
                            "width": 1080,
                            "height": 1920,
                            "background_color": [0, 0, 0],
                            "background_image": None,
                            "scale": 1.0,
                            "transition_type": "从下到上",
                            "transition_duration": 1.0,
                            "subtitle_x": 0,
                            "subtitle_y": 300,
                            "subtitle_size": 50,
                            "char_spacing": 5,
                            "line_spacing": 10,
                            "text_color": [255, 255, 255],
                            "font_file": "SimHei.ttf",
                            "fps": 24
                        }
                    },
                    {
                        "title": "言情风格",
                        "style": "言情",
                        "config": {
                            "width": 1080,
                            "height": 1920,
                            "background_color": [255, 192, 203],
                            "background_image": None,
                            "scale": 0.8,
                            "transition_type": "淡入淡出",
                            "transition_duration": 1.0,
                            "subtitle_x": 0,
                            "subtitle_y": 350,
                            "subtitle_size": 40,
                            "char_spacing": 3,
                            "line_spacing": 8,
                            "text_color": [255, 182, 193],
                            "font_file": "SimHei.ttf",
                            "fps": 24
                        }
                    }
                ]
            }
            
            # 保存默认配置
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=4)
        
        # 读取配置文件
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        return jsonify({
            "status": "success",
            "data": config_data
        })
        
    except Exception as e:
        logging.exception("获取视频合成预设配置时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def get_audio_duration(audio_file):
    """获取音频文件的时长（秒）"""
    try:
        with wave.open(audio_file, 'rb') as wf:
            # 获取采样率和帧数
            frame_rate = wf.getframerate()
            n_frames = wf.getnframes()
            # 计算时长（秒）
            duration = n_frames / float(frame_rate)
            return duration
    except Exception as e:
        logging.error(f"[VIDEO] 获取音频时长失败: {e}")
        return 3.0  # 默认3秒

def normalize_path(path):
    """统一路径分隔符为系统默认"""
    return os.path.normpath(path)

@img2video_bp.route('/img2video/generate', methods=['POST'])
def generate_video():
    """生成视频"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400
        
        # 获取必要参数
        storyboard_path = normalize_path(data.get('storyboard_path', ''))
        output_dir = normalize_path(data.get('output_dir', ''))
        preset = data.get('preset')
        
        if not storyboard_path or not output_dir or not preset:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 读取分镜数据
        logging.info(f"[VIDEO] 读取分镜数据: {storyboard_path}")
        with open(storyboard_path, 'r', encoding='utf-8') as f:
            storyboard_data = json.load(f)
        
        # 获取分镜列表
        storyboards = storyboard_data.get('data', [])
        if not storyboards:
            return jsonify({"status": "error", "message": "分镜数据为空"}), 400
        
        logging.info(f"[VIDEO] 找到 {len(storyboards)} 个分镜")
        
        # 创建临时目录
        temp_dir = normalize_path(os.path.join('outputs', 'temp', f'video_{int(time.time())}'))
        os.makedirs(temp_dir, exist_ok=True)
        
        # 获取配置参数
        config = preset.get('config', {})
        width = config.get('width', 1080)
        height = config.get('height', 1920)
        bg_color = tuple(config.get('background_color', [0, 0, 0]))
        scale = config.get('scale', 1.0)
        subtitle_y = config.get('subtitle_y', 300)
        subtitle_size = config.get('subtitle_size', 50)
        text_color = tuple(config.get('text_color', [255, 255, 255]))
        fps = config.get('fps', 24)
        transition_type = config.get('transition_type', '淡入淡出')
        transition_duration = config.get('transition_duration', 1.0)
        char_spacing = config.get('char_spacing', 5)
        line_spacing = config.get('line_spacing', 10)
        
        # 加载字体
        font_file = config.get('font_file', 'SimHei.ttf')
        font_path = normalize_path(os.path.join('outputs', 'ttf', font_file))
        if not os.path.exists(font_path):
            # 尝试查找系统字体
            system_font_paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',  # Linux
                'C:\\Windows\\Fonts\\simhei.ttf',  # Windows
                '/System/Library/Fonts/PingFang.ttc'  # macOS
            ]
            for sys_font in system_font_paths:
                if os.path.exists(sys_font):
                    font_path = sys_font
                    break
            if not font_path or not os.path.exists(font_path):
                logging.warning("[VIDEO] 未找到合适的字体文件，将使用默认字体")
        
        logging.info(f"[VIDEO] 使用字体: {font_path}")
        
        # 收集所有帧和音频文件
        frames = []
        audio_files = []
        frame_durations = []  # 每帧持续时间（秒）
        
        # 处理每个分镜
        for i, storyboard in enumerate(storyboards):
            logging.info(f"[VIDEO] 处理第 {i+1}/{len(storyboards)} 个分镜")
            
            # 获取分镜文本和图片路径
            text = storyboard.get('text', '')
            image_paths = storyboard.get('image_paths', [])
            
            # 获取音频路径
            audio_path = None
            audio_duration = 3.0  # 默认3秒
            if 'audio_info' in storyboard and 'path' in storyboard['audio_info']:
                audio_path = normalize_path(storyboard['audio_info']['path'])
                if os.path.exists(audio_path):
                    # 获取音频时长
                    audio_duration = get_audio_duration(audio_path)
                    logging.info(f"[VIDEO] 音频时长: {audio_duration:.2f}秒")
                    
                    # 复制音频文件到临时目录，避免路径问题
                    temp_audio_file = os.path.join(temp_dir, f'audio_{i:04d}.wav')
                    shutil.copy(audio_path, temp_audio_file)
                    audio_files.append((temp_audio_file, audio_duration))
                    logging.info(f"[VIDEO] 找到音频文件并复制到: {temp_audio_file}")
                else:
                    logging.warning(f"[VIDEO] 音频文件不存在: {audio_path}")
            
            # 设置帧持续时间为音频时长
            frame_durations.append(audio_duration)
            
            if not image_paths:
                logging.warning(f"[VIDEO] 第 {i+1} 个分镜没有图片，跳过")
                continue
            
            # 使用第一张图片
            image_path = normalize_path(image_paths[0])
            
            # 读取图片
            try:
                img = Image.open(image_path)
                logging.info(f"[VIDEO] 成功读取图片: {image_path}")
            except Exception as e:
                logging.error(f"[VIDEO] 读取图片失败: {e}")
                # 创建空白图片
                img = Image.new('RGB', (width, height), bg_color)
            
            # 调整图片大小
            img_width, img_height = img.size
            new_width = int(width * scale)
            new_height = int(img_height * new_width / img_width)
            
            if new_height > height:
                new_height = int(height * scale)
                new_width = int(img_width * new_height / img_height)
            
            img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # 创建背景
            background = Image.new('RGB', (width, height), bg_color)
            
            # 将图片居中放置
            x_offset = (width - new_width) // 2
            y_offset = (height - new_height) // 2
            background.paste(img, (x_offset, y_offset))
            
            # 添加文本
            if text and font_path and os.path.exists(font_path):
                try:
                    draw = ImageDraw.Draw(background)
                    font = ImageFont.truetype(font_path, subtitle_size)
                    
                    # 文本自动换行处理
                    max_text_width = width - 100  # 左右各留50像素边距
                    lines = []
                    current_line = ""
                    words = text
                    
                    # 中文文本按字符分割
                    for char in words:
                        test_line = current_line + char
                        # 使用getbbox获取文本边界框
                        bbox = font.getbbox(test_line)
                        text_width = bbox[2] - bbox[0]
                        
                        if text_width <= max_text_width:
                            current_line = test_line
                        else:
                            lines.append(current_line)
                            current_line = char
                    
                    if current_line:
                        lines.append(current_line)
                    
                    # 计算多行文本的总高度
                    total_text_height = len(lines) * (subtitle_size + line_spacing)
                    
                    # 绘制文本背景（半透明黑色）
                    text_bg_padding = 20
                    text_y = height - subtitle_y - total_text_height // 2
                    draw.rectangle(
                        [(0, text_y - text_bg_padding), 
                         (width, text_y + total_text_height + text_bg_padding)],
                        fill=(0, 0, 0, 180)
                    )
                    
                    # 绘制多行文本
                    for j, line in enumerate(lines):
                        # 使用getbbox获取文本边界框
                        bbox = font.getbbox(line)
                        line_width = bbox[2] - bbox[0]
                        line_x = (width - line_width) // 2
                        line_y = text_y + j * (subtitle_size + line_spacing)
                        draw.text((line_x, line_y), line, fill=text_color, font=font)
                    
                    logging.info(f"[VIDEO] 成功添加文本: {text}")
                except Exception as e:
                    logging.error(f"[VIDEO] 添加文本失败: {e}")
            
            # 保存帧
            frame_path = os.path.join(temp_dir, f'frame_{i:04d}.png')
            background.save(frame_path, format='PNG')
            frames.append(frame_path)
            
            logging.info(f"[VIDEO] 成功生成第 {i+1} 个分镜的帧")
        
        if not frames:
            return jsonify({"status": "error", "message": "没有有效的分镜帧"}), 400
        
        # 生成视频文件名
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        output_filename = f'video_{timestamp}.mp4'
        output_path = os.path.join(output_dir, output_filename)
        
        # 创建帧序列文件
        frames_list_path = os.path.join(temp_dir, 'frames_list.txt')
        with open(frames_list_path, 'w', encoding='utf-8') as f:
            for i, frame_path in enumerate(frames):
                # 计算每帧持续时间（秒）
                duration = frame_durations[i]
                # 将帧路径转换为相对路径
                rel_frame_path = os.path.basename(frame_path)
                # 写入帧信息
                f.write(f"file '{rel_frame_path}'\n")
                f.write(f"duration {duration}\n")
            
            # 最后一帧需要重复一次，因为duration只对非最后一帧有效
            f.write(f"file '{os.path.basename(frames[-1])}'\n")
        
        # 使用FFmpeg直接生成视频（不使用OpenCV）
        logging.info(f"[VIDEO] 开始使用FFmpeg生成视频")
        
        # 切换到临时目录
        current_dir = os.getcwd()
        os.chdir(temp_dir)
        
        # 使用FFmpeg从帧序列生成无声视频
        ffmpeg_video_cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', 'frames_list.txt',
            '-vsync', 'vfr',
            '-pix_fmt', 'yuv420p',
            'temp_video.mp4'
        ]
        
        try:
            subprocess.run(ffmpeg_video_cmd, check=True, capture_output=True)
            logging.info(f"[VIDEO] 成功生成无声视频")
            
            # 如果有音频文件，合并音频和视频
            if audio_files:
                logging.info(f"[VIDEO] 开始合并音频和视频，共 {len(audio_files)} 个音频文件")
                
                # 创建临时音频列表文件
                audio_list_path = 'audio_list.txt'
                with open(audio_list_path, 'w', encoding='utf-8') as f:
                    for audio_file, _ in audio_files:
                        # 使用相对路径，避免路径问题
                        rel_path = os.path.basename(audio_file)
                        f.write(f"file '{rel_path}'\n")
                
                # 合并所有音频文件
                ffmpeg_concat_cmd = [
                    'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
                    '-i', 'audio_list.txt', '-c', 'copy', 'temp_audio.wav'
                ]
                
                subprocess.run(ffmpeg_concat_cmd, check=True, capture_output=True)
                logging.info(f"[VIDEO] 成功合并音频文件")
                
                # 合并音频和视频
                ffmpeg_cmd = [
                    'ffmpeg', '-y',
                    '-i', 'temp_video.mp4',
                    '-i', 'temp_audio.wav',
                    '-c:v', 'copy',
                    '-c:a', 'aac',
                    '-shortest',
                    'output.mp4'
                ]
                
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
                logging.info(f"[VIDEO] 成功合并音频和视频")
                
                # 复制最终视频到输出路径
                os.chdir(current_dir)
                shutil.copy(os.path.join(temp_dir, 'output.mp4'), output_path)
                logging.info(f"[VIDEO] 成功复制最终视频到: {output_path}")
            else:
                # 没有音频文件，直接使用无声视频
                os.chdir(current_dir)
                shutil.copy(os.path.join(temp_dir, 'temp_video.mp4'), output_path)
                logging.info(f"[VIDEO] 没有音频文件，使用无声视频: {output_path}")
                
        except subprocess.CalledProcessError as e:
            logging.error(f"[VIDEO] FFmpeg执行失败: {e.stderr.decode('utf-8', errors='ignore')}")
            os.chdir(current_dir)
            return jsonify({"status": "error", "message": f"FFmpeg执行失败: {e.stderr.decode('utf-8', errors='ignore')}"}), 500
        except Exception as e:
            logging.error(f"[VIDEO] 生成视频时出错: {str(e)}")
            os.chdir(current_dir)
            return jsonify({"status": "error", "message": f"生成视频时出错: {str(e)}"}), 500
        
        # 清理临时文件
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            logging.error(f"[VIDEO] 清理临时文件失败: {e}")
        
        logging.info(f"[VIDEO] 视频合成完成: {output_path}")
        
        return jsonify({
            "status": "success",
            "data": {
                "output_path": output_path
            }
        })
        
    except Exception as e:
        logging.exception("生成视频时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
