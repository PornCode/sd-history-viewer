import webview
import threading
import time
import os
import sys
import json
import stat
import tkinter as tk  # Для определения размера экрана
import signal

USE_ADAPTIVE_WINDOW_SIZE = (
    False  # Установите False, чтобы всегда использовать размеры из app_config.json
)


def signal_handler(sig, frame):
    print("\nЗавершение приложения...")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)


# Функция для определения размеров экрана
def get_screen_size():
    try:
        # Используем tkinter для определения размера экрана
        root = tk.Tk()
        root.withdraw()  # Скрываем окно tkinter
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        root.destroy()
        return screen_width, screen_height
    except Exception as e:
        print(f"Ошибка при определении размера экрана: {e}")
        # Возвращаем стандартные значения в случае ошибки
        return 1920, 1080


# Функция для определения оптимального размера окна
def get_window_size():
    # Получаем текущие размеры экрана
    screen_width, screen_height = get_screen_size()

    # Пытаемся загрузить сохраненные размеры из конфигурации
    config_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "app_config.json"
    )

    saved_width = None
    saved_height = None

    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config = json.load(f)
                saved_width = config.get("window_width")
                saved_height = config.get("window_height")
        except Exception as e:
            print(f"Ошибка при чтении конфигурации окна: {e}")

    # Расчет размеров окна (80% от размера экрана, но не более максимальных значений)
    default_width = min(int(screen_width * 0.8), 1600)
    default_height = min(int(screen_height * 0.8), 1130)

    # Используем сохраненные размеры если они не превышают размер экрана
    if saved_width and saved_height:
        if USE_ADAPTIVE_WINDOW_SIZE and (
            saved_width > screen_width or saved_height > screen_height
        ):
            print(
                f"Сохраненные размеры ({saved_width}x{saved_height}) превышают размер экрана, используем 80% от размера экрана"
            )
            width = default_width
            height = default_height
        else:
            # Если адаптивный размер выключен, просто используем сохраненные размеры
            # или если они не превышают размер экрана
            width = saved_width
            height = saved_height
    else:
        width = default_width
        height = default_height

    return width, height


# Функция для сохранения размеров окна при его изменении
def save_window_size(window):
    def on_resize(width, height):
        try:
            config_file = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "app_config.json"
            )
            config = {}

            if os.path.exists(config_file):
                with open(config_file, "r") as f:
                    config = json.load(f)

            # Сохраняем новые размеры
            config["window_width"] = width
            config["window_height"] = height

            with open(config_file, "w") as f:
                json.dump(config, f)

        except Exception as e:
            print(f"Ошибка при сохранении размеров окна: {e}")

    # Привязываем обработчик к событию изменения размера окна
    window.events.resized += on_resize


# Импортируем Flask-приложение
from app import app

# Путь к конфигурационному файлу
CONFIG_FILE = "app_config.json"
# Проверим путь к файлу конфигурации
CONFIG_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "app_config.json"
)
print(f"Config file path: {CONFIG_FILE}")

# Проверка прав доступа
try:
    print(f"Checking access rights for: {CONFIG_FILE}")
    config_dir = os.path.dirname(CONFIG_FILE)
    print(f"Config directory: {config_dir}")

    # Проверяем права на запись в директорию
    write_access = os.access(config_dir, os.W_OK)
    print(f"Write access to directory: {write_access}")

    # Проверяем права на файл, если он существует
    if os.path.exists(CONFIG_FILE):
        file_access = os.access(CONFIG_FILE, os.W_OK)
        print(f"Config file exists, write access: {file_access}")
except Exception as e:
    print(f"Error checking file permissions: {e}")


