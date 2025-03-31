@echo off

:: Проверка наличия виртуального окружения / Check for virtual environment
if not exist "venv" (
    echo Виртуальное окружение не найдено. Сначала выполните install.bat
    echo Virtual environment not found. Please run install.bat first.
    pause
    exit /b 1
)

:: Проверка наличия desktop_app.py / Check for desktop_app.py
if not exist "desktop_app.py" (
    echo Файл desktop_app.py не найден. Убедитесь, что он находится в корневой папке проекта.
    echo File desktop_app.py not found. Ensure it is in the project root directory.
    pause
    exit /b 1
)

:: Активация виртуального окружения / Activate virtual environment
call venv\Scripts\activate

:: Запуск десктопной версии / Run desktop version
echo Запуск десктопной версии приложения...
echo Starting the desktop version of the application...
python desktop_app.py

:: Деактивация окружения / Deactivate environment
deactivate