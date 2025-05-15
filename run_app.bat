@echo off
chcp 65001 >nul

:: 延迟1秒
timeout /t 1 >nul

:: 启动Flask应用（后台运行）
start /B python -c "from app import app; app.run(host='0.0.0.0', port=5001, debug=True)"

:: 打开浏览器
start http://localhost:5001

pause