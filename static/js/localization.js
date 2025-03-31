// Создайте новый файл: static/js/localization.js

// Доступные языки
const AVAILABLE_LANGUAGES = ['ru', 'en'];

// Словари с переводами
const translations = {
    // Русский (базовый язык)
    'ru': {
        // мои дополнения 
        "prompt": "Промпт",
        "copy": "Копировать",
        "negative_prompt": "Негативный промпт",
        "stable_diffusion_params": "Параметры изображения",
        "generation_params": "Параметры генерации",
        "png_metadata": "PNG метаданные",
        'nothing_found_for_query': 'По запросу "{query}" ничего не найдено',
        'image_removed_from_collection': 'Изображение удалено из коллекции "{collection}"',
        'image_added_to_collection': 'Изображение добавлено в коллекцию "{collection}"',
        "copied_to_clipboard": "Скопировано в буфер обмена",
        "copy_failed": "Не удалось скопировать текст",
        "zoom_in": "Увеличить",
        "check_directory_path": "Проверьте путь к директории и убедитесь, что он существует.",
        "directory_added_successfully": "Директория успешно добавлена",
        'please_enter_directory_name': 'Пожалуйста, введите название директории',
        'please_specify_directory_path': 'Пожалуйста, укажите путь к папке с изображениями',
        'directory_added_successfully': 'Директория успешно добавлена',
        'could_not_save_directory': 'Не удалось сохранить директорию. Пожалуйста, попробуйте снова.',
        'error_saving_directory': 'Ошибка при сохранении директории. Пожалуйста, попробуйте снова.',
        'copy_selected': 'Копировать',
        "no_images_in_folder": "В этой папке нет изображений",
        "no_folders_in_directory": "В выбранной директории нет папок",
        "confirm_delete_collection": "Вы уверены, что хотите удалить коллекцию \"{collection}\"?",
        "directory_selection_desktop_only": "Выбор директории доступен только в десктопной версии приложения",
        "beer_donate": "Закинуть автору на пиво",
        "metadata_load_error": "Ошибка при загрузке метаданных",
        "unsupported_or_corrupt_file": "Возможно, формат изображения не поддерживается или файл поврежден.",
        "indexing_completed": "Индексация завершена",
        "new_collection": "Новая коллекция",
        "create": "Создать",
        "enter_collection_name": "Пожалуйста, введите название коллекции",
        "collection_name": "Название:",
        "collection_name_placeholder": "Введите название коллекции",
        "cancel": "Отмена",
        "collection_updated_successfully": "Коллекция успешно обновлена",
        "collection_update_error": "Ошибка при обновлении коллекции",
        "collection_deleted_successfully": "Коллекция успешно удалена",
        "collection_delete_error_with_reason": "Ошибка при удалении коллекции: {error}",
        "collection_delete_error": "Ошибка при удалении коллекции",
        "unknown_error": "Неизвестная ошибка",
        "edit_collection": "Редактирование коллекции",
        "save": "Сохранить",
        "collection_created_successfully": "Коллекция успешно создана",
        "add_root_directory": "Добавьте корневую директорию",
        "need_directory_explanation": "Для работы приложения необходимо указать хотя бы одну директорию, где хранятся изображения.",
        "how_to_find_path": "Как найти путь к папке:",
        "path_instruction_1": "Нажмите Finder в Dock, чтобы открыть окно Finder.",
        "path_instruction_2": "Выберите «Вид» > «Показать строку пути» или нажмите клавишу Option для быстрого отображения строки пути.",
        "path_instruction_3": "Найдите вашу папку с изображениями.",
        "path_instruction_4": "Нажмите правую кнопку мыши на папке в строке пути и выберите \"Скопировать как путь\".",
        "no_images_in_root_folder": "В этой корневой директории нет изображений",
        "viewing_root_directory": "Просмотр изображений из корневой директории",





        // Общие элементы интерфейса
        'favorites': 'Избранное',
        'no_images_in_collection': 'В коллекции "{collection}" нет изображений',
        'collection': 'Коллекция',
        'choose_directory': 'Выберите директорию',
        'all_images': 'Все изображения',
        'add_collection': 'Добавить коллекцию',
        'select_folder': 'Выберите папку для просмотра изображений',
        'loading': 'Загрузка...',

        // Настройки
        'settings': 'Настройки',
        "root_directories": "Корневые директории",
        "add_new_directory": "Добавить новую директорию",
        "directory_name": "Название",
        "directory_path": "Путь",
        "example_directory": "Например: SD WebUI",
        "directory_path_placeholder": "/путь/к/директории",
        "browse": "Обзор",
        "add": "Добавить",

        // Метаданные
        'select_image_metadata': 'Выберите изображение для просмотра метаданных',
        'basic_info': 'Основная информация',
        'size': 'Размер',
        'format': 'Формат',

        // Поиск
        'search_prompt': 'Поиск по промпту...',
        'search_results': 'Результаты поиска',
        'found': 'Найдено',
        'nothing_found': 'Ничего не найдено',

        // Типы поиска
        'search_type': 'Тип поиска',
        'exact_match': 'Точное совпадение',
        'word_start': 'Начало слова',
        'any_match': 'Любое вхождение',

        // Сортировка
        'sorting': 'Сортировка',
        'by_relevance': 'По релевантности',
        'newest_first': 'Новые сверху',
        'oldest_first': 'Старые сверху',
        'name_az': 'По имени (A-Z)',
        'name_za': 'По имени (Z-A)',

        "search_in": "Искать в",
        "search_everywhere": "Везде",
        "search_prompt_only": "Только в промптах",
        "search_negative_only": "Только в негативных промптах",
        "search_params_only": "Только в параметрах",
        "search_filename_only": "Только в именах файлов"
    },

    // Английский
    'en': {
        // мои дополнения 
        "prompt": "Prompt",
        "copy": "Copy",
        "negative_prompt": "Negative prompt",
        "stable_diffusion_params": "Image parameters",
        "generation_params": "Generation Parameters",
        "png_metadata": "PNG Metadata",
        'nothing_found_for_query': 'No results found for "{query}"',
        'image_removed_from_collection': 'Image removed from the "{collection}" collection',
        'image_added_to_collection': 'Image added to the "{collection}" collection',
        "copied_to_clipboard": "Copied to clipboard",
        "copy_failed": "Failed to copy text",
        "zoom_in": "Zoom In",
        "check_directory_path": "Check the directory path and make sure it exists.",
        "directory_added_successfully": "Directory added successfully",
        'please_enter_directory_name': 'Please enter a directory name',
        'please_specify_directory_path': 'Please specify a path to the folder with images',
        'directory_added_successfully': 'Directory successfully added',
        'could_not_save_directory': 'Could not save directory. Please try again.',
        'error_saving_directory': 'Error saving directory. Please try again.',
        'copy_selected': 'Copy',
        "no_images_in_folder": "There are no images in this folder",
        "no_folders_in_directory": "No folders in the selected directory",
        "confirm_delete_collection": "Are you sure you want to delete the collection \"{collection}\"?",
        "directory_selection_desktop_only": "Directory selection is only available in the desktop version of the application",
        "metadata_load_error": "Error loading metadata",
        "unsupported_or_corrupt_file": "The image format may not be supported or the file may be corrupted.",
        "beer_donate": "Buy the author a beer",
        "indexing_completed": "Indexing completed",
        "new_collection": "New Collection",
        "create": "Create",
        "enter_collection_name": "Please enter a collection name",
        "collection_name": "Name:",
        "collection_name_placeholder": "Enter collection name",
        "cancel": "Cancel",
        "collection_updated_successfully": "Collection updated successfully",
        "collection_update_error": "Error updating collection",
        "collection_deleted_successfully": "Collection deleted successfully",
        "collection_delete_error_with_reason": "Error deleting collection: {error}",
        "collection_delete_error": "Error deleting collection",
        "unknown_error": "Unknown error",
        "edit_collection": "Edit Collection",
        "save": "Save",
        "collection_created_successfully": "Collection created successfully",
        "add_root_directory": "Add Root Directory",
        "need_directory_explanation": "The application needs at least one directory where your images are stored.",
        "how_to_find_path": "How to find the folder path:",
        "path_instruction_1": "Click on Finder in the Dock to open a Finder window.",
        "path_instruction_2": "Select 'View' > 'Show Path Bar' or press Option key to quickly display the path bar.",
        "path_instruction_3": "Find your images folder.",
        "path_instruction_4": "Right-click on the folder in the path bar and select 'Copy as Path'.",
        "no_images_in_root_folder": "There are no images in this root directory",
        "viewing_root_directory": "Viewing images from root directory",



        // Общие элементы интерфейса
        'favorites': 'Favorites',
        'no_images_in_collection': 'There are no images in the "{collection}" collection',
        'collection': 'Collection',
        'choose_directory': 'Choose Directory',
        'all_images': 'All Images',
        'add_collection': 'Add Collection',
        'select_folder': 'Select a folder to view images',
        'loading': 'Loading...',

        // Настройки
        'settings': 'Settings',
        'root_directories': 'Root Directories',
        'add_new_directory': 'Add New Directory',
        'directory_name': 'Name',
        'directory_path': 'Path',
        'example_directory': 'Example: SD WebUI',
        'directory_path_placeholder': '/path/to/directory',
        'browse': 'Browse',
        'add': 'Add',

        // Метаданные
        'select_image_metadata': 'Select an image to view metadata',
        'basic_info': 'Basic Information',
        'size': 'Size',
        'format': 'Format',

        // Поиск
        'search_prompt': 'Search by prompt...',
        'search_results': 'Search Results',
        'found': 'Found',
        'nothing_found': 'Nothing found',

        // Типы поиска
        'search_type': 'Search Type',
        'exact_match': 'Exact Match',
        'word_start': 'Word Start',
        'any_match': 'Any Match',

        // Сортировка
        'sorting': 'Sort By',
        'by_relevance': 'Relevance',
        'newest_first': 'Newest First',
        'oldest_first': 'Oldest First',
        'name_az': 'Name (A-Z)',
        'name_za': 'Name (Z-A)',

        "search_in": "Search in",
        "search_everywhere": "Everywhere",
        "search_prompt_only": "Only in prompts",
        "search_negative_only": "Only in negative prompts",
        "search_params_only": "Only in parameters",
        "search_filename_only": "Only in file names"
    }
};

