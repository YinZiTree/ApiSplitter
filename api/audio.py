# api\audio.py
from flask import Blueprint, request, jsonify, send_from_directory, abort
import logging
import time
from datetime import datetime
import os
import json
import requests
from gradio_client import Client
import shutil

audio_bp = Blueprint('audio', __name__)


@audio_bp.route('/tts/connect', methods=['POST'])
def connect_tts_server():
    """连接到F5TTS服务器"""
    try:
        data = request.get_json()
        
        if not data or 'ip' not in data or 'port' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400
        
        ip = data['ip']
        port = data['port']
        url = f"http://{ip}:{port}/"
        
        try:
            # 使用Gradio Client检查连接
            client = Client(url)
            logging.info(f"[DEBUG] 成功连接到Gradio服务器: {url}")
            
            # 保存服务器信息到JSON文件
            server_info = {
                "ip": ip,
                "port": port,
                "connect_time": datetime.now().isoformat(),
                "status": "connected"
            }
            
            os.makedirs('outputs/json', exist_ok=True)
            with open('outputs/json/f5tts_server.json', 'w', encoding='utf-8') as f:
                json.dump(server_info, f, ensure_ascii=False, indent=2)
            
            return jsonify({
                "status": "success", 
                "message": "成功连接到F5TTS服务器",
                "data": server_info
            })
            
        except Exception as e:
            logging.error(f"[ERROR] 连接Gradio服务器失败: {str(e)}")
            return jsonify({
                "status": "error", 
                "message": f"连接到F5TTS服务器失败: {str(e)}"
            }), 400
    
    except Exception as e:
        logging.exception("连接F5TTS服务器时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@audio_bp.route('/tts/get_voices', methods=['GET'])
def get_voices_list():
    """获取音色模型列表"""
    try:
        # 读取保存的服务器信息
        if not os.path.exists('outputs/json/f5tts_server.json'):
            logging.warning("[WARN] 未找到服务器连接信息")
            return jsonify({"status": "error", "message": "请先连接服务器"}), 400
            
        with open('outputs/json/f5tts_server.json', 'r', encoding='utf-8') as f:
            server_info = json.load(f)
            
        url = f"http://{server_info['ip']}:{server_info['port']}/"
        
        try:
            # 连接Gradio服务器
            client = Client(url)
            logging.info(f"[DEBUG] 正在从Gradio服务器获取音色模型列表: {url}")
            
            # 调用API获取音色模型
            result = client.predict(api_name="/update_voices")
            logging.debug(f"[DEBUG] 获取到的音色模型数据: {json.dumps(result, ensure_ascii=False)}")
            
            # 处理返回结果
            if not result or "__type__" not in result or result["__type__"] != "update":
                logging.error("[ERROR] 获取音色模型失败: 返回数据格式不正确")
                return jsonify({"status": "error", "message": "获取音色模型失败"}), 400
                
            # 提取音色模型列表
            voices = []
            if "choices" in result and len(result["choices"]) > 0:
                for voice in result["choices"]:
                    if len(voice) > 0:
                        voices.append(voice[0])
            
            logging.info(f"[INFO] 成功获取音色模型列表，共 {len(voices)} 个模型")
            return jsonify({
                "status": "success",
                "message": "成功获取音色模型列表",
                "data": {
                    "voices": voices
                }
            })
            
        except Exception as e:
            logging.error(f"[ERROR] 获取音色模型失败: {str(e)}")
            return jsonify({
                "status": "error", 
                "message": f"获取音色模型失败: {str(e)}"
            }), 400
    
    except Exception as e:
        logging.exception("[ERROR] 获取音色模型时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@audio_bp.route('/audio/save_preset', methods=['POST'])
def save_preset():
    try:
        data = request.get_json()
        
        # 确保outputs/audio目录存在
        os.makedirs('outputs/audio', exist_ok=True)
        
        # 保存或更新预设文件
        preset_path = 'outputs/audio/preset.json'
        if os.path.exists(preset_path):
            # 如果文件存在，更新内容
            with open(preset_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            existing_data.update(data)
            data = existing_data
        
        with open(preset_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({
            "status": "success",
            "message": "预设保存成功"
        })
        
    except Exception as e:
        logging.exception("保存预设时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@audio_bp.route('/audio/generate', methods=['POST'])
def generate_audio():
    """生成音频"""
    try:
        data = request.get_json()
        if not data or not data.get('text'):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 读取音频预设配置
        with open('outputs/audio/preset.json', 'r', encoding='utf-8') as f:
            preset_config = json.load(f)

        # 获取保存路径，确保路径存在
        save_path = data.get('save_path')
        if not save_path:
            return jsonify({"status": "error", "message": "缺少保存路径参数"}), 400
        
        os.makedirs(save_path, exist_ok=True)
        logging.info(f"[DEBUG] 音频保存路径: {save_path}")

        # 构建F5TTS请求参数
        client = Client(f"http://{preset_config['ip']}:{preset_config['port']}/")
        
        # 生成音频
        result = client.predict(
            ref_audio_input=None,
            ref_text_input="",
            gen_text_input=data['text'],
            remove_silence=False,
            cross_fade_duration_slider=0.15,
            nfe_slider=data.get('nfe_step', '32'),
            speed_slider=data.get('speed', 0.95),
            refine_text=data.get('refine_text', '开启'),
            seed="-1",
            voice=data.get('voice_model', preset_config['voiceModel']),
            api_name="/basic_tts"
        )

        # 打印F5TTS返回的原始数据
        logging.info(f"[INFO] F5TTS返回的原始数据: {json.dumps(result, indent=2, ensure_ascii=False)}")

        # 获取临时音频文件路径
        temp_audio_path = result[0]
        if not os.path.exists(temp_audio_path):
            return jsonify({"status": "error", "message": "音频文件生成失败"}), 500

        # 获取音频时长并转换为毫秒
        import wave
        with wave.open(temp_audio_path, 'r') as f:
            frames = f.getnframes()
            rate = f.getframerate()
            duration = int((frames / float(rate)) * 1000)  # 转换为毫秒
            logging.info(f"[INFO] 音频时长: {duration}毫秒")

        # 生成最终保存路径，并统一使用正斜杠
        timestamp = int(time.time())
        output_filename = f"audio_{timestamp}.wav"
        output_path = os.path.join(save_path, output_filename).replace("\\", "/")  # 统一路径格式
        logging.info(f"[DEBUG] 统一后的音频保存路径: {output_path}")

        # 将临时文件复制到项目路径
        shutil.copy(temp_audio_path, output_path)
        logging.info(f"[INFO] 成功将音频文件保存到: {output_path}")

        # 返回保存后的路径和时长
        return jsonify({
            "status": "success",
            "data": {
                "path": output_path,
                "duration": duration  # 返回毫秒数
            }
        })

    except Exception as e:
        logging.exception("生成音频时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@audio_bp.route('/audio/batch_generate', methods=['POST'])
def batch_generate_audio():
    """批量生成音频"""
    try:
        data = request.get_json()
        if not data or not data.get('texts'):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        # 读取音频预设配置
        with open('outputs/audio/preset.json', 'r', encoding='utf-8') as f:
            preset_config = json.load(f)

        # 获取保存路径，确保路径存在
        save_path = data.get('save_path')
        if not save_path:
            return jsonify({"status": "error", "message": "缺少保存路径参数"}), 400
        
        os.makedirs(save_path, exist_ok=True)
        logging.info(f"[DEBUG] 音频保存路径: {save_path}")

        # 构建F5TTS请求参数
        client = Client(f"http://{preset_config['ip']}:{preset_config['port']}/")

        # 依次生成音频
        results = []
        for i, text in enumerate(data['texts']):
            if not text:
                logging.warning(f"[WARNING] 第 {i + 1} 个文本为空，跳过")
                continue

            # 生成音频
            result = client.predict(
                ref_audio_input=None,
                ref_text_input="",
                gen_text_input=text,
                remove_silence=False,
                cross_fade_duration_slider=0.15,
                nfe_slider=data.get('nfe_step', '32'),
                speed_slider=data.get('speed', 0.95),
                refine_text=data.get('refine_text', '开启'),
                seed="-1",
                voice=data.get('voice_model', preset_config['voiceModel']),
                api_name="/basic_tts"
            )

            # 获取临时音频文件路径
            temp_audio_path = result[0]
            if not os.path.exists(temp_audio_path):
                logging.error(f"[ERROR] 第 {i + 1} 个音频文件生成失败")
                continue

            # 生成最终保存路径，并统一使用正斜杠
            timestamp = int(time.time())
            output_filename = f"audio_{timestamp}_{i}.wav"
            output_path = os.path.join(save_path, output_filename).replace("\\", "/")
            logging.info(f"[DEBUG] 统一后的音频保存路径: {output_path}")

            # 将临时文件复制到项目路径
            shutil.copy(temp_audio_path, output_path)
            logging.info(f"[INFO] 成功将第 {i + 1} 个音频文件保存到: {output_path}")

            results.append(output_path)

        return jsonify({
            "status": "success",
            "data": results  # 返回所有保存后的路径
        })

    except Exception as e:
        logging.exception("批量生成音频时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@audio_bp.route('/audio/preset', methods=['GET'])
def get_audio_preset():
    """获取音频预设配置"""
    try:
        # 确保预设文件存在
        preset_path = 'outputs/audio/preset.json'
        if not os.path.exists(preset_path):
            # 如果文件不存在，创建默认配置
            default_preset = {
                "ip": "127.0.0.1",
                "port": "7860",
                "voiceModel": "太乙真人.pt",
                "nfeStep": "32",
                "speed": 0.95,
                "refine_text": "开启"
            }
            os.makedirs('outputs/audio', exist_ok=True)
            with open(preset_path, 'w', encoding='utf-8') as f:
                json.dump(default_preset, f, ensure_ascii=False, indent=2)
        
        # 读取预设文件
        with open(preset_path, 'r', encoding='utf-8') as f:
            preset_data = json.load(f)
        
        return jsonify({
            "status": "success",
            "data": preset_data
        })
        
    except Exception as e:
        logging.exception("获取音频预设配置时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@audio_bp.route('/audio/file/<path:filename>', methods=['GET'])
def get_audio_file(filename):
    """获取音频文件"""
    try:
        # 从路径中提取目录部分
        directory = os.path.dirname(filename)
        file_name = os.path.basename(filename)
        
        # 确保目录存在
        full_directory = os.path.join('outputs', directory)
        if not os.path.exists(full_directory):
            logging.error(f"[ERROR] 音频目录不存在: {full_directory}")
            return jsonify({"status": "error", "message": "音频目录不存在"}), 404
        
        # 检查文件是否存在
        full_path = os.path.join(full_directory, file_name)
        if not os.path.exists(full_path):
            logging.error(f"[ERROR] 音频文件不存在: {full_path}")
            return jsonify({"status": "error", "message": "音频文件不存在"}), 404
        
        # 返回音频文件
        return send_from_directory(full_directory, file_name)
        
    except Exception as e:
        logging.exception("获取音频文件时出错")
        return jsonify({"status": "error", "message": str(e)}), 500


@audio_bp.route('/audio/delete', methods=['POST'])
def delete_audio_file():
    """删除音频文件"""
    try:
        data = request.get_json()
        if not data or not data.get('path'):
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400
        
        # 获取音频文件路径
        audio_path = data.get('path')
        
        # 检查文件是否存在
        if not os.path.exists(audio_path):
            logging.warning(f"[WARNING] 要删除的音频文件不存在: {audio_path}")
            return jsonify({"status": "error", "message": "音频文件不存在"}), 404
        
        # 删除文件
        os.remove(audio_path)
        logging.info(f"[INFO] 成功删除音频文件: {audio_path}")
        
        # 如果需要，更新分镜项的audio_info字段
        if data.get('storyboard_path') and data.get('index') is not None:
            storyboard_path = data.get('storyboard_path')
            index = int(data['index'])  # 确保索引是整数类型
            
            # 读取分镜数据
            with open(storyboard_path, 'r', encoding='utf-8') as f:
                storyboard_data = json.load(f)
            
            # 更新分镜项的audio_info字段
            if 'data' in storyboard_data and isinstance(storyboard_data['data'], dict):
                # 处理旧版数据结构
                if 0 <= index < len(storyboard_data['data']['data']):
                    storyboard_data['data']['data'][index]['audio_info'] = {}
            else:
                # 处理新版数据结构
                if 0 <= index < len(storyboard_data['data']):
                    storyboard_data['data'][index]['audio_info'] = {}
                
            # 保存更新后的数据
            with open(storyboard_path, 'w', encoding='utf-8') as f:
                json.dump(storyboard_data, f, ensure_ascii=False, indent=2)
            
            logging.info(f"[INFO] 成功更新分镜项的音频信息")
        
        return jsonify({
            "status": "success",
            "message": "成功删除音频文件"
        })
        
    except Exception as e:
        logging.exception("删除音频文件时出错")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
