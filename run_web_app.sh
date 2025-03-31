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

# Запуск веб-приложения / Launching web application
echo -e "${GREEN}${BOLD}Запуск веб-приложения...${RESET}"
echo -e "${GREEN}${BOLD}Launching web application...${RESET}"
python3 app.py &

# Сообщение об успешном запуске / Success message
echo -e "${PURPLE}Веб-приложение доступно по адресу: ${BOLD}http://127.0.0.1:5001${RESET}"
echo -e "${PURPLE}Web application is available at: ${BOLD}http://127.0.0.1:5001${RESET}"