// Текущий язык (по умолчанию русский)
let currentLanguage = 'ru';

// Функция для получения перевода
function __(key) {
    // Если перевод существует, возвращаем его
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }

    // Если перевода нет, возвращаем ключ
    console.warn(`Missing translation for key: "${key}" in language: "${currentLanguage}"`);

    // Пробуем найти в русском языке как запасной вариант
    if (currentLanguage !== 'ru' && translations['ru'] && translations['ru'][key]) {
        return translations['ru'][key];
    }

    return key;
}

// Функция для изменения языка
function setLanguage(lang) {
    // Проверяем, доступен ли язык
    if (AVAILABLE_LANGUAGES.includes(lang)) {
        // Сохраняем выбор пользователя в localStorage
        localStorage.setItem('sdGalleryLanguage', lang);

        // Сохраняем на сервере через API
        try {
            if (window.pywebview && window.pywebview.api) {
                // Для десктопной версии используем PyWebView API
                window.pywebview.api.set_config('language', lang);
            } else {
                // Для браузерной версии используем обычный fetch
                fetch(`/api/config/set/language/${encodeURIComponent(lang)}`)
                    .catch(e => console.error('Ошибка при сохранении языка:', e));
            }
        } catch (e) {
            console.error('Ошибка при сохранении языка:', e);
        }

        currentLanguage = lang;

        // Обновляем все элементы на странице
        updatePageTranslations();
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

        console.log(`Язык изменен на: ${lang}`);

        // Обновляем кастомные селекты после смены языка
        const rootSelector = document.getElementById('rootDirectorySelector');
        if (rootSelector) {
            const customSelect = document.querySelector(`.custom-select[data-for="${rootDirectorySelector.id}"]`);
            if (customSelect) {
                customSelect.remove();
                rootDirectorySelector.style.display = '';
            }
            createCustomSelect(rootDirectorySelector);
        }

        return true;
    }
    return false;
}

