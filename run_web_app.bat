@echo off

:: Проверка наличия виртуального окружения / Check for virtual environment
if not exist "venv" (
    echo Виртуальное окружение не найдено. Сначала выполните install.bat
    echo Virtual environment not found. Please run install.bat first.
    pause
    exit /b 1
)

:: Проверка наличия app.py / Check for app.py
if not exist "app.py" (
    echo Файл app.py не найден. Убедитесь, что он находится в корневой папке проекта.
    echo File app.py not found. Ensure it is in the project root directory.
    pause
    exit /b 1
)

:: Активация виртуального окружения / Activate virtual environment
call venv\Scripts\activate

:: Запуск веб-версии / Run web version
echo Запуск веб-версии приложения...
echo Starting the web version of the application...
python app.py

:: Деактивация окружения / Deactivate environment
deactivate