class AppConfig:
    def __init__(self):
        self.config = {
            "root_directories": {},  # Словарь с названиями и путями директорий
            "current_root": "",  # Текущая выбранная корневая директория
            "current_directory": "",  # Текущая выбранная поддиректория
        }
        self.load()

    def load(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    loaded_config = json.load(f)
                    print(f"Loaded config: {loaded_config}")
                    # Убедимся, что мы действительно устанавливаем значения
                    self.config = loaded_config
            except Exception as e:
                print(f"Error loading config: {e}")
        else:
            print(f"Config file not found: {CONFIG_FILE}")

    def save(self):
        try:
            print(f"Attempting to save config to: {CONFIG_FILE}")
            with open(CONFIG_FILE, "w") as f:
                json.dump(self.config, f)
                print(f"Successfully saved config: {self.config}")
        except Exception as e:
            print(f"Error saving config: {e}")
            import traceback

            traceback.print_exc()

    def set(self, key, value):
        """Устанавливает значение в конфигурации и сохраняет её"""
        print(
            f"Setting config value: {key} = {value} (prev: {self.config.get(key, 'NOT_SET')})"
        )

        # Дополнительная обработка путей для root_directory
        if key == "root_directory" and isinstance(value, str):
            # Удаляем лишние кавычки, если они есть
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
                print(f"Removed quotes: {value}")

            # Удаляем лишние символы, которые могли быть случайно добавлены
            if value.endswith("/}"):
                value = value[:-2]
                print(f"Removed trailing /}}: {value}")

            # Добавляем начальный слеш для Unix/macOS путей
            if (
                os.name != "nt"
                and not value.startswith("/")
                and not value.startswith("~")
            ):
                value = "/" + value
                print(f"Added leading slash: {value}")

        self.config[key] = value
        print(f"Updated config to: {self.config}")
        self.save()
        return True


# Создаем экземпляр конфигурации
app_config = AppConfig()


# Класс API для взаимодействия между JS и Python
class Api:

    def add_root_directory(self, name, path):
        """Добавляет новую корневую директорию"""
        print(f"Adding root directory: {name} = {path}")
        if not name or not path:
            return False

        # Получаем текущие корневые директории
        root_dirs = app_config.config.get("root_directories", {})
        # Добавляем или обновляем директорию
        root_dirs[name] = path
        # Сохраняем обновленный список
        app_config.set("root_directories", root_dirs)

        # Если это первая директория, устанавливаем её как текущую
        if not app_config.config.get("current_root") and root_dirs:
            app_config.set("current_root", name)

        return True

    def remove_root_directory(self, name):
        """Удаляет корневую директорию"""
        print(f"Removing root directory: {name}")
        root_dirs = app_config.config.get("root_directories", {})

        if name in root_dirs:
            del root_dirs[name]
            app_config.set("root_directories", root_dirs)

            # Если удалили текущую директорию, выбираем другую, если есть
            if app_config.config.get("current_root") == name:
                if root_dirs:
                    app_config.set("current_root", next(iter(root_dirs)))
                else:
                    app_config.set("current_root", "")
                    app_config.set("current_directory", "")

            return True
        return False

    def set_current_root(self, name):
        """Устанавливает текущую корневую директорию"""
        print(f"Setting current root directory: {name}")
        root_dirs = app_config.config.get("root_directories", {})

        if name in root_dirs:
            app_config.set("current_root", name)
            return True
        return False

    def get_root_directories(self):
        """Возвращает список корневых директорий"""
        return app_config.config.get("root_directories", {})

    def select_folder(self):
        """Открывает диалог выбора папки и возвращает путь"""
        directory = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
        if directory:
            app_config.set("root_directory", directory[0])
            return directory[0]
        return ""

    def get_config(self):
        """Возвращает текущую конфигурацию"""
        return app_config.config

    def set_config(self, key, value):
        """Устанавливает значение в конфигурации"""
        print(f"Setting config: {key} = {value}")
        app_config.set(key, value)
        return True


def start_flask():
    """Запуск Flask в отдельном потоке"""
    # Отключаем вывод Flask в консоль
    import logging

    log = logging.getLogger("werkzeug")
    log.setLevel(logging.ERROR)

    # Проверяем, уже существуют ли маршруты в приложении Flask
    # Это поможет нам избежать повторного добавления маршрутов
    existing_routes = [rule.endpoint for rule in app.url_map.iter_rules()]

    # Добавляем только те маршруты, которых ещё нет
    if "get_config_route" not in existing_routes:

        @app.route("/api/config/get", methods=["GET"])
        def get_config_route():
            from flask import jsonify

            print("Flask API: get_config called")
            return jsonify(app_config.config)

    if "set_config_route" not in existing_routes:

        @app.route("/api/config/set/<key>/<path:value>", methods=["GET"])
        def set_config_route(key, value):
            from flask import jsonify, request
            import urllib.parse

            print(f"Flask API: set_config called with {key}={value}")
            print(f"Request URL: {request.url}")

            # Исправление пути: проверка, нужно ли добавить начальный слеш
            if (
                key == "root_directory"
                and not value.startswith("/")
                and os.path.sep == "/"
            ):
                # Для macOS и Linux путь должен начинаться с /
                value = "/" + value
                print(f"Added leading slash to path: {value}")

            try:
                result = app_config.set(key, value)
                print(f"Config after change: {app_config.config}")
                return jsonify({"success": True})
            except Exception as e:
                import traceback

                print(f"Error in set_config_route: {e}")
                traceback.print_exc()
                return jsonify({"success": False, "error": str(e)}), 500

    # Эти маршруты уже могут быть определены в app.py
    # Мы пропустим их, если они уже существуют

    # Запускаем Flask без отладки и на определенном порту
    app.run(port=5001, debug=False)


if __name__ == "__main__":

    # Вызываем функцию определения размера экрана и выводим результаты
    screen_width, screen_height = get_screen_size()
    print(f"Размер экрана пользователя: {screen_width}x{screen_height}")

    # Вычисляем оптимальные размеры окна
    window_width, window_height = get_window_size()
    print(f"Вычисленные размеры окна: {window_width}x{window_height}")
    print(
        f"Процент от размера экрана: {window_width/screen_width*100:.1f}% ширины, {window_height/screen_height*100:.1f}% высоты"
    )

    # Запускаем Flask в отдельном потоке
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Небольшая задержка чтобы Flask успел запуститься
    time.sleep(1)

    # Создаем окно приложения с API и вычисленными размерами
    window = webview.create_window(
        title="PornCode SD Gallery",
        url="http://localhost:5001",
        width=window_width,
        height=window_height,
        resizable=True,
        min_size=(800, 600),
        js_api=Api(),
    )

    # Устанавливаем обработчик изменения размеров
    save_window_size(window)

    # Добавьте эту строку для проверки API
    print("WebView window created with API instance:", Api.__name__)

    # Запускаем GUI
    webview.start(debug=False)
