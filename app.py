# app.py
from flask import Flask, render_template, jsonify, request, send_file
import os
import json
import re
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS
import base64
import io
import time
from threading import Thread

# Решаем проблему с сериализацией байтовых строк, которая вызывает ошибку 500
import json
from flask.json.provider import JSONProvider


def make_json_serializable(obj):
    """Преобразует любой объект в JSON-сериализуемый формат"""
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, tuple):
        return [make_json_serializable(item) for item in obj]
    elif hasattr(obj, "numerator") and hasattr(obj, "denominator"):
        # Обработка IFDRational
        if obj.denominator == 0:
            return 0
        if obj.denominator == 1:
            return obj.numerator
        return f"{obj.numerator}/{obj.denominator}"
    elif isinstance(obj, bytes):
        try:
            return obj.decode("utf-8", "replace")
        except:
            return obj.hex()
    else:
        return obj


class CustomJSONProvider(JSONProvider):
    def dumps(self, obj, **kwargs):
        def _fix_bytes(obj):
            if isinstance(obj, bytes):
                return obj.decode("utf-8", errors="replace")
            elif isinstance(obj, dict):
                return {k: _fix_bytes(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [_fix_bytes(item) for item in obj]
            else:
                return obj

        return json.dumps(_fix_bytes(obj), **kwargs)

    def loads(self, s, **kwargs):
        return json.loads(s, **kwargs)


# для поиска
# Константы для индексации
INDEX_FILE = "search_index.json"
SEARCH_INDEX = {}  # Глобальная переменная для хранения индекса в памяти
INDEXING_STATUS = {
    "in_progress": False,
    "progress": 0,
    "total_files": 0,
    "indexed_files": 0,
    "last_message": "",
}


def get_file_metadata(file_path):
    """Извлечение метаданных из изображения"""
    try:
        metadata = get_image_metadata(file_path)
        # Извлекаем только нужные данные для поиска
        search_metadata = {
            "prompt": "",
            "negative_prompt": "",
            "parameters": [],
            "last_modified": os.path.getmtime(file_path),
            "file_size": os.path.getsize(file_path),
        }

        # Если есть метаданные Stable Diffusion
        if "stable_diffusion" in metadata:
            sd_metadata = metadata["stable_diffusion"]

            # Структурированные метаданные
            if "structured" in sd_metadata:
                structured = sd_metadata["structured"]
                search_metadata["prompt"] = structured.get("prompt", "")
                search_metadata["negative_prompt"] = structured.get(
                    "negative_prompt", ""
                )
                search_metadata["parameters"] = structured.get("other_params", [])

            # Сырые параметры как запасной вариант
            elif "raw_parameters" in sd_metadata:
                raw = sd_metadata["raw_parameters"]
                # Простая эвристика для разделения
                if "Negative prompt:" in raw:
                    parts = raw.split("Negative prompt:")
                    search_metadata["prompt"] = parts[0].strip()
                    after_neg = parts[1].strip()

                    # Разделяем негативный промпт и параметры
                    if "Steps:" in after_neg:
                        neg_parts = after_neg.split("Steps:")
                        search_metadata["negative_prompt"] = neg_parts[0].strip()
                        search_metadata["parameters"] = [
                            "Steps:" + neg_parts[1].strip()
                        ]
                    else:
                        search_metadata["negative_prompt"] = after_neg
                else:
                    search_metadata["prompt"] = raw

        # Имя файла тоже индексируем
        search_metadata["filename"] = os.path.basename(file_path)

        return search_metadata
    except Exception as e:
        print(f"Ошибка при индексации {file_path}: {e}")
        return {
            "prompt": "",
            "negative_prompt": "",
            "parameters": [],
            "filename": os.path.basename(file_path),
            "last_modified": os.path.getmtime(file_path),
            "file_size": os.path.getsize(file_path),
            "error": str(e),
        }


def build_index_background(root_directories):
    """Создание индекса метаданных в фоновом режиме"""
    global INDEXING_STATUS

    try:
        INDEXING_STATUS["in_progress"] = True
        INDEXING_STATUS["progress"] = 0
        INDEXING_STATUS["last_message"] = "Сканирование файлов..."

        # Загружаем существующий индекс если есть
        index = {}
        if os.path.exists(INDEX_FILE):
            try:
                with open(INDEX_FILE, "r") as f:
                    index = json.load(f)
            except:
                index = {"version": 1, "last_updated": "", "root_directories": {}}
        else:
            index = {"version": 1, "last_updated": "", "root_directories": {}}

        # Обновляем структуру индекса для текущей версии
        if "version" not in index:
            index["version"] = 1
        if "last_updated" not in index:
            index["last_updated"] = ""
        if "root_directories" not in index:
            index["root_directories"] = {}

        # Собираем список всех файлов изображений
        all_images = []
        for root_name, root_path in root_directories.items():
            if not os.path.isdir(root_path):
                continue

            # Создаем запись для директории, если её нет
            if root_name not in index["root_directories"]:
                index["root_directories"][root_name] = {"path": root_path, "images": {}}

            # Обходим все файлы и директории
            for dirpath, dirnames, filenames in os.walk(root_path):
                for filename in filenames:
                    if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                        full_path = os.path.join(dirpath, filename)
                        rel_path = os.path.relpath(full_path, root_path)
                        all_images.append((root_name, rel_path, full_path))

        INDEXING_STATUS["total_files"] = len(all_images)
        INDEXING_STATUS["indexed_files"] = 0
        INDEXING_STATUS["last_message"] = f"Индексация {len(all_images)} файлов..."

        # Обновляем индекс
        for root_name, rel_path, full_path in all_images:
            try:
                # Проверяем, нужно ли обновлять запись
                update_needed = True
                file_mtime = os.path.getmtime(full_path)

                if rel_path in index["root_directories"][root_name]["images"]:
                    # Если файл не изменен, пропускаем
                    if (
                        "last_modified"
                        in index["root_directories"][root_name]["images"][rel_path]
                        and index["root_directories"][root_name]["images"][rel_path][
                            "last_modified"
                        ]
                        == file_mtime
                    ):
                        update_needed = False

                # Если нужно обновить, получаем метаданные
                if update_needed:
                    metadata = get_file_metadata(full_path)
                    index["root_directories"][root_name]["images"][rel_path] = metadata

                # Обновляем прогресс
                INDEXING_STATUS["indexed_files"] += 1
                INDEXING_STATUS["progress"] = (
                    INDEXING_STATUS["indexed_files"] / INDEXING_STATUS["total_files"]
                ) * 100

                # Периодически сохраняем промежуточные результаты
                if INDEXING_STATUS["indexed_files"] % 100 == 0:
                    index["last_updated"] = datetime.now().isoformat()
                    with open(INDEX_FILE, "w") as f:
                        json.dump(index, f)

            except Exception as e:
                print(f"Ошибка при индексации {full_path}: {e}")

        # Удаляем записи для несуществующих файлов
        for root_name, root_info in list(index["root_directories"].items()):
            if root_name not in root_directories:
                # Удаляем директорию, которой больше нет в конфигурации
                del index["root_directories"][root_name]
            else:
                # Проверяем все индексированные файлы
                for rel_path in list(root_info["images"].keys()):
                    full_path = os.path.join(root_directories[root_name], rel_path)
                    if not os.path.exists(full_path):
                        del root_info["images"][rel_path]

        # Сохраняем финальный индекс
        index["last_updated"] = datetime.now().isoformat()
        with open(INDEX_FILE, "w") as f:
            json.dump(index, f)

        # Обновляем глобальный индекс в памяти
        global SEARCH_INDEX
        SEARCH_INDEX = index

        INDEXING_STATUS["in_progress"] = False
        INDEXING_STATUS["progress"] = 100
        INDEXING_STATUS["last_message"] = "Индексация завершена"
        print(
            f"Индексация завершена. Обработано {INDEXING_STATUS['indexed_files']} файлов."
        )

    except Exception as e:
        INDEXING_STATUS["in_progress"] = False
        INDEXING_STATUS["last_message"] = f"Ошибка индексации: {str(e)}"
        print(f"Ошибка при индексации: {e}")


def start_indexing(root_directories):
    """Запуск индексации в отдельном потоке"""
    thread = Thread(target=build_index_background, args=(root_directories,))
    thread.daemon = True
    thread.start()
    return thread


def load_index():
    """Загрузка индекса из файла"""
    global SEARCH_INDEX
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r") as f:
                SEARCH_INDEX = json.load(f)
            return True
        except:
            SEARCH_INDEX = {"version": 1, "last_updated": "", "root_directories": {}}
            return False
    else:
        SEARCH_INDEX = {"version": 1, "last_updated": "", "root_directories": {}}
        return False


def search_in_index(query, root_name=None, match_type="any", location="all"):
    """Поиск в индексе с дополнительными параметрами"""
    if not query:
        return []

    # Импортируем модуль re для регулярных выражений
    import re

    query = query.lower()
    results = []

    for dir_name, dir_info in SEARCH_INDEX.get("root_directories", {}).items():
        # Пропускаем директории, если указана конкретная
        if root_name and dir_name != root_name:
            continue

        root_path = dir_info.get("path", "")

        for rel_path, metadata in dir_info.get("images", {}).items():
            # Проверяем все поля на совпадение
            found = False
            relevance = 0  # Для сортировки по релевантности

            # Определяем функцию проверки совпадения в зависимости от match_type
            def check_match(text):
                if not text or not isinstance(text, str):
                    return False, 0

                text = text.lower()

                if match_type == "exact":
                    # Точное совпадение - ищем как отдельное слово
                    matches = re.findall(r"\b" + re.escape(query) + r"\b", text)
                    if matches:
                        return True, 3  # Максимальная релевантность
                    return False, 0

                elif match_type == "start":
                    # Совпадение в начале слова
                    words = re.findall(r"\b\w+", text)
                    for word in words:
                        if word.lower().startswith(query):
                            return True, 2  # Средняя релевантность
                    return False, 0

                else:  # "any"
                    # Любое вхождение
                    if query in text:
                        # Проверяем, является ли это точным совпадением
                        exact_matches = re.findall(
                            r"\b" + re.escape(query) + r"\b", text
                        )
                        if exact_matches:
                            return True, 3  # Максимальная релевантность

                        # Проверяем, является ли это совпадением в начале слова
                        for word in re.findall(r"\b\w+", text):
                            if word.lower().startswith(query):
                                return True, 2  # Средняя релевантность

                        return True, 1  # Минимальная релевантность
                    return False, 0

            # Проверяем промпт
            if location in ["all", "prompt"] and "prompt" in metadata:
                match, rel = check_match(metadata["prompt"])
                if match:
                    found = True
                    relevance = max(relevance, rel)

            # Проверяем негативный промпт
            if (
                not found
                and location in ["all", "negative"]
                and "negative_prompt" in metadata
            ):
                match, rel = check_match(metadata["negative_prompt"])
                if match:
                    found = True
                    relevance = max(relevance, rel)

            # Проверяем параметры
            if not found and location in ["all", "params"] and "parameters" in metadata:
                for param in metadata["parameters"]:
                    if isinstance(param, str):
                        match, rel = check_match(param)
                        if match:
                            found = True
                            relevance = max(relevance, rel)
                            break

            # Проверяем имя файла
            if not found and location in ["all", "filename"] and "filename" in metadata:
                match, rel = check_match(metadata["filename"])
                if match:
                    found = True
                    relevance = max(relevance, rel)

            if found:
                result = {
                    "root_name": dir_name,
                    "root_path": root_path,
                    "dir": os.path.dirname(rel_path),
                    "filename": os.path.basename(rel_path),
                    "path": rel_path,
                    "metadata": metadata,
                    "relevance": relevance,  # Добавляем релевантность для сортировки
                }
                results.append(result)

    return results


# для поиска выше
app = Flask(__name__, static_folder="static", static_url_path="/static")
app.json = CustomJSONProvider(app)

# Конфигурация: путь к корневой директории с изображениями
IMAGE_ROOT = "."  # Измените на свой путь, например "/path/to/stable-diffusion/outputs"
FAVORITES_FILE = "favorites.json"
COLLECTIONS_FILE = "collections.json"


def get_directory_structure(path):
    """Получение структуры директорий"""
    result = []
    for root, dirs, files in os.walk(path):
        rel_path = os.path.relpath(root, path)
        if rel_path == ".":
            continue
        result.append(rel_path)
    # Сортировка в обратном порядке (сначала самые новые папки)
    return sorted(result, reverse=True)


def get_images_in_directory(dir_path):
    """Получение списка изображений в директории"""
    images = []
    if not os.path.isdir(os.path.join(IMAGE_ROOT, dir_path)):
        return images

    for file in os.listdir(os.path.join(IMAGE_ROOT, dir_path)):
        if file.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            images.append(file)
    return sorted(images)


def extract_sd_components(parameters_text):
    """Извлечение структурированных компонентов из текста параметров SD"""
    result = {"prompt": "", "negative_prompt": "", "seed": "", "other_params": []}

    if not parameters_text or not isinstance(parameters_text, str):
        return result

    # Попытка найти негативный промпт
    neg_prompt_idx = parameters_text.find("Negative prompt:")

    if neg_prompt_idx > 0:
        # Есть негативный промпт
        result["prompt"] = parameters_text[:neg_prompt_idx].strip()

        # Найдем первый параметр после негативного промпта
        params_start = parameters_text.find("Steps:", neg_prompt_idx)
        if params_start > 0:
            result["negative_prompt"] = parameters_text[
                neg_prompt_idx + len("Negative prompt:") : params_start
            ].strip()
            params_text = parameters_text[params_start:].strip()
        else:
            result["negative_prompt"] = parameters_text[
                neg_prompt_idx + len("Negative prompt:") :
            ].strip()
            params_text = ""
    else:
        # Нет негативного промпта
        params_start = parameters_text.find("Steps:")
        if params_start > 0:
            result["prompt"] = parameters_text[:params_start].strip()
            params_text = parameters_text[params_start:].strip()
        else:
            result["prompt"] = parameters_text.strip()
            params_text = ""

    # Извлекаем seed, если есть
    seed_match = re.search(r"Seed: (\d+)", params_text)
    if seed_match:
        result["seed"] = seed_match.group(1)

    # Получаем остальные параметры
    if params_text:
        # Разделяем параметры по запятым и добавляем в список
        params_list = params_text.split(", ")
        result["other_params"] = [
            param.strip() for param in params_list if param.strip()
        ]

    return result


def get_image_metadata(image_path):
    """Извлечение метаданных из изображения"""
    try:
        with Image.open(image_path) as img:
            # Получаем EXIF-данные, если они есть
            exif_data = {}
            if hasattr(img, "_getexif") and img._getexif() is not None:
                for tag_id, value in img._getexif().items():
                    tag = TAGS.get(tag_id, tag_id)
                    if isinstance(value, bytes):
                        try:
                            # Пытаемся декодировать байты как UTF-8
                            value = value.decode("utf-8", "replace")
                        except:
                            # Если не получается декодировать, представляем как hex
                            value = value.hex()
                    exif_data[tag] = value

            # Получаем метаданные PNG, если это PNG
            png_info = {}
            if image_path.lower().endswith(".png") and hasattr(img, "text"):
                png_info = img.text

            # Формируем структуру метаданных
            metadata = {
                "dimensions": f"{img.width}x{img.height}",
                "format": img.format,
                "mode": img.mode,
                "exif": exif_data,
                "png_info": png_info,
            }

            # Специфичные для Stable Diffusion метаданные обычно находятся в параметрах png_info
            sd_metadata = {}

            # Извлечение параметров из png_info или имени файла
            raw_parameters = None
            if "parameters" in png_info:
                raw_parameters = png_info["parameters"]
                sd_metadata["raw_parameters"] = raw_parameters
            else:
                # Попытка извлечь параметры из имени файла (часто Stable Diffusion добавляет промпт в имя)
                filename = os.path.basename(image_path)
                sd_metadata["filename"] = filename

            # Добавляем структурированные параметры, только если есть raw_parameters
            if raw_parameters:
                try:
                    # Логируем что мы парсим для отладки
                    print(f"Parsing parameters: {raw_parameters}")
                    structured = extract_sd_components(raw_parameters)
                    print(f"Structured result: {structured}")

                    # Явно создаем словарь с нужными полями для лучшей сериализации
                    structured_dict = {
                        "prompt": structured["prompt"],
                        "negative_prompt": structured["negative_prompt"],
                        "seed": structured["seed"],
                        "other_params": (
                            structured["other_params"]
                            if isinstance(structured["other_params"], list)
                            else []
                        ),
                    }

                    # Проверяем, что результат действительно содержит данные
                    if (
                        structured_dict["prompt"]
                        or structured_dict["negative_prompt"]
                        or structured_dict["seed"]
                    ):
                        sd_metadata["structured"] = structured_dict
                        print(f"Added structured data: {structured_dict}")
                except Exception as e:
                    print(f"Ошибка при структурировании параметров: {e}")

            metadata["stable_diffusion"] = sd_metadata

            print(f"Final metadata: {metadata['stable_diffusion']}")
            return metadata
    except Exception as e:
        print(f"Error in get_image_metadata: {str(e)}")
        return {"error": str(e)}


def save_collections(collections):
    """Сохранение коллекций изображений"""
    with open(COLLECTIONS_FILE, "w") as f:
        json.dump(collections, f)


def load_collections():
    """Загрузка коллекций изображений"""
    # Проверяем, существует ли старый файл favorites.json
    if os.path.exists(FAVORITES_FILE) and not os.path.exists(COLLECTIONS_FILE):
        # Конвертируем старый формат в новый
        favorites = load_favorites()
        collections = {"favorites": {"name": "Избранное", "images": favorites}}
        # Сохраняем в новом формате
        with open(COLLECTIONS_FILE, "w") as f:
            json.dump(collections, f)
        return collections

    # Если существует файл collections.json, загружаем его
    if os.path.exists(COLLECTIONS_FILE):
        with open(COLLECTIONS_FILE, "r") as f:
            try:
                collections = json.load(f)

                # Проверяем наличие коллекции "favorites"
                if "favorites" not in collections:
                    # Получаем текущий язык из конфигурации, если есть
                    config_file = "app_config.json"
                    config = {}
                    if os.path.exists(config_file):
                        with open(config_file, "r") as cf:
                            config = json.load(cf)

                    # Выбираем название в зависимости от языка
                    favorite_name = (
                        "Favorites" if config.get("language") == "en" else "Избранное"
                    )
                    collections["favorites"] = {"name": favorite_name, "images": []}

                return collections
            except:
                # В случае ошибки создаем стандартную структуру
                return {"favorites": {"name": "Избранное", "images": []}}

    # Если файл не существует, создаем стандартную структуру
    return {"favorites": {"name": "Избранное", "images": []}}


@app.route("/")
def index():
    """Главная страница"""
    return render_template("index.html")


@app.route("/api/directories")
def get_directories():
    """API-endpoint для получения структуры директорий"""
    # Получаем путь из запроса, если он указан
    root_path = request.args.get("root", IMAGE_ROOT)

    # Проверяем, существует ли директория
    if not os.path.isdir(root_path):
        return jsonify({"error": f"Директория не существует: {root_path}"}), 400

    directories = get_directory_structure(root_path)
    return jsonify(directories)


@app.route("/api/images")
def get_images():
    """API-endpoint для получения списка изображений в директории"""
    dir_path = request.args.get("dir", "")
    root_path = request.args.get("root", IMAGE_ROOT)

    # Проверяем, является ли dir_path пустой строкой (корневая директория)
    # и формируем полный путь соответственно
    if dir_path:
        full_path = os.path.join(root_path, dir_path)
    else:
        # Если dir пустой, работаем с корневой директорией
        full_path = root_path

    # Проверяем, существует ли директория
    if not os.path.isdir(full_path):
        return jsonify({"error": f"Директория не существует: {full_path}"}), 400

    # Используем переданный root_path вместо глобального IMAGE_ROOT
    images = []
    for file in os.listdir(full_path):
        if file.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            images.append(file)

    return jsonify(sorted(images))


@app.route("/api/image")
def get_image():
    """API-endpoint для получения изображения"""
    dir_path = request.args.get("dir", "")
    filename = request.args.get("filename", "")
    root_path = request.args.get("root", IMAGE_ROOT)

    if not filename:
        return jsonify({"error": "Missing filename parameter"}), 400

    # Проверяем, является ли dir_path пустой строкой (корневая директория)
    # и формируем полный путь соответственно
    if dir_path:
        image_path = os.path.join(root_path, dir_path, filename)
    else:
        # Если dir пустой, значит файл находится прямо в корневой директории
        image_path = os.path.join(root_path, filename)

    if not os.path.exists(image_path):
        return jsonify({"error": "Image not found"}), 404

    return send_file(image_path)


@app.route("/api/metadata")
def get_metadata():
    """API-endpoint для получения метаданных изображения"""
    dir_path = request.args.get("dir", "")
    filename = request.args.get("filename", "")
    root_path = request.args.get("root", IMAGE_ROOT)

    if not filename:
        return jsonify({"error": "Missing parameters"}), 400

    # Проверяем, является ли dir_path пустой строкой (корневая директория)
    # и формируем полный путь соответственно
    if dir_path:
        image_path = os.path.join(root_path, dir_path, filename)
    else:
        # Если dir пустой, значит файл находится прямо в корневой директории
        image_path = os.path.join(root_path, filename)

    if not os.path.exists(image_path):
        return jsonify({"error": "Image not found"}), 404

    try:
        metadata = get_image_metadata(image_path)
        return jsonify(metadata)
    except Exception as e:
        import traceback

        error_details = traceback.format_exc()
        print(f"Error processing metadata for {image_path}: {e}")
        print(error_details)
        return jsonify({"error": str(e), "details": error_details}), 500


@app.route("/api/collections", methods=["GET"])
def get_collections():
    """API-endpoint для получения всех коллекций"""
    collections = load_collections()
    return jsonify(collections)


@app.route("/api/collections/<collection_id>", methods=["GET"])
def get_collection(collection_id):
    """API-endpoint для получения конкретной коллекции"""
    collections = load_collections()
    if collection_id in collections:
        return jsonify(collections[collection_id])
    else:
        return jsonify({"error": "Collection not found"}), 404


@app.route("/api/collections", methods=["POST"])
def create_collection():
    """API-endpoint для создания новой коллекции"""
    data = request.json

    if not data or "name" not in data:
        return jsonify({"error": "Missing name parameter"}), 400

    name = data["name"].strip()
    if not name:
        return jsonify({"error": "Collection name cannot be empty"}), 400

    collections = load_collections()

    # Генерируем уникальный ID для коллекции
    collection_id = f"collection_{int(datetime.now().timestamp())}"

    collections[collection_id] = {"name": name, "images": []}

    save_collections(collections)
    return jsonify({"success": True, "collection_id": collection_id})


@app.route("/api/collections/<collection_id>", methods=["PUT"])
def update_collection(collection_id):
    """API-endpoint для обновления названия коллекции"""
    data = request.json

    if not data or "name" not in data:
        return jsonify({"error": "Missing name parameter"}), 400

    name = data["name"].strip()
    if not name:
        return jsonify({"error": "Collection name cannot be empty"}), 400

    collections = load_collections()

    if collection_id not in collections:
        return jsonify({"error": "Collection not found"}), 404

    collections[collection_id]["name"] = name
    save_collections(collections)

    return jsonify({"success": True})


@app.route("/api/collections/<collection_id>", methods=["DELETE"])
def delete_collection(collection_id):
    """API-endpoint для удаления коллекции"""
    collections = load_collections()

    if collection_id not in collections:
        return jsonify({"error": "Collection not found"}), 404

    if collection_id == "favorites":
        return jsonify({"error": "Cannot delete default favorites collection"}), 400

    del collections[collection_id]
    save_collections(collections)

    return jsonify({"success": True})


@app.route("/api/collections/image", methods=["POST"])
def update_collection_image():
    """API-endpoint для добавления/удаления изображения из коллекции"""
    data = request.json

    if (
        not data
        or "action" not in data
        or "collection_id" not in data
        or "dir" not in data
        or "filename" not in data
    ):
        return jsonify({"error": "Missing parameters"}), 400

    collections = load_collections()

    if data["collection_id"] not in collections:
        return jsonify({"error": "Collection not found"}), 404

    # Формируем идентификатор изображения с учетом корневой директории
    root = data.get("root", "")
    image_id = (
        f"{root}:{data['dir']}/{data['filename']}"
        if root
        else f"{data['dir']}/{data['filename']}"
    )

    if (
        data["action"] == "add"
        and image_id not in collections[data["collection_id"]]["images"]
    ):
        collections[data["collection_id"]]["images"].append(image_id)
    elif (
        data["action"] == "remove"
        and image_id in collections[data["collection_id"]]["images"]
    ):
        collections[data["collection_id"]]["images"].remove(image_id)

    save_collections(collections)
    return jsonify({"success": True})


# Маршруты для работы с корневыми директориями
@app.route("/api/root_directories", methods=["GET"])
def get_root_directories_route():
    """API-endpoint для получения списка корневых директорий"""
    # Для веб-версии используем конфигурационный файл
    config_file = "app_config.json"

    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config = json.load(f)
                return jsonify(config.get("root_directories", {}))
        except Exception as e:
            print(f"Ошибка при чтении конфигурации: {e}")
            return jsonify({})
    else:
        return jsonify({})


@app.route("/api/current_root", methods=["GET"])
def get_current_root_route():
    """API-endpoint для получения текущей корневой директории"""
    config_file = "app_config.json"

    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config = json.load(f)
                return jsonify({"current_root": config.get("current_root", "")})
        except Exception as e:
            print(f"Ошибка при чтении конфигурации: {e}")
            return jsonify({"current_root": ""})
    else:
        return jsonify({"current_root": ""})


@app.route("/api/set_current_root/<name>", methods=["GET"])
def set_current_root_route(name):
    """API-endpoint для установки текущей корневой директории"""
    config_file = "app_config.json"

    try:
        # Загружаем текущую конфигурацию
        config = {}
        if os.path.exists(config_file):
            with open(config_file, "r") as f:
                config = json.load(f)

        # Проверяем наличие директории
        root_dirs = config.get("root_directories", {})
        if name in root_dirs:
            config["current_root"] = name

            # Сохраняем обновленную конфигурацию
            with open(config_file, "w") as f:
                json.dump(config, f)

            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Root directory not found"}), 400
    except Exception as e:
        print(f"Ошибка при установке текущей директории: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/add_root_directory/<name>/<path:path>", methods=["GET"])
def add_root_directory_route(name, path):
    """API-endpoint для добавления корневой директории"""
    config_file = "app_config.json"

    try:
        # Загружаем текущую конфигурацию
        config = {}
        if os.path.exists(config_file):
            with open(config_file, "r") as f:
                config = json.load(f)

        # Исправление пути: проверка, нужно ли добавить начальный слеш
        if not path.startswith("/") and os.path.sep == "/":
            # Для macOS и Linux путь должен начинаться с /
            path = "/" + path
            print(f"Added leading slash to path: {path}")

        # Получаем/создаем словарь корневых директорий
        root_dirs = config.get("root_directories", {})

        # Добавляем или обновляем директорию
        root_dirs[name] = path
        config["root_directories"] = root_dirs

        # Если это первая директория, устанавливаем её как текущую
        if not config.get("current_root") and root_dirs:
            config["current_root"] = name

        # Сохраняем обновленную конфигурацию
        with open(config_file, "w") as f:
            json.dump(config, f)

        return jsonify({"success": True})
    except Exception as e:
        print(f"Ошибка при добавлении директории: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/remove_root_directory/<name>", methods=["GET"])
def remove_root_directory_route(name):
    """API-endpoint для удаления корневой директории"""
    config_file = "app_config.json"

    try:
        # Загружаем текущую конфигурацию
        if not os.path.exists(config_file):
            return (
                jsonify({"success": False, "error": "Configuration file not found"}),
                404,
            )

        with open(config_file, "r") as f:
            config = json.load(f)

        # Получаем словарь корневых директорий
        root_dirs = config.get("root_directories", {})

        if name in root_dirs:
            # Удаляем директорию
            del root_dirs[name]
            config["root_directories"] = root_dirs

            # Если удалили текущую директорию, выбираем другую, если есть
            if config.get("current_root") == name:
                if root_dirs:
                    config["current_root"] = next(iter(root_dirs))
                else:
                    config["current_root"] = ""
                    config["current_directory"] = ""

            # Сохраняем обновленную конфигурацию
            with open(config_file, "w") as f:
                json.dump(config, f)

            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Root directory not found"}), 400
    except Exception as e:
        print(f"Ошибка при удалении директории: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# маршруты для поиска
@app.route("/api/indexing/status")
def indexing_status():
    """API-endpoint для получения статуса индексации"""
    # Преобразуем статус в JSON-совместимый формат
    serializable_status = make_json_serializable(INDEXING_STATUS)
    return jsonify(serializable_status)


@app.route("/api/indexing/start")
def start_indexing_route():
    """API-endpoint для запуска индексации"""
    if INDEXING_STATUS["in_progress"]:
        return jsonify({"success": False, "message": "Индексация уже выполняется"})

    # Получаем корневые директории из конфигурации
    config_file = "app_config.json"
    root_directories = {}

    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config = json.load(f)
                root_directories = config.get("root_directories", {})
        except Exception as e:
            return jsonify(
                {"success": False, "message": f"Ошибка чтения конфигурации: {str(e)}"}
            )

    if not root_directories:
        return jsonify(
            {"success": False, "message": "Нет добавленных директорий для индексации"}
        )

    # Запускаем индексацию
    start_indexing(root_directories)
    return jsonify({"success": True, "message": "Индексация запущена"})


@app.route("/api/search")
def search_images():
    """API-endpoint для поиска изображений по индексу"""
    query = request.args.get("query", "").lower()
    root_name = request.args.get("root", None)
    match_type = request.args.get("match_type", "any")  # exact, start, any
    location = request.args.get(
        "location", "all"
    )  # all, prompt, negative, params, filename

    if not query:
        return jsonify([])

    # Если индекс не загружен, загружаем его
    if not SEARCH_INDEX:
        load_index()

    # Выполняем поиск в индексе с новыми параметрами
    results = search_in_index(query, root_name, match_type, location)

    return jsonify(results)


@app.route("/api/config/set/language/<lang>", methods=["GET"])
def set_language_route(lang):
    from flask import jsonify

    try:
        # Загружаем текущую конфигурацию
        config_file = "app_config.json"
        config = {}
        if os.path.exists(config_file):
            with open(config_file, "r") as f:
                config = json.load(f)

        # Устанавливаем выбранный язык
        config["language"] = lang

        # Сохраняем обновленную конфигурацию
        with open(config_file, "w") as f:
            json.dump(config, f)

        return jsonify({"success": True})
    except Exception as e:
        print(f"Error setting language: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


import webbrowser

if __name__ == "__main__":
    # Открываем браузер с небольшой задержкой, чтобы сервер успел запуститься
    import threading

    port = 5001  # или какой порт вы используете
    url = f"http://127.0.0.1:{port}"
    threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    # Запускаем Flask-сервер
    app.run(debug=True, port=port)
