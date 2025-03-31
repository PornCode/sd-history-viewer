#!/bin/bash

# Цвета для терминала / Terminal colors
GREEN="\033[32m"
RED="\033[31m"
BOLD="\033[1m"
PURPLE="\033[35m"
RESET="\033[0m"
BLUE="\033[38;5;39m"

# Проверка наличия python3 / Check for python3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}${BOLD}Команда python3 не найдена.${RESET} Пожалуйста, установите Python 3.8 или выше (например, через brew install python@3.12)."
    echo -e "${RED}${BOLD}Python3 command not found.${RESET} Please install Python 3.8 or higher (e.g., via brew install python@3.12)."
    exit 1
fi

# Проверка версии Python / Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d" " -f2)
echo -e "${GREEN}Обнаружена версия Python:${RESET} $PYTHON_VERSION"
echo -e "${BLUE}Detected Python version:${RESET} $PYTHON_VERSION"

# Извлекаем мажорную и минорную версии / Extract major and minor versions
MAJOR_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f1,2)
MAJOR=$(echo "$MAJOR_MINOR" | cut -d. -f1)
MINOR=$(echo "$MAJOR_MINOR" | cut -d. -f2)

# Проверка, что версия >= 3.8 / Check if version >= 3.8
if [ "$MAJOR" -lt 3 ] || { [ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 8 ]; }; then
    echo -e "${RED}${BOLD}Ошибка: Требуется Python 3.8 или выше для работы приложения.${RESET}"
    echo -e "${RED}${BOLD}Error: Python 3.8 or higher is required to run the application.${RESET}"
    echo -e "Установите подходящую версию (например, brew install python@3.12) и повторите установку."
    echo -e "Install a suitable version (e.g., brew install python@3.12) and try again."
    exit 1
fi

# Создание виртуального окружения / Create virtual environment
echo -e "${GREEN}Создание виртуального окружения...${RESET}"
echo -e "${BLUE}Creating virtual environment...${RESET}"
python3 -m venv venv

# Активация виртуального окружения / Activate virtual environment
source venv/bin/activate

# Установка зависимостей / Install dependencies
echo -e "${GREEN}Установка зависимостей из requirements.txt...${RESET}"
echo -e "${BLUE}Installing dependencies from requirements.txt...${RESET}"
pip install -r requirements.txt

# Сделаем sh-файлы запуска исполняемыми
chmod +x run_web_app.sh run_desktop_app.sh

# Сообщение об успешной установке / Success message
echo -e "${GREEN}${BOLD}Установка завершена!${RESET} Теперь вы можете запустить приложение с помощью ${BOLD}run_web_app.sh${RESET} или ${BOLD}run_desktop_app.sh${RESET}"
echo -e "${BLUE}${BOLD}Installation completed!${RESET} You can now run the application using ${BOLD}run_web_app.sh${RESET} or ${BOLD}run_desktop_app.sh${RESET}"

echo -e "${PURPLE}╔════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}║                                            ║${RESET}"
echo -e "${PURPLE}║  THANKS FOR THE USE - PORNCODE.RU 🤟🤟🤟   ║${RESET}"
echo -e "${PURPLE}║                                            ║${RESET}"
echo -e "${PURPLE}╚════════════════════════════════════════════╝${RESET}"