@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: Проверка наличия python / Check for python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Команда python не найдена. Пожалуйста, установите Python 3.8 или выше.
    echo Python command not found. Please install Python 3.8 or higher.
    exit /b 1
)

:: Проверка версии Python / Check Python version
for /f "tokens=2" %%i in ('python --version 2^>nul') do set PYTHON_VERSION=%%i
echo Обнаружена версия Python: !PYTHON_VERSION!
echo Detected Python version: !PYTHON_VERSION!

:: Извлекаем мажорную и минорную версии / Extract major and minor versions
for /f "tokens=1,2 delims=." %%a in ("!PYTHON_VERSION!") do (
    set MAJOR=%%a
    set MINOR=%%b
)

:: Проверка, что версия >= 3.8 / Check if version >= 3.8
if !MAJOR! LSS 3 (
    echo Ошибка: Требуется Python 3.8 или выше для работы приложения.
    echo Error: Python 3.8 or higher is required to run the application.
    echo Установите подходящую версию и повторите установку.
    echo Install a suitable version and try again.
    exit /b 1
)
if !MAJOR! EQU 3 if !MINOR! LSS 8 (
    echo Ошибка: Требуется Python 3.8 или выше для работы приложения.
    echo Error: Python 3.8 or higher is required to run the application.
    echo Установите подходящую версию и повторите установку.
    echo Install a suitable version and try again.
    exit /b 1
)

:: Создание виртуального окружения / Create virtual environment
echo Создание виртуального окружения...
echo Creating virtual environment...
python -m venv venv

:: Активация виртуального окружения / Activate virtual environment
call venv\Scripts\activate

:: Установка зависимостей / Install dependencies
echo Установка зависимостей из requirements.txt...
echo Installing dependencies from requirements.txt...
pip install -r requirements.txt

:: Сообщение об успешной установке / Success message
echo Установка завершена! Теперь вы можете запустить приложение с помощью run_app.bat или run_desktop_app.bat
echo Installation completed! You can now run the application using run_app.bat or run_desktop_app.bat

:: Плашка благодарности / Thank you banner
echo ==================================================
echo.
echo      THANKS FOR THE USE - PORNCODE.RU ^^_^ ^^_^ ^^_^
echo.
echo ==================================================

pause
