#!/bin/bash

# Цвета для терминала / Terminal colors
GREEN="\033[32m"
BOLD="\033[1m"
PURPLE="\033[35m"
RESET="\033[0m"
BLUE="\033[38;5;39m"

# Активация виртуального окружения / Activate virtual environment
echo -e "${BLUE}Активация виртуального окружения...${RESET}"
echo -e "${BLUE}Activating virtual environment...${RESET}"
source venv/bin/activate

# Запуск десктоп-приложения / Launching desktop application
echo -e "${GREEN}${BOLD}Запуск десктоп-приложения...${RESET}"
echo -e "${GREEN}${BOLD}Launching desktop application...${RESET}"
python3 desktop_app.py

# Сообщение об успешном завершении работы / Success completion message
echo -e "${PURPLE}${BOLD}Работа десктоп-приложения завершена.${RESET}"
echo -e "${PURPLE}${BOLD}Desktop application has been closed.${RESET}"