// Функция для обновления всех переводов на странице
function updatePageTranslations() {
    // Находим все элементы с атрибутом data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = __(key);
    });

    // Обновляем плейсхолдеры в полях ввода
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = __(key);
    });

    document.querySelectorAll('[data-i18n="no_images_in_collection"]').forEach(element => {
        const collectionName = decodeURIComponent(element.getAttribute('data-collection-name') || '');
        if (collectionName) {
            // Создаем сообщение с правильной заменой, но не переводим имя коллекции
            const message = __('no_images_in_collection').replace('{collection}', collectionName);
            element.textContent = message;
        } else {
            // Если нет имени коллекции, просто используем перевод без замены
            element.textContent = __('no_images_in_collection');
        }
    });

    // Временно делаем модальное окно видимым для обновления переводов
    const wasHidden = settingsModal.style.display === 'none';
    if (wasHidden) {
        const originalDisplay = settingsModal.style.display;
        settingsModal.style.display = 'block';
        settingsModal.style.visibility = 'hidden'; // Скрываем визуально, но оставляем в DOM

        // Обновляем переводы
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = __(key);
        });

        // Восстанавливаем исходное состояние
        settingsModal.style.display = originalDisplay;
        settingsModal.style.visibility = '';
    } else {
        // Стандартное обновление переводов
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = __(key);
        });
    }
    // Обновляем плейсхолдеры в полях ввода
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = __(key);
    });

    // Принудительно обновляем список коллекций
    if (typeof updateCollectionsInSidebar === 'function') {
        updateCollectionsInSidebar();
    }

    // Обновляем динамически созданные элементы, если они есть
    updateDynamicElements();
}

// Функция для обновления динамически созданных элементов
function updateDynamicElements() {
    // Обновляем кастомные селекты
    document.querySelectorAll('.custom-select-trigger[data-i18n]').forEach(trigger => {
        const key = trigger.getAttribute('data-i18n');
        trigger.textContent = __(key);
    });

    document.querySelectorAll('.custom-option[data-i18n]').forEach(option => {
        const key = option.getAttribute('data-i18n');
        option.textContent = __(key);
    });

    // И другие динамические элементы...
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Загружаем язык из конфигурации сервера
    fetch('/api/config/get')
        .then(response => response.json())
        .then(config => {
            // Если в конфигурации есть языковая настройка, используем её
            if (config.language && AVAILABLE_LANGUAGES.includes(config.language)) {
                currentLanguage = config.language;
            } else {
                // Иначе используем локальное хранилище или язык браузера
                const savedLanguage = localStorage.getItem('sdGalleryLanguage');
                const browserLanguage = navigator.language.split('-')[0]; // 'en-US' -> 'en'

                if (savedLanguage && AVAILABLE_LANGUAGES.includes(savedLanguage)) {
                    currentLanguage = savedLanguage;
                } else if (AVAILABLE_LANGUAGES.includes(browserLanguage)) {
                    currentLanguage = browserLanguage;
                }
                // Если ничего не подошло, останется русский по умолчанию
            }

            // Обновляем переводы на странице
            updatePageTranslations();

            // Добавляем переключатель языка
            addLanguageSwitcher();
        })
        .catch(error => {
            console.error('Ошибка при загрузке конфигурации:', error);

            // В случае ошибки используем локальное хранилище
            const savedLanguage = localStorage.getItem('sdGalleryLanguage');
            if (savedLanguage && AVAILABLE_LANGUAGES.includes(savedLanguage)) {
                currentLanguage = savedLanguage;
            }

            updatePageTranslations();
            addLanguageSwitcher();
        });
});

// Функция для добавления переключателя языка
function addLanguageSwitcher() {
    // Создаем контейнер для переключателя
    const languageSwitcher = document.createElement('div');
    languageSwitcher.className = 'language-switcher';

    // Добавляем кнопки для каждого языка
    AVAILABLE_LANGUAGES.forEach(lang => {
        const button = document.createElement('button');
        button.textContent = lang.toUpperCase();
        button.className = 'lang-button';
        if (lang === currentLanguage) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            // Меняем язык при клике
            if (setLanguage(lang)) {
                // Обновляем активную кнопку
                document.querySelectorAll('.lang-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            }
        });

        languageSwitcher.appendChild(button);
    });

    // Добавляем переключатель на страницу (например, в хедер)
    const header = document.querySelector('.sidebar-header-lang');
    if (header) {
        header.appendChild(languageSwitcher);
    }
}

// Экспортируем функции
window.__ = __; // Делаем функцию перевода глобально доступной
window.setLanguage = setLanguage;