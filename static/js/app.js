// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    // Если текст был передан как строка, используем её напрямую,
    // иначе пытаемся декодировать, если он был закодирован
    const textToCopy = typeof text === 'string' ? text :
        text.startsWith('%') ? decodeURIComponent(text) : text;

    // Создаем временный элемент input
    const el = document.createElement('textarea');
    el.value = textToCopy;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);

    // Сохраняем текущее выделение
    const selected = document.getSelection().rangeCount > 0
        ? document.getSelection().getRangeAt(0)
        : false;

    el.select();

    // Копируем текст
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Не удалось скопировать текст', err);
    }

    // Удаляем временный элемент
    document.body.removeChild(el);

    // Восстанавливаем предыдущее выделение
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }

    // Показываем уведомление об успешном копировании
    if (success) {
        showToast(__("copied_to_clipboard"));
    } else {
        showToast(__("copy_failed"));
    }
}

// Функция для отображения уведомления
function showToast(message) {
    // Создаем элемент уведомления, если его еще нет
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    // Устанавливаем текст уведомления
    toast.textContent = message;
    toast.style.opacity = '1';

    // Скрываем уведомление через 2 секунды
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Функция для разбора параметров SD и создания HTML-структуры
function parseSDParams(rawParams) {
    if (!rawParams) return null;

    console.log("Разбор параметров:", rawParams);

    const negativeIndex = rawParams.indexOf("Negative prompt:");
    const stepsIndex = rawParams.indexOf("Steps:");

    let prompt = "";
    let negativePrompt = "";
    let params = "";
    let seed = "";

    // Разбираем строку параметров
    if (negativeIndex > 0) {
        prompt = rawParams.substring(0, negativeIndex).trim();
        if (stepsIndex > 0) {
            negativePrompt = rawParams.substring(negativeIndex + 16, stepsIndex).trim();
            params = rawParams.substring(stepsIndex).trim();
        } else {
            negativePrompt = rawParams.substring(negativeIndex + 16).trim();
        }
    } else if (stepsIndex > 0) {
        prompt = rawParams.substring(0, stepsIndex).trim();
        params = rawParams.substring(stepsIndex).trim();
    } else {
        prompt = rawParams.trim();
    }

    console.log("Промпт:", prompt);
    console.log("Негативный промпт:", negativePrompt);
    console.log("Параметры:", params);

    // Ищем seed
    const seedMatch = params.match(/Seed: (\d+)/);
    if (seedMatch && seedMatch[1]) {
        seed = seedMatch[1];
        console.log("Seed:", seed);
    }

    // Разбиваем параметры на список
    let paramsList = [];
    if (params) {
        paramsList = params.split(',').map(p => p.trim());
        console.log("Список параметров:", paramsList);
    }

    // Формируем HTML
    let html = '';

    // Промпт
    // Промпт
    if (prompt) {
        // Экранируем HTML теги
        const safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Заменяем \n на <br> для HTML-отображения
        const displayPrompt = safePrompt.replace(/\n/g, '<br>');

        const escapedPrompt = prompt.replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');

        html += `
        <div class="metadata-section">
    <h5 data-i18n="prompt">Промпт:</h5>
    <div class="metadata-value-block">
        <div class="copyable-text">${displayPrompt}</div>
        <button class="copy-button" onclick="copyToClipboard('${escapedPrompt}')">
            <i class="fas fa-copy"></i> <span data-i18n="copy">Копировать</span>
        </button>
    </div>
</div>`;
    }

    // Негативный промпт
    if (negativePrompt) {
        html += `
            <div class="metadata-section">
    <h5 data-i18n="negative_prompt">Negative prompt:</h5>
    <div class="metadata-value-block">
        <div class="copyable-text">${negativePrompt}</div>
        <button class="copy-button" onclick="copyToClipboard('${negativePrompt.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
            <i class="fas fa-copy"></i> <span data-i18n="copy">Копировать</span>
        </button>
    </div>
</div>`;
    }

    // Параметры
    if (paramsList.length > 0) {
        html += `<div class="metadata-section"><h5 data-i18n="generation_params">${__("generation_params")}</h5>`;

        // Выделяем seed
        if (seed) {
            html += `
                <div class="parameter-item seed-value" onclick="copyToClipboard('${seed}')">
                    <strong>Seed: ${seed}</strong> <i class="fas fa-copy fa-xs"></i>
                </div>`;
        }

        // Остальные параметры
        paramsList.forEach(param => {
            if (!param.startsWith("Seed:")) {
                html += `<div class="parameter-item">${param}</div>`;
            }
        });

        html += `</div>`;
    }

    return html;
}
// Функция для создания кастомного селекта из стандартного
function createCustomSelect(selectElement) {
    // Создаем обертку для кастомного селекта
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.dataset.for = selectElement.id; // сохраняем ID оригинального селекта

    // Создаем триггер (видимая часть)
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';

    // Устанавливаем текст из выбранной опции или из первой опции
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (selectedOption) {
        const dataI18n = selectedOption.getAttribute('data-i18n');
        if (dataI18n) {
            trigger.textContent = __(dataI18n);
            trigger.setAttribute('data-i18n', dataI18n);
        } else {
            trigger.textContent = selectedOption.textContent;
        }
        trigger.dataset.value = selectedOption.value;
    } else {
        trigger.textContent = 'Выберите';
        trigger.dataset.value = '';
    }

    // Создаем контейнер для опций
    const customOptions = document.createElement('div');
    customOptions.className = 'custom-options';

    // Добавляем опции
    Array.from(selectElement.options).forEach(option => {
        const customOption = document.createElement('div');
        customOption.className = 'custom-option';

        // Проверяем, есть ли атрибут data-i18n у опции
        const dataI18n = option.getAttribute('data-i18n');
        if (dataI18n) {
            customOption.textContent = __(dataI18n);
            customOption.setAttribute('data-i18n', dataI18n);
        } else {
            customOption.textContent = option.textContent;
        }

        customOption.dataset.value = option.value;

        // Если опция выбрана, добавляем класс selected
        if (option.selected) {
            customOption.classList.add('selected');
        }

        // Обработчик клика по опции
        customOption.addEventListener('click', () => {
            // Обновляем текст триггера
            const dataI18n = option.getAttribute('data-i18n');
            if (dataI18n) {
                trigger.textContent = __(dataI18n);
                trigger.setAttribute('data-i18n', dataI18n);
            } else {
                trigger.textContent = option.textContent;
            }
            trigger.dataset.value = option.value;

            // Обновляем выбранную опцию в оригинальном селекте
            selectElement.value = option.value;

            // Вызываем событие change на оригинальном селекте
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);

            // Отмечаем выбранную опцию
            customSelect.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            customOption.classList.add('selected');

            // Закрываем селект
            customSelect.classList.remove('open');
        });

        customOptions.appendChild(customOption);
    });

    // Добавляем триггер и опции в кастомный селект
    customSelect.appendChild(trigger);
    customSelect.appendChild(customOptions);

    // Обработчик клика по триггеру (открытие/закрытие)
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();

        // Закрываем все другие открытые селекты
        document.querySelectorAll('.custom-select.open').forEach(select => {
            if (select !== customSelect) {
                select.classList.remove('open');
            }
        });

        // Открываем/закрываем текущий селект
        customSelect.classList.toggle('open');
    });

    // Скрываем оригинальный селект
    selectElement.style.display = 'none';

    // Вставляем кастомный селект после оригинального
    selectElement.parentNode.insertBefore(customSelect, selectElement.nextSibling);

    // Обновляем кастомный селект при изменении оригинального
    selectElement.addEventListener('change', () => {
        const newSelectedOption = selectElement.options[selectElement.selectedIndex];
        if (newSelectedOption) {
            const dataI18n = newSelectedOption.getAttribute('data-i18n');
            if (dataI18n) {
                trigger.textContent = __(dataI18n);
                trigger.setAttribute('data-i18n', dataI18n);
            } else {
                trigger.textContent = newSelectedOption.textContent;
            }
            trigger.dataset.value = newSelectedOption.value;

            customSelect.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.dataset.value === newSelectedOption.value) {
                    opt.classList.add('selected');
                }
            });
        }
    });

    return customSelect;
}

// Инициализация кастомных селектов
function initCustomSelects() {
    // Находим селект для выбора корневой директории
    const rootSelector = document.getElementById('rootDirectorySelector');
    if (rootSelector) {
        createCustomSelect(rootSelector);
    }

    // В будущем можно добавить и другие селекты
    // Например, селекты фильтров для поиска
    const searchMatchType = document.getElementById('searchMatchType');
    const searchLocation = document.getElementById('searchLocation');
    const searchSortOrder = document.getElementById('searchSortOrder');

    if (searchMatchType) createCustomSelect(searchMatchType);
    if (searchLocation) createCustomSelect(searchLocation);
    if (searchSortOrder) createCustomSelect(searchSortOrder);
}

// Закрытие всех селектов при клике вне них
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open').forEach(select => {
        select.classList.remove('open');
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const directoryTree = document.getElementById('directoryTree');
    const galleryContainer = document.getElementById('galleryContainer');
    const metadataPanel = document.getElementById('metadataPanel');
    const filterOptions = document.querySelectorAll('.filter-option');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close');

    const rootDirectorySelector = document.getElementById('rootDirectorySelector');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.querySelector('.close-settings');
    const rootDirectoriesList = document.getElementById('rootDirectoriesList');
    const newDirectoryName = document.getElementById('newDirectoryName');
    const newDirectoryPath = document.getElementById('newDirectoryPath');
    const browseDirectoryButton = document.getElementById('browseDirectoryButton');
    const addDirectoryButton = document.getElementById('addDirectoryButton');

    const collectionsContainer = document.getElementById('collectionsContainer');
    const addCollectionButton = document.getElementById('addCollectionButton');
    const collectionModal = document.getElementById('collectionModal');
    const closeCollection = document.querySelector('.close-collection');
    const collectionName = document.getElementById('collectionName');
    const saveCollectionButton = document.getElementById('saveCollectionButton');
    const cancelCollectionButton = document.getElementById('cancelCollectionButton');
    const collectionModalTitle = document.getElementById('collectionModalTitle');
    const selectCollectionModal = document.getElementById('selectCollectionModal');
    const closeSelectCollection = document.querySelector('.close-select-collection');
    const collectionsListModal = document.getElementById('collectionsListModal');
    const newCollectionInModalButton = document.getElementById('newCollectionInModalButton');

    const searchInput = document.getElementById('searchInput');
    const clearSearchIcon = document.getElementById('clearSearchIcon');

    // Состояние приложения
    let currentDirectory = '';
    let currentFilter = 'all';
    let selectedImage = null;
    let favorites = [];
    let rootDirectories = {};
    let currentRootName = '';
    let collections = {};
    let editingCollectionId = null;

    let tempDir = null;
    let tempFilename = null;
    let tempRootName = null;

    let searchController = null;
    let searchTimeout = null;
    let indexingCheckInterval = null;

    let currentSearchOptions = {
        matchType: 'any',
        location: 'all',
        sortOrder: 'relevance'
    };
    // Инициализируем тестовый кастомный селект в добавленном тестовом блоке
    const testCustomSelects = document.querySelectorAll('.test-custom-select-container .custom-select');

    testCustomSelects.forEach(select => {
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelector('.custom-options');
        const optionElements = select.querySelectorAll('.custom-option');

        // Открытие/закрытие выпадающего списка
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Закрываем все другие открытые селекты
            document.querySelectorAll('.custom-select.open').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });

            // Открываем/закрываем текущий селект
            select.classList.toggle('open');
        });

        // Выбор опции
        optionElements.forEach(option => {
            option.addEventListener('click', () => {
                trigger.textContent = option.textContent;
                trigger.dataset.value = option.dataset.value;
                select.classList.remove('open');

                // Отмечаем выбранную опцию
                select.querySelectorAll('.custom-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');

                // Тут можно добавить обработку выбранного значения
                console.log('Выбрано:', option.dataset.value, option.textContent);
            });
        });
    });

    // Инициализируем кастомные селекты для всего приложения
    // Запускаем с небольшой задержкой, чтобы обычные селекты успели загрузиться


    // Добавим функцию проверки статуса индексации:
    async function checkIndexingStatus() {
        try {
            const response = await fetch('/api/indexing/status');
            const status = await response.json();

            const progressBar = document.getElementById('indexingProgressBar');
            const progressContainer = document.getElementById('indexingProgress');

            if (status.in_progress) {
                // Показываем индикатор прогресса
                progressContainer.style.display = 'block';
                progressBar.style.width = `${status.progress}%`;

                // Обновляем текст
                document.querySelector('.indexing-label').textContent = status.last_message;
            } else if (status.progress === 100) {
                // Индексация завершена
                progressContainer.style.display = 'block';
                progressBar.style.width = '100%';
                document.querySelector('.indexing-label').textContent = __("indexing_completed");

                // Скрываем через 2 секунды
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 2000);

                // Останавливаем проверку статуса
                if (indexingCheckInterval) {
                    clearInterval(indexingCheckInterval);
                    indexingCheckInterval = null;
                }
            } else {
                // Индексация еще не запущена или была остановлена
                progressContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Ошибка при проверке статуса индексации:', error);
        }
    }

    // Функция запуска индексации:
    async function startIndexing() {
        try {
            const response = await fetch('/api/indexing/start');
            const result = await response.json();

            if (result.success) {
                // Запускаем проверку статуса
                if (!indexingCheckInterval) {
                    indexingCheckInterval = setInterval(checkIndexingStatus, 1000);
                }
            } else {
                console.error('Ошибка запуска индексации:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при запуске индексации:', error);
        }
    }

    async function performSearch(query, options = {}) {
        // Если запрос пустой, отменяем поиск и возвращаемся
        if (!query.trim()) {
            if (searchController) {
                searchController.abort();
                searchController = null;
            }

            // Возвращаемся к предыдущему состоянию
            if (currentFilter === 'search') {
                // Переключаемся на просмотр всех изображений
                currentFilter = 'all';
                filterOptions.forEach(opt => {
                    if (opt.dataset.filter === 'all') {
                        opt.classList.add('active');
                    }
                });

                if (currentDirectory) {
                    selectDirectory(currentDirectory);
                } else {
                    galleryContainer.innerHTML = `<div class="empty-state">
                        <i class="fas fa-image"></i>
                        <p data-i18n="select_folder">${__("select_folder")}</p>
                    </div>`;
                }
            }

            return;
        }

        // Обновляем текущие параметры поиска
        currentSearchOptions = {
            matchType: 'any',        // Тип совпадения (exact, start, any)
            location: 'all',         // Где искать (all, prompt, negative, params, filename)
            sortOrder: 'relevance',  // Как сортировать результаты
            ...options               // Перезаписываем параметры по умолчанию переданными опциями
        };

        // Показываем, что поиск выполняется
        galleryContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        try {
            // Отменяем предыдущий запрос, если есть
            if (searchController) {
                searchController.abort();
            }

            // Создаем новый контроллер для отмены
            searchController = new AbortController();
            const signal = searchController.signal;

            // Формируем URL запроса с дополнительными параметрами
            let url = `/api/search?query=${encodeURIComponent(query)}&match_type=${currentSearchOptions.matchType}&location=${currentSearchOptions.location}`;
            if (currentRootName) {
                url += `&root=${encodeURIComponent(currentRootName)}`;
            }

            console.log("Поиск URL:", url);

            // Выполняем запрос с возможностью отмены
            const response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error('Ошибка при выполнении поиска');
            }

            const searchResults = await response.json();
            console.log("Получены результаты:", searchResults.length);

            // Сортируем результаты
            const sortedResults = sortResults(searchResults, currentSearchOptions.sortOrder);

            // Обновляем UI
            filterOptions.forEach(opt => opt.classList.remove('active'));
            document.querySelectorAll('.filter-option[data-collection-id]').forEach(el => {
                el.classList.remove('active');
            });

            // Указываем, что мы в режиме поиска
            currentFilter = 'search';

            // Отображаем результаты поиска
            displaySearchResults(query, sortedResults);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Поиск был отменен');
                return;
            }

            console.error('Ошибка при выполнении поиска:', error);
            galleryContainer.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Ошибка при выполнении поиска: ${error.message}</p>
            </div>`;
        }
    }

    // Функция сортировки результатов
    function sortResults(results, sortOrder) {
        // Копируем массив, чтобы не изменять оригинал
        const sortedResults = [...results];

        switch (sortOrder) {
            case 'relevance':
                // Сортировка по релевантности (убывание)
                sortedResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
                break;
            case 'date_desc':
                // Сортировка по дате (новые сверху)
                sortedResults.sort((a, b) => {
                    const dateA = a.metadata?.last_modified || 0;
                    const dateB = b.metadata?.last_modified || 0;
                    return dateB - dateA;
                });
                break;
            case 'date_asc':
                // Сортировка по дате (старые сверху)
                sortedResults.sort((a, b) => {
                    const dateA = a.metadata?.last_modified || 0;
                    const dateB = b.metadata?.last_modified || 0;
                    return dateA - dateB;
                });
                break;
            case 'name_asc':
                // Сортировка по имени (A-Z)
                sortedResults.sort((a, b) => {
                    return a.filename.localeCompare(b.filename);
                });
                break;
            case 'name_desc':
                // Сортировка по имени (Z-A)
                sortedResults.sort((a, b) => {
                    return b.filename.localeCompare(a.filename);
                });
                break;
        }

        return sortedResults;
    }

    // Обновленная функция отображения результатов поиска:
    function displaySearchResults(query, results) {
        // Очищаем контейнер галереи
        galleryContainer.innerHTML = '';

        // Добавляем заголовок с количеством результатов и фильтрами
        const headerDiv = document.createElement('div');
        headerDiv.className = 'search-results-header';
        headerDiv.innerHTML = `
    <div class="search-title-row">
        <span data-i18n="search_results">${__("search_results")}: "${query}"</span>
        <span class="search-count" data-i18n="found">${__("found")}: ${results.length}</span>
    </div>
    <div class="search-filters-row">
        <div class="search-filter-group">
            <label data-i18n="search_type">${__("search_type")}:</label>
            <select id="searchMatchType" class="search-select">
                <option value="exact" data-i18n="exact_match">${__("exact_match")}</option>
                <option value="start" data-i18n="word_start">${__("word_start")}</option>
                <option value="any" selected data-i18n="any_match">${__("any_match")}</option>
            </select>
        </div>
        <div class="search-filter-group">
            <label data-i18n="sorting">${__("sorting")}:</label>
            <select id="searchSortOrder" class="search-select">
                <option value="relevance" selected data-i18n="by_relevance">${__("by_relevance")}</option>
                <option value="date_desc" data-i18n="newest_first">${__("newest_first")}</option>
                <option value="date_asc" data-i18n="oldest_first">${__("oldest_first")}</option>
                <option value="name_asc" data-i18n="name_az">${__("name_az")}</option>
                <option value="name_desc" data-i18n="name_za">${__("name_za")}</option>
            </select>
        </div>
        <div class="search-filter-group">
            <label data-i18n="search_in">${__("search_in")}:</label>
            <select id="searchLocation" class="search-select">
                <option value="all" selected data-i18n="search_everywhere">${__("search_everywhere")}</option>
                <option value="prompt" data-i18n="search_prompt_only">${__("search_prompt_only")}</option>
                <option value="negative" data-i18n="search_negative_only">${__("search_negative_only")}</option>
                <option value="params" data-i18n="search_params_only">${__("search_params_only")}</option>
                <option value="filename" data-i18n="search_filename_only">${__("search_filename_only")}</option>
            </select>
        </div>
    </div>
`;
        galleryContainer.appendChild(headerDiv);

        // Добавляем класс галереи
        galleryContainer.classList.add('gallery-grid');

        // Если нет результатов, показываем сообщение
        if (results.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.style.gridColumn = '1 / -1'; // Занимает всю ширину сетки

            // Создаем сообщение с переводом
            const message = __('nothing_found_for_query').replace('{query}', query);

            emptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <p data-i18n="nothing_found_for_query" data-query="${encodeURIComponent(query)}">${message}</p>
            `;

            galleryContainer.appendChild(emptyState);
        } else {
            // ДОБАВЛЯЕМ ИЗОБРАЖЕНИЯ только если они есть
            for (const result of results) {
                const { root_name, root_path, dir, filename, metadata } = result;

                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.filename = filename;
                imageItem.dataset.rootName = root_name;

                const img = document.createElement('img');
                const imgUrl = `/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&root=${encodeURIComponent(root_path)}`;
                img.src = imgUrl;
                img.alt = filename;
                img.loading = 'lazy';

                const favoriteIcon = document.createElement('i');
                favoriteIcon.className = 'fas fa-star favorite-icon';
                if (isImageInAnyCollection(root_name, dir, filename)) {
                    favoriteIcon.classList.add('favorited');
                }

                favoriteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSelectCollectionModal(dir, filename, root_name);
                });

                // Добавляем индикатор корневой директории
                const rootIndicator = document.createElement('div');
                rootIndicator.className = 'root-indicator';
                rootIndicator.textContent = root_name;

                imageItem.appendChild(img);
                imageItem.appendChild(favoriteIcon);
                imageItem.appendChild(rootIndicator);

                imageItem.addEventListener('click', () => {
                    // Если изображение из другой корневой директории, учитываем это
                    if (root_name !== currentRootName) {
                        const originalRootName = currentRootName;
                        const originalRootDirectory = rootDirectory;

                        rootDirectory = root_path;
                        selectImageFromCollection(dir, filename, root_path);

                        currentRootName = originalRootName;
                        rootDirectory = originalRootDirectory;
                    } else {
                        selectImage(dir, filename);
                    }
                });

                galleryContainer.appendChild(imageItem);
            }
        }

        // Устанавливаем значения фильтров в соответствии с текущими параметрами поиска
        if (currentSearchOptions) {
            const matchTypeSelect = document.getElementById('searchMatchType');
            const locationSelect = document.getElementById('searchLocation');
            const sortOrderSelect = document.getElementById('searchSortOrder');

            if (matchTypeSelect && currentSearchOptions.matchType) {
                matchTypeSelect.value = currentSearchOptions.matchType;
            }

            if (locationSelect && currentSearchOptions.location) {
                locationSelect.value = currentSearchOptions.location;
            }

            if (sortOrderSelect && currentSearchOptions.sortOrder) {
                sortOrderSelect.value = currentSearchOptions.sortOrder;
            }
        }

        // Добавляем обработчики фильтров
        addSearchFilterHandlers(query);

        // Инициализируем кастомные селекты для фильтров поиска с небольшой задержкой
        setTimeout(() => {
            initDynamicCustomSelects(document.querySelector('.search-results-header'));
        }, 10);
    }
    // Функция для динамической инициализации кастомных селектов
    function initDynamicCustomSelects(container) {
        if (!container) return;

        const selects = container.querySelectorAll('select:not([data-custom-initialized])');
        selects.forEach(select => {
            select.dataset.customInitialized = 'true';
            createCustomSelect(select);
        });

        console.log(`Инициализировано ${selects.length} кастомных селектов в контейнере:`, container);
    }

    // Функция для добавления обработчиков фильтров
    function addSearchFilterHandlers(query) {
        // Добавляем обработчики изменения параметров поиска
        const matchTypeSelect = document.getElementById('searchMatchType');
        const locationSelect = document.getElementById('searchLocation');
        const sortOrderSelect = document.getElementById('searchSortOrder');

        if (matchTypeSelect) {
            matchTypeSelect.addEventListener('change', function () {
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query, {
                        matchType: this.value,
                        location: locationSelect ? locationSelect.value : 'all',
                        sortOrder: sortOrderSelect ? sortOrderSelect.value : 'relevance'
                    });
                }
            });
        }

        if (locationSelect) {
            locationSelect.addEventListener('change', function () {
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query, {
                        matchType: matchTypeSelect ? matchTypeSelect.value : 'any',
                        location: this.value,
                        sortOrder: sortOrderSelect ? sortOrderSelect.value : 'relevance'
                    });
                }
            });
        }

        if (sortOrderSelect) {
            sortOrderSelect.addEventListener('change', function () {
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query, {
                        matchType: matchTypeSelect ? matchTypeSelect.value : 'any',
                        location: locationSelect ? locationSelect.value : 'all',
                        sortOrder: this.value
                    });
                }
            });
        }

        // Инициализируем кастомные селекты для фильтров поиска с небольшой задержкой
        setTimeout(() => {
            initDynamicCustomSelects(document.querySelector('.search-results-header'));
        }, 10);
    }

    // Выделение совпадений в тексте
    function highlightMatches(text, query) {
        if (!text || !query) return text;

        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();

        if (!lowerText.includes(lowerQuery)) return text;

        let result = '';
        let lastIndex = 0;

        while (true) {
            const index = lowerText.indexOf(lowerQuery, lastIndex);
            if (index === -1) break;

            // Добавляем текст до совпадения
            result += text.substring(lastIndex, index);

            // Добавляем выделенное совпадение
            result += `<span class="search-highlight">${text.substring(index, index + query.length)}</span>`;

            lastIndex = index + query.length;
        }

        // Добавляем оставшийся текст
        result += text.substring(lastIndex);

        return result;
    }
    // Функция для показа попапа выбора директории
    // Исправленная функция для показа попапа
    function showPathSelectionPopup() {
        // Создаем элементы попапа
        const overlay = document.createElement('div');
        overlay.className = 'path-selection-overlay';

        const popup = document.createElement('div');
        popup.className = 'path-selection-popup';

        // Содержимое попапа с поддержкой локализации и переключателем языка
        popup.innerHTML = `
            <div class="popup-language-switcher">
                <button class="lang-button" data-lang="ru">RU</button>
                <button class="lang-button" data-lang="en">EN</button>
            </div>
    
            <h2 data-i18n="add_root_directory">${__("add_root_directory")}</h2>
            <p data-i18n="need_directory_explanation">${__("need_directory_explanation")}</p>
            
            <div class="form-group">
                <label for="popupDirectoryName" data-i18n="directory_name">${__("directory_name")}</label>
                <input type="text" id="popupDirectoryName" data-i18n-placeholder="example_directory" placeholder="${__("example_directory")}" class="settings-input">
            </div>
            
            <div class="form-group">
                <label for="popupDirectoryPath" data-i18n="directory_path">${__("directory_path")}</label>
                <input type="text" id="popupDirectoryPath" data-i18n-placeholder="directory_path_placeholder" placeholder="${__("directory_path_placeholder")}" class="settings-input">
            </div>
            
            <div class="instructions">
                <p><strong data-i18n="how_to_find_path">${__("how_to_find_path")}</strong></p>
                <ol>
                    <li data-i18n="path_instruction_1">${__("path_instruction_1")}</li>
                    <li data-i18n="path_instruction_2">${__("path_instruction_2")}</li>
                    <li data-i18n="path_instruction_3">${__("path_instruction_3")}</li>
                    <li data-i18n="path_instruction_4">${__("path_instruction_4")}</li>
                </ol>
            </div>
            
            <div class="buttons">
                <button id="saveDirButton" data-i18n="save">${__("save")}</button>
            </div>
        `;

        // Добавляем попап на страницу
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Размываем фон
        document.querySelector('.sidebar').classList.add('blur-background');
        document.querySelector('.gallery').classList.add('blur-background');

        // Применяем переводы к новым элементам
        updatePageTranslations();

        // Проверяем сохраненный язык и активируем соответствующую кнопку
        // Пытаемся получить язык из localStorage на случай, если app_config.json ещё не создан
        const savedLanguage = localStorage.getItem('sdGalleryLanguage') || currentLanguage || 'ru';

        // Активируем соответствующую кнопку языка
        const langButtons = popup.querySelectorAll('.lang-button');
        langButtons.forEach(button => {
            if (button.getAttribute('data-lang') === savedLanguage) {
                button.classList.add('active');
            }

            // Добавляем обработчик события клика для переключения языка
            button.addEventListener('click', function () {
                const lang = this.getAttribute('data-lang');

                // Устанавливаем новый язык
                changeLanguage(lang);

                // Обновляем классы активной кнопки
                langButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Функция для изменения языка с сохранением в app_config.json
        async function changeLanguage(lang) {
            // Обновляем язык в UI
            setLanguage(lang);

            // Сохраняем в localStorage как запасной вариант
            localStorage.setItem('sdGalleryLanguage', lang);

            // Сохраняем язык в app_config.json через API
            try {
                const response = await fetch(`/api/config/set/language/${lang}`);
                if (!response.ok) {
                    console.error('Ошибка при сохранении языка в конфигурации');
                }
            } catch (error) {
                console.error('Ошибка при сохранении языка:', error);
            }
        }

        // Получаем ссылку на кнопку и добавляем обработчик
        const saveButton = document.getElementById('saveDirButton');
        const nameInput = document.getElementById('popupDirectoryName');
        const pathInput = document.getElementById('popupDirectoryPath');

        // Добавляем обработчик события
        saveButton.onclick = async function () {
            const name = nameInput.value.trim();
            const path = normalizePath(pathInput.value.trim());

            if (!name) {
                alert(__('please_enter_directory_name'));
                return;
            }

            if (!path) {
                alert(__('please_specify_directory_path'));
                return;
            }

            try {
                // Добавляем директорию через API
                const response = await fetch(`/api/add_root_directory/${encodeURIComponent(name)}/${encodeURIComponent(path)}`);

                if (response.ok) {
                    // Обновляем локальные данные
                    rootDirectories[name] = path;
                    currentRootName = name;
                    rootDirectory = path;

                    // Закрываем попап
                    document.body.removeChild(overlay);

                    // Убираем размытие
                    document.querySelector('.sidebar').classList.remove('blur-background');
                    document.querySelector('.gallery').classList.remove('blur-background');

                    // Обновляем интерфейс
                    updateRootDirectorySelector();
                    loadDirectories();

                    // Запуск индексации после добавления директории
                    startIndexing();

                    showToast(__("directory_added_successfully"));
                } else {
                    alert(__('could_not_save_directory'));
                }
            } catch (error) {
                console.error("Error saving directory:", error);
                alert(__('error_saving_directory'));
            }
        };

        // Обработчик нажатия Enter в поле ввода
        pathInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                saveButton.click();
            }
        });

        nameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && nameInput.value.trim()) {
                pathInput.focus();
            }
        });

        // Устанавливаем фокус на поле ввода
        setTimeout(() => {
            nameInput.focus();
        }, 100);
    }

    // Глобальная переменная для хранения ссылки на активное контекстное меню
    let activeContextMenu = null;

    document.addEventListener('contextmenu', function (e) {
        // Проверяем, что клик был внутри панели метаданных
        if (e.target.closest('.metadata-panel')) {
            e.preventDefault(); // Отменяем стандартное контекстное меню

            // Получаем выделенный текст
            const selectedText = window.getSelection().toString();
            if (!selectedText) {
                // Если текст не выделен, закрываем существующее меню и выходим
                if (activeContextMenu) {
                    removeContextMenu();
                }
                return;
            }

            // Удаляем старое меню, если оно существует
            if (activeContextMenu) {
                removeContextMenu();
            }

            // Создаем простое контекстное меню
            const contextMenu = document.createElement('div');
            contextMenu.className = 'custom-context-menu';
            contextMenu.innerHTML = `
            <div class="context-menu-item" id="copy-selected" data-i18n="copy_selected">${__('copy_selected')}</div>
        `;

            // Запоминаем активное меню
            activeContextMenu = contextMenu;

            // Добавляем меню на страницу
            document.body.appendChild(contextMenu);

            // Рассчитываем и устанавливаем позицию, чтобы меню не выходило за края экрана
            const menuRect = contextMenu.getBoundingClientRect();
            const x = Math.min(e.clientX, window.innerWidth - menuRect.width - 10);
            const y = Math.min(e.clientY, window.innerHeight - menuRect.height - 10);

            contextMenu.style.position = 'fixed';
            contextMenu.style.top = `${y}px`;
            contextMenu.style.left = `${x}px`;

            // Обработчик клика на пункт "Копировать"
            document.getElementById('copy-selected').addEventListener('click', function (clickEvent) {
                clickEvent.stopPropagation(); // Предотвращаем всплытие события
                copyToClipboard(selectedText);
                removeContextMenu();
            });

            // Добавляем глобальный обработчик щелчка для закрытия меню
            setTimeout(() => {
                document.addEventListener('click', handleGlobalClick);
            }, 0);

            // Закрываем меню при нажатии Escape
            document.addEventListener('keydown', handleEscapeKey);
        } else if (activeContextMenu) {
            // Если клик вне панели метаданных, закрываем меню
            e.preventDefault();
            removeContextMenu();
        }
    });

    // Функция обработки глобального клика
    function handleGlobalClick(e) {
        // Проверяем, что клик не внутри меню
        if (activeContextMenu && !activeContextMenu.contains(e.target)) {
            removeContextMenu();
        }
    }

    // Функция обработки нажатия Escape
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && activeContextMenu) {
            removeContextMenu();
        }
    }

    // Функция удаления меню и очистки обработчиков
    function removeContextMenu() {
        if (activeContextMenu && activeContextMenu.parentNode) {
            document.body.removeChild(activeContextMenu);
            activeContextMenu = null;

            // Удаляем обработчики
            document.removeEventListener('click', handleGlobalClick);
            document.removeEventListener('keydown', handleEscapeKey);
        }
    }
    // Загрузка структуры директорий
    async function loadDirectories() {
        try {
            let url = '/api/directories';
            if (rootDirectory) {
                url += `?root=${encodeURIComponent(rootDirectory)}`;
            }

            console.log("Loading directories from:", url);
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось загрузить директории');
            }

            const directories = await response.json();
            console.log("Loaded directories:", directories);

            // Группируем директории по их корневой папке
            const groupedDirs = directories.reduce((acc, dir) => {
                const parts = dir.split('/');
                const rootDir = parts[0];

                if (!acc[rootDir]) {
                    acc[rootDir] = [];
                }

                if (parts.length > 1) {
                    acc[rootDir].push(parts.slice(1).join('/'));
                }

                return acc;
            }, {});

            // Очищаем загрузочный спиннер
            directoryTree.innerHTML = '';

            // Рендеринг дерева директорий
            Object.entries(groupedDirs).forEach(([rootDir, subDirs]) => {
                const folderDiv = document.createElement('div');
                folderDiv.className = 'folder';

                const folderNameDiv = document.createElement('div');
                folderNameDiv.className = 'folder-name';
                folderNameDiv.innerHTML = `<i class="fas fa-folder"></i> ${rootDir}`;
                folderNameDiv.dataset.dir = rootDir;
                folderNameDiv.addEventListener('click', () => {
                    // При клике на папку всегда переключаемся в режим "Все изображения" и выбираем эту папку
                    // Снимаем выделение со всех фильтров и коллекций
                    filterOptions.forEach(opt => opt.classList.remove('active'));
                    document.querySelectorAll('.filter-option[data-collection-id]').forEach(el => {
                        el.classList.remove('active');
                    });
                    // Добавляем выделение только на "Все изображения"
                    document.querySelector('.filter-option[data-filter="all"]').classList.add('active');
                    currentFilter = 'all';
                    selectDirectory(rootDir);
                });

                folderDiv.appendChild(folderNameDiv);

                // Добавляем поддиректории, если они есть
                if (subDirs.length > 0) {
                    const subDirsContainer = document.createElement('div');
                    subDirsContainer.style.paddingLeft = '20px';

                    subDirs.forEach(subDir => {
                        const subFolderDiv = document.createElement('div');
                        subFolderDiv.className = 'folder-name';
                        subFolderDiv.innerHTML = `<i class="fas fa-folder"></i> ${subDir.split('/').pop()}`;
                        subFolderDiv.dataset.dir = `${rootDir}/${subDir}`;
                        subFolderDiv.addEventListener('click', () => {
                            // При клике на папку всегда переключаемся в режим "Все изображения" и выбираем эту папку
                            // Снимаем выделение со всех фильтров и коллекций
                            filterOptions.forEach(opt => opt.classList.remove('active'));
                            document.querySelectorAll('.filter-option[data-collection-id]').forEach(el => {
                                el.classList.remove('active');
                            });
                            // Добавляем выделение только на "Все изображения"
                            document.querySelector('.filter-option[data-filter="all"]').classList.add('active');
                            currentFilter = 'all';
                            selectDirectory(`${rootDir}/${subDir}`);
                        });

                        subDirsContainer.appendChild(subFolderDiv);
                    });

                    folderDiv.appendChild(subDirsContainer);
                }

                directoryTree.appendChild(folderDiv);
            });

            // Если нет папок, показываем сообщение
            if (Object.keys(groupedDirs).length === 0) {
                directoryTree.innerHTML = `<div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p data-i18n="no_folders_in_directory">${__("no_folders_in_directory")}</p>
                </div>`;

                // НОВЫЙ КОД: Если нет папок, проверяем есть ли изображения в корневой директории
                if (rootDirectory) {
                    // Загружаем изображения из корневой директории
                    loadRootImages();
                }
            }

            updatePageTranslations();
        } catch (error) {
            console.error('Ошибка при загрузке директорий:', error);
            directoryTree.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || 'Ошибка при загрузке директорий'}</p>
                <p data-i18n="check_directory_path">${__("check_directory_path")}</p>
            </div>`;
        }
    }

    // Новая функция для загрузки изображений из корневой директории
    async function loadRootImages() {
        try {
            // Загружаем изображения из корневой директории (передаем пустую строку как директорию)
            let url = `/api/images?dir=`;
            if (rootDirectory) {
                url += `&root=${encodeURIComponent(rootDirectory)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось загрузить изображения');
            }

            const images = await response.json();

            if (images.length === 0) {
                galleryContainer.innerHTML = `<div class="empty-state">    
                    <i class="fas fa-image"></i>    
                    <p data-i18n="no_images_in_root_folder">${__("no_images_in_root_folder")}</p>
                </div>`;
                return;
            }

            // Очищаем галерею и добавляем изображения
            galleryContainer.innerHTML = '';

            // Устанавливаем currentDirectory как пустую строку для корневой директории
            currentDirectory = '';

            // Отображаем изображения из корневой директории
            images.forEach(filename => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.filename = filename;

                const img = document.createElement('img');
                let imgUrl = `/api/image?dir=${encodeURIComponent('')}&filename=${encodeURIComponent(filename)}`;
                if (rootDirectory) {
                    imgUrl += `&root=${encodeURIComponent(rootDirectory)}`;
                }
                img.src = imgUrl;
                img.alt = filename;
                img.loading = 'lazy';

                // Добавляем поддержку перетаскивания
                img.draggable = true;
                img.addEventListener('dragstart', function (event) {
                    const fullImgUrl = this.src;
                    event.dataTransfer.setData('text/uri-list', fullImgUrl);
                    event.dataTransfer.setData('text/plain', fullImgUrl);
                    event.dataTransfer.effectAllowed = 'copy';
                    this.classList.add('dragging');
                });

                img.addEventListener('dragend', function () {
                    this.classList.remove('dragging');
                });

                const favoriteIcon = document.createElement('i');
                favoriteIcon.className = 'fas fa-star favorite-icon';
                // Проверяем, находится ли изображение в любой коллекции
                if (isImageInAnyCollection(currentRootName, '', filename)) {
                    favoriteIcon.classList.add('favorited');
                }

                favoriteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSelectCollectionModal('', filename);
                });

                imageItem.appendChild(img);
                imageItem.appendChild(favoriteIcon);

                imageItem.addEventListener('click', () => {
                    selectImage('', filename);
                });

                galleryContainer.appendChild(imageItem);
            });

            // Добавляем информационное сообщение о корневой директории
            const rootInfoMessage = document.createElement('div');
            rootInfoMessage.className = 'root-directory-info';
            rootInfoMessage.innerHTML = `<i class="fas fa-info-circle"></i> <span data-i18n="viewing_root_directory">${__("viewing_root_directory")}</span>`;
            galleryContainer.insertBefore(rootInfoMessage, galleryContainer.firstChild);

            updatePageTranslations();
        } catch (error) {
            console.error('Ошибка при загрузке изображений из корневой директории:', error);
            galleryContainer.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || 'Ошибка при загрузке изображений'}</p>
            </div>`;
        }
    }

    // Загрузка коллекций
    async function loadCollections() {
        try {
            const response = await fetch('/api/collections');
            collections = await response.json();
            console.log("Loaded collections:", collections);

            // Для обратной совместимости
            favorites = collections.favorites ? collections.favorites.images : [];

            // Обновляем список коллекций в интерфейсе
            updateCollectionsInSidebar();
        } catch (error) {
            console.error('Ошибка при загрузке коллекций:', error);
            collections = {
                favorites: {
                    name: __("favorites"),
                    images: []
                }
            };
            favorites = [];
        }
    }

    // Обновление списка коллекций в боковой панели
    function updateCollectionsInSidebar() {
        collectionsContainer.innerHTML = '';

        // Сначала добавляем избранное
        if (collections.favorites) {
            const favoritesItem = document.createElement('div');
            favoritesItem.className = 'filter-option';
            if (currentFilter === 'favorites') {
                favoritesItem.classList.add('active');
            }
            favoritesItem.dataset.filter = 'favorites';
            favoritesItem.dataset.collectionId = 'favorites';

            // Добавляем количество изображений в скобках
            const favoritesCount = collections.favorites.images ? collections.favorites.images.length : 0;

            favoritesItem.innerHTML = `<i class="fas fa-star"></i> ${__("favorites")} <span class="collection-count">(${favoritesCount})</span>`;

            favoritesItem.addEventListener('click', () => {
                selectCollection('favorites');
            });

            collectionsContainer.appendChild(favoritesItem);
        }

        // Затем добавляем пользовательские коллекции
        for (const [id, collection] of Object.entries(collections)) {
            if (id === 'favorites') continue;

            const collectionItem = document.createElement('div');
            collectionItem.className = 'filter-option collection-filter';
            if (currentFilter === id) {
                collectionItem.classList.add('active');
            }
            collectionItem.dataset.filter = id;
            collectionItem.dataset.collectionId = id;

            // Добавляем количество изображений в скобках
            const imagesCount = collection.images ? collection.images.length : 0;

            collectionItem.innerHTML = `
                <span><i class="fas fa-folder"></i> ${collection.name} <span class="collection-count">(${imagesCount})</span></span>
                <div class="collection-actions">
                    <button class="collection-action-button edit-collection" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="collection-action-button delete-collection" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Обработчик клика на коллекцию
            collectionItem.addEventListener('click', (e) => {
                // Игнорируем клики на кнопки действий
                if (e.target.closest('.collection-actions')) {
                    return;
                }

                selectCollection(id);
            });

            // Обработчик для кнопки редактирования
            const editButton = collectionItem.querySelector('.edit-collection');
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                editCollection(id);
            });

            // Обработчик для кнопки удаления
            const deleteButton = collectionItem.querySelector('.delete-collection');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCollection(id);
            });

            collectionsContainer.appendChild(collectionItem);
        }
        console.log('Обновление списка коллекций с текущим языком:', currentLanguage);
        console.log('Перевод "favorites":', __("favorites"));
    }

    // Выбор коллекции
    function selectCollection(collectionId) {
        // Обновляем UI
        filterOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelectorAll('.filter-option[data-collection-id]').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.collectionId === collectionId) {
                el.classList.add('active');
            }
        });

        currentFilter = collectionId;

        // Показываем изображения из коллекции
        showCollectionImages(collectionId);
    }

    // Показ изображений из коллекции
    async function showCollectionImages(collectionId) {
        // Отображаем загрузочный спиннер
        galleryContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        if (!collections[collectionId] || !collections[collectionId].images || collections[collectionId].images.length === 0) {
            // Получаем имя коллекции (не переводим его)
            const collectionName = collections[collectionId]?.name || __('collection');

            // Создаем сообщение с подстановкой
            const message = __('no_images_in_collection').replace('{collection}', collectionName);

            galleryContainer.innerHTML = `<div class="empty-state">
                <i class="fas fa-${collectionId === 'favorites' ? 'star' : 'folder'}"></i>
                <p data-i18n="no_images_in_collection" data-collection-name="${encodeURIComponent(collectionName)}">${message}</p>
            </div>`;
            return;
        }

        galleryContainer.innerHTML = '';

        // Создаем элементы для каждого изображения в коллекции
        for (const path of collections[collectionId].images) {
            // Разбираем путь, теперь он включает корневую директорию
            const parts = path.split(':');
            let rootName, imagePath;

            if (parts.length > 1) {
                // Новый формат: rootName:dir/filename
                rootName = parts[0];
                imagePath = parts[1];
            } else {
                // Старый формат для обратной совместимости: dir/filename
                rootName = currentRootName;
                imagePath = path;
            }

            const segments = imagePath.split('/');
            const dir = segments[0];
            const filename = segments.slice(1).join('/');

            // Получаем путь к директории из rootDirectories
            const rootPath = rootDirectories[rootName];
            if (!rootPath) continue; // Пропускаем, если директория не найдена

            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.dataset.filename = filename;
            imageItem.dataset.rootName = rootName;

            const img = document.createElement('img');
            let imgUrl = `/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&root=${encodeURIComponent(rootPath)}`;
            img.src = imgUrl;
            img.alt = filename;
            img.loading = 'lazy';

            const favoriteIcon = document.createElement('i');
            favoriteIcon.className = 'fas fa-star favorite-icon';
            // Всегда показываем желтые звездочки для изображений в любой коллекции
            if (isImageInAnyCollection(rootName, dir, filename)) {
                favoriteIcon.classList.add('favorited');
            }

            favoriteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                showSelectCollectionModal(dir, filename, rootName);
            });

            // Добавляем индикатор корневой директории
            const rootIndicator = document.createElement('div');
            rootIndicator.className = 'root-indicator';
            rootIndicator.textContent = rootName;

            imageItem.appendChild(img);
            imageItem.appendChild(favoriteIcon);
            imageItem.appendChild(rootIndicator);

            imageItem.addEventListener('click', () => {
                // Выбираем изображение без переключения корневой директории
                // Создаем временную переменную для хранения текущей директории
                const originalRootName = currentRootName;

                // Временно устанавливаем корневую директорию для получения изображения
                rootDirectory = rootDirectories[rootName];

                // Выбираем изображение
                selectImageFromCollection(dir, filename, rootPath);

                // Восстанавливаем исходные значения
                currentRootName = originalRootName;
                rootDirectory = rootDirectories[originalRootName];
            });

            galleryContainer.appendChild(imageItem);
        }
    }
    async function selectImageFromCollection(dir, filename, rootPath) {
        // Обновляем выбранное изображение в UI
        document.querySelectorAll('.image-item').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.filename === filename) {
                el.classList.add('selected');
            }
        });

        selectedImage = { dir, filename };

        // Отображаем загрузочный спиннер
        metadataPanel.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        try {
            let url = `/api/metadata?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}`;
            url += `&root=${encodeURIComponent(rootPath)}`;

            const response = await fetch(url);
            const metadata = await response.json();

            console.log("Полученные метаданные:", metadata);

            // Формируем панель метаданных
            let metadataHTML = `
                <div class="image-preview">
                    <img src="/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&root=${encodeURIComponent(rootPath)}" 
                         alt="${filename}"
                         onclick="document.getElementById('imageModal').style.display='block'; document.getElementById('modalImage').src='/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&root=${encodeURIComponent(rootPath)}'">
                    <div class="image-actions">
                        <button onclick="document.getElementById('imageModal').style.display='block'; document.getElementById('modalImage').src='/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}&root=${encodeURIComponent(rootPath)}'">
                            <i class="fas fa-search-plus"></i> <span data-i18n="zoom_in">Увеличить</span>
                        </button>
                    </div>
                </div>
                
                <h3>${filename}</h3>
            `;

            // Далее добавляем все метаданные так же, как в функции selectImage
            // Основная информация
            metadataHTML += `
                <div class="metadata-group">
    <h4 data-i18n="basic_info">Основная информация</h4>
    <div class="metadata-item">
        <div class="metadata-label" data-i18n="size">Размер:</div>
        <div class="metadata-value">${metadata.dimensions}</div>
    </div>
    <div class="metadata-item">
        <div class="metadata-label" data-i18n="format">Формат:</div>
        <div class="metadata-value">${metadata.format}</div>
    </div>
</div>
            `;

            // Информация Stable Diffusion
            if (metadata.stable_diffusion && Object.keys(metadata.stable_diffusion).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4 data-i18n="stable_diffusion_params">${__("stable_diffusion_params")}</h4>`;

                // Пытаемся использовать структурированные данные или анализируем raw_parameters
                if (metadata.stable_diffusion.raw_parameters) {
                    const parsedHTML = parseSDParams(metadata.stable_diffusion.raw_parameters);
                    if (parsedHTML) {
                        metadataHTML += parsedHTML;
                    } else {
                        // Если не удалось разобрать, показываем как есть
                        metadataHTML += `
                            <div class="metadata-section">
                                <h5>Все параметры:</h5>
                                <div class="metadata-value-block">
                                    <div class="copyable-text">${metadata.stable_diffusion.raw_parameters}</div>
                                    <button class="copy-button" onclick="copyToClipboard('${metadata.stable_diffusion.raw_parameters.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
                                        <i class="fas fa-copy"></i> Копировать
                                    </button>
                                </div>
                            </div>`;
                    }
                } else {
                    // Если нет параметров, показываем то, что есть
                    for (const [key, value] of Object.entries(metadata.stable_diffusion)) {
                        if (typeof value === 'string') {
                            metadataHTML += `
                                <div class="metadata-item">
                                    <div class="metadata-label">${key}:</div>
                                    <div class="metadata-value">${value}</div>
                                </div>`;
                        }
                    }
                }

                metadataHTML += `</div>`;

            }

            // EXIF данные
            if (metadata.exif && Object.keys(metadata.exif).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4>EXIF данные</h4>`;

                for (const [key, value] of Object.entries(metadata.exif)) {
                    if (typeof value !== 'object') {
                        metadataHTML += `
                            <div class="metadata-item">
                                <div class="metadata-label">${key}:</div>
                                <div class="metadata-value">${value}</div>
                            </div>`;
                    }
                }

                metadataHTML += `</div>`;
            }

            // PNG информация
            if (metadata.png_info && Object.keys(metadata.png_info).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4 data-i18n="png_metadata">${__("png_metadata")}</h4>`;

                for (const [key, value] of Object.entries(metadata.png_info)) {
                    if (key !== 'parameters') {
                        metadataHTML += `
                            <div class="metadata-item">
                                <div class="metadata-label">${key}:</div>
                                <div class="metadata-value">${value}</div>
                            </div>`;
                    }
                }

                metadataHTML += `</div>`;
            }

            metadataPanel.innerHTML = metadataHTML;
            updatePageTranslations();
        } catch (error) {
            console.error('Ошибка при загрузке метаданных:', error);
            metadataPanel.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || __("metadata_load_error")}</p>
                <p data-i18n="unsupported_or_corrupt_file">Возможно формат изображения не поддерживается или файл поврежден.</p>
            </div>`;

            // Здесь нужно вызвать updatePageTranslations чтобы обновить переводы в новых элементах
            updatePageTranslations();
        }


    }

    function isImageInCollection(collectionId, imageRootName, dir, filename) {
        if (!collections[collectionId]) return false;

        // Новый формат с корневой директорией
        const newFormatId = `${imageRootName}:${dir}/${filename}`;
        // Старый формат для обратной совместимости
        const oldFormatId = `${dir}/${filename}`;

        return collections[collectionId].images.includes(newFormatId) ||
            collections[collectionId].images.includes(oldFormatId);
    }
    function isImageInAnyCollection(imageRootName, dir, filename) {
        // Проверяем во всех коллекциях
        for (const [collectionId, collection] of Object.entries(collections)) {
            // Новый формат с корневой директорией
            const newFormatId = `${imageRootName}:${dir}/${filename}`;
            // Старый формат для обратной совместимости
            const oldFormatId = `${dir}/${filename}`;

            if (collection.images.includes(newFormatId) || collection.images.includes(oldFormatId)) {
                return true;
            }
        }
        return false;
    }

    // Показать модальное окно выбора коллекции
    function showSelectCollectionModal(dir, filename, rootName = null) {
        // Если rootName не указан, используем текущую
        const imageRootName = rootName || currentRootName;

        // Сохраняем текущее изображение во временных переменных
        tempDir = dir;
        tempFilename = filename;
        tempRootName = imageRootName;

        // Формируем идентификатор изображения
        const imageId = `${imageRootName}:${dir}/${filename}`;

        // Обновляем список коллекций в модальном окне
        collectionsListModal.innerHTML = '';

        // Добавляем стандартную коллекцию "Избранное"
        const favoritesItem = document.createElement('div');
        favoritesItem.className = 'collection-item-modal';

        // Проверяем, есть ли изображение в коллекции "Избранное"
        const isInFavorites = isImageInCollection('favorites', imageRootName, dir, filename);

        favoritesItem.innerHTML = `
    <i class="fas fa-${isInFavorites ? 'check-circle' : 'star'} ${isInFavorites ? 'collection-active-icon' : ''}"></i>
    <span>${__("favorites")}</span>
`;

        // Если изображение уже в коллекции, добавляем класс для выделения
        if (isInFavorites) {
            favoritesItem.classList.add('collection-item-active');
        }

        favoritesItem.addEventListener('click', () => {
            toggleImageInCollection('favorites', dir, filename);
            selectCollectionModal.style.display = 'none';
        });

        collectionsListModal.appendChild(favoritesItem);

        // Добавляем пользовательские коллекции
        for (const [id, collection] of Object.entries(collections)) {
            if (id === 'favorites') continue;

            const isInCollection = isImageInCollection(id, imageRootName, dir, filename);

            const collectionItem = document.createElement('div');
            collectionItem.className = 'collection-item-modal';

            // Если изображение уже в коллекции, добавляем класс для выделения
            if (isInCollection) {
                collectionItem.classList.add('collection-item-active');
            }

            collectionItem.innerHTML = `
                <i class="fas fa-${isInCollection ? 'check-circle' : 'folder'} ${isInCollection ? 'collection-active-icon' : ''}"></i>
                <span>${collection.name}</span>
            `;

            collectionItem.addEventListener('click', () => {
                toggleImageInCollection(id, dir, filename);
                selectCollectionModal.style.display = 'none';
            });

            collectionsListModal.appendChild(collectionItem);
        }

        // Показываем модальное окно
        selectCollectionModal.style.display = 'block';
    }
    // Добавление/удаление изображения из коллекции
    async function toggleImageInCollection(collectionId, dir, filename) {
        // Создаем идентификатор изображения, включающий имя корневой директории
        const imageId = `${currentRootName}:${dir}/${filename}`;
        const isInCollection = collections[collectionId].images.includes(imageId);

        try {
            const response = await fetch('/api/collections/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: isInCollection ? 'remove' : 'add',
                    collection_id: collectionId,
                    root: currentRootName,
                    dir,
                    filename
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Получаем имя коллекции
                const collectionName = collections[collectionId].name;

                if (isInCollection) {
                    // Удаляем из коллекции
                    collections[collectionId].images = collections[collectionId].images.filter(id => id !== imageId);

                    // Если это была коллекция "Избранное", обновляем список избранного
                    if (collectionId === 'favorites') {
                        favorites = collections.favorites.images;
                    }

                    // Если мы просматриваем эту коллекцию, обновляем отображение
                    if (currentFilter === collectionId) {
                        showCollectionImages(collectionId);
                    }

                    // Обновляем иконку избранного для всех соответствующих изображений
                    if (collectionId === 'favorites') {
                        document.querySelectorAll('.image-item').forEach(el => {
                            if (el.dataset.filename === filename) {
                                const icon = el.querySelector('.favorite-icon');
                                icon.classList.remove('favorited');
                            }
                        });
                    }

                    // Показываем уведомление с переводом
                    const message = __('image_removed_from_collection').replace('{collection}', collectionName);
                    showToast(message);
                } else {
                    // Добавляем в коллекцию
                    collections[collectionId].images.push(imageId);

                    // Если это была коллекция "Избранное", обновляем список избранного
                    if (collectionId === 'favorites') {
                        favorites = collections.favorites.images;
                    }

                    // Обновляем иконку избранного для всех соответствующих изображений
                    if (collectionId === 'favorites') {
                        document.querySelectorAll('.image-item').forEach(el => {
                            if (el.dataset.filename === filename) {
                                const icon = el.querySelector('.favorite-icon');
                                icon.classList.add('favorited');
                            }
                        });
                    }

                    // Показываем уведомление с переводом
                    const message = __('image_added_to_collection').replace('{collection}', collectionName);
                    showToast(message);
                }
            }
        } catch (error) {
            console.error('Ошибка при обновлении коллекции:', error);
            showToast('Ошибка при обновлении коллекции');
        }
    }
    // Создание новой коллекции
    async function createCollection() {
        const name = collectionName.value.trim();

        if (!name) {
            alert(__("enter_collection_name"));
            return;
        }

        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            const result = await response.json();

            if (result.success) {
                // Добавляем новую коллекцию в список
                collections[result.collection_id] = {
                    name,
                    images: []
                };

                // Обновляем список коллекций
                updateCollectionsInSidebar();

                // Закрываем модальное окно создания коллекции
                collectionModal.style.display = 'none';

                // Очищаем поле ввода
                collectionName.value = '';

                showToast(__("collection_created_successfully"));

                // Если у нас есть временные данные об изображении, 
                // показываем снова окно выбора коллекции
                if (tempDir && tempFilename) {
                    showSelectCollectionModal(tempDir, tempFilename);
                }
            } else {
                showToast('Ошибка при создании коллекции');
            }
        } catch (error) {
            console.error('Ошибка при создании коллекции:', error);
            showToast('Ошибка при создании коллекции');
        }
    }

    // Обновление коллекции
    async function updateCollectionName() {
        const name = collectionName.value.trim();

        if (!name) {
            alert(__("enter_collection_name"));
            return;
        }

        if (!editingCollectionId) {
            console.error('ID редактируемой коллекции не задан');
            return;
        }

        try {
            const response = await fetch(`/api/collections/${editingCollectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            const result = await response.json();

            if (result.success) {
                // Обновляем название коллекции
                collections[editingCollectionId].name = name;

                // Обновляем список коллекций
                updateCollectionsInSidebar();

                // Закрываем модальное окно
                collectionModal.style.display = 'none';

                // Сбрасываем ID редактируемой коллекции
                editingCollectionId = null;

                showToast(__("collection_updated_successfully"));
            } else {
                showToast(__("collection_update_error"));
            }
        } catch (error) {
            console.error('Ошибка при обновлении коллекции:', error);
            showToast(__("collection_update_error"));
        }
    }

    // Редактирование коллекции
    function editCollection(collectionId) {
        if (!collections[collectionId]) {
            console.error('Коллекция не найдена:', collectionId);
            return;
        }

        // Устанавливаем ID редактируемой коллекции
        editingCollectionId = collectionId;

        // Заполняем поле ввода
        collectionName.value = collections[collectionId].name;

        // Обновляем заголовок модального окна
        collectionModalTitle.textContent = __("edit_collection");

        // Обновляем текст кнопки
        saveCollectionButton.textContent = __("save");

        // Показываем модальное окно
        collectionModal.style.display = 'block';
    }

    // Удаление коллекции
    async function deleteCollection(collectionId) {
        if (!collections[collectionId]) {
            console.error('Коллекция не найдена:', collectionId);
            return;
        }

        if (!confirm(__("confirm_delete_collection").replace("{collection}", collections[collectionId].name))) {
            return;
        }

        try {
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                // Удаляем коллекцию из списка
                delete collections[collectionId];

                // Если мы просматривали эту коллекцию, переключаемся на "Все изображения"
                if (currentFilter === collectionId) {
                    currentFilter = 'all';

                    // Обновляем UI
                    filterOptions.forEach(opt => opt.classList.remove('active'));
                    document.querySelector('.filter-option[data-filter="all"]').classList.add('active');

                    // Если есть текущая директория, показываем её
                    if (currentDirectory) {
                        selectDirectory(currentDirectory);
                    } else {
                        // Иначе показываем пустое состояние
                        galleryContainer.innerHTML = `<div class="empty-state">
                        <i class="fas fa-image"></i>
                        <p data-i18n="select_folder">${__("select_folder")}</p>
                    </div>`;
                    }
                }

                // Обновляем список коллекций
                updateCollectionsInSidebar();

                showToast(__("collection_deleted_successfully"));
            } else {
                showToast(__("collection_delete_error_with_reason").replace("{error}", result.error || __("unknown_error")));
            }
        } catch (error) {
            console.error('Ошибка при удалении коллекции:', error);
            showToast(__("collection_delete_error"));
        }
    }

    // Выбор директории
    async function selectDirectory(dir) {
        currentDirectory = dir;

        // Сохраняем текущую директорию
        try {
            if (window.pywebview && window.pywebview.api) {
                // Для десктопной версии
                await window.pywebview.api.set_config('current_directory', dir);
            } else {
                // Для браузерной версии
                // Формируем запрос на сохранение текущей директории
                await fetch(`/api/config/set/current_directory/${encodeURIComponent(dir)}`);
                localStorage.setItem('sdGalleryCurrentDirectory', dir);
            }
        } catch (e) {
            console.error("Failed to save current directory:", e);
            localStorage.setItem('sdGalleryCurrentDirectory', dir);
        }

        // Обновляем активную директорию в UI
        document.querySelectorAll('.folder-name').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.dir === dir) {
                el.classList.add('active');
            }
        });

        // Отображаем загрузочный спиннер
        galleryContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        try {
            let url = `/api/images?dir=${encodeURIComponent(dir)}`;
            if (rootDirectory) {
                url += `&root=${encodeURIComponent(rootDirectory)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось загрузить изображения');
            }

            const images = await response.json();

            if (images.length === 0) {
                galleryContainer.innerHTML = `<div class="empty-state">    <i class="fas fa-image"></i>    
                <p data-i18n="no_images_in_folder">${__("no_images_in_folder")}</p>
                </div>`;
                return;
            }

            // Очищаем галерею и добавляем изображения
            galleryContainer.innerHTML = '';

            // Если это корневая директория, добавляем информационное сообщение
            if (dir === '') {
                const rootInfoMessage = document.createElement('div');
                rootInfoMessage.className = 'root-directory-info';
                rootInfoMessage.innerHTML = `<i class="fas fa-info-circle"></i> <span data-i18n="viewing_root_directory">${__("viewing_root_directory")}</span>`;
                galleryContainer.appendChild(rootInfoMessage);
            }

            images.forEach(filename => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.filename = filename;

                const img = document.createElement('img');
                let imgUrl = `/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}`;
                if (rootDirectory) {
                    imgUrl += `&root=${encodeURIComponent(rootDirectory)}`;
                }
                img.src = imgUrl;
                img.alt = filename;
                img.loading = 'lazy';

                const favoriteIcon = document.createElement('i');
                favoriteIcon.className = 'fas fa-star favorite-icon';
                // Проверяем, находится ли изображение в любой коллекции
                if (isImageInAnyCollection(currentRootName, dir, filename)) {
                    favoriteIcon.classList.add('favorited');
                }

                favoriteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showSelectCollectionModal(dir, filename);
                });

                imageItem.appendChild(img);
                imageItem.appendChild(favoriteIcon);

                imageItem.addEventListener('click', () => {
                    selectImage(dir, filename);
                });

                galleryContainer.appendChild(imageItem);
            });
        } catch (error) {
            console.error('Ошибка при загрузке изображений:', error);
            galleryContainer.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>${error.message || 'Ошибка при загрузке изображений'}</p>
        </div>`;
        }
    }



    // Выбор изображения и отображение метаданных
    async function selectImage(dir, filename) {
        // Обновляем выбранное изображение в UI
        document.querySelectorAll('.image-item').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.filename === filename) {
                el.classList.add('selected');
            }
        });

        selectedImage = { dir, filename };

        // Отображаем загрузочный спиннер
        metadataPanel.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        try {
            let url = `/api/metadata?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}`;
            if (rootDirectory) {
                url += `&root=${encodeURIComponent(rootDirectory)}`;
            }

            const response = await fetch(url);
            const metadata = await response.json();

            console.log("Полученные метаданные:", metadata);

            // Формируем панель метаданных
            let metadataHTML = `
                <div class="image-preview">
    <img src="/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}${rootDirectory ? `&root=${encodeURIComponent(rootDirectory)}` : ''}" 
         alt="${filename}"
         onclick="document.getElementById('imageModal').style.display='block'; document.getElementById('modalImage').src='/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}${rootDirectory ? `&root=${encodeURIComponent(rootDirectory)}` : ''}'">
    <div class="image-actions">
        <button onclick="document.getElementById('imageModal').style.display='block'; document.getElementById('modalImage').src='/api/image?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}${rootDirectory ? `&root=${encodeURIComponent(rootDirectory)}` : ''}'">
            <i class="fas fa-search-plus"></i> <span data-i18n="zoom_in">Увеличить</span>
        </button>
    </div>
</div>
                
                <h3>${filename}</h3>
            `;

            // Основная информация
            metadataHTML += `
                <div class="metadata-group">
    <h4 data-i18n="basic_info">Основная информация</h4>
    <div class="metadata-item">
        <div class="metadata-label" data-i18n="size">Размер:</div>
        <div class="metadata-value">${metadata.dimensions}</div>
    </div>
    <div class="metadata-item">
        <div class="metadata-label" data-i18n="format">Формат:</div>
        <div class="metadata-value">${metadata.format}</div>
    </div>
</div>
            `;

            // Информация Stable Diffusion
            if (metadata.stable_diffusion && Object.keys(metadata.stable_diffusion).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4 data-i18n="stable_diffusion_params">${__("stable_diffusion_params")}</h4>`;

                // Пытаемся использовать структурированные данные или анализируем raw_parameters
                if (metadata.stable_diffusion.raw_parameters) {
                    const parsedHTML = parseSDParams(metadata.stable_diffusion.raw_parameters);
                    if (parsedHTML) {
                        metadataHTML += parsedHTML;
                    } else {
                        // Если не удалось разобрать, показываем как есть
                        metadataHTML += `
                            <div class="metadata-section">
                                <h5>Все параметры:</h5>
                                <div class="metadata-value-block">
                                    <div class="copyable-text">${metadata.stable_diffusion.raw_parameters}</div>
                                    <button class="copy-button" onclick="copyToClipboard('${metadata.stable_diffusion.raw_parameters.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
                                        <i class="fas fa-copy"></i> Копировать
                                    </button>
                                </div>
                            </div>`;
                    }
                } else {
                    // Если нет параметров, показываем то, что есть
                    for (const [key, value] of Object.entries(metadata.stable_diffusion)) {
                        if (typeof value === 'string') {
                            metadataHTML += `
                                <div class="metadata-item">
                                    <div class="metadata-label">${key}:</div>
                                    <div class="metadata-value">${value}</div>
                                </div>`;
                        }
                    }
                }

                metadataHTML += `</div>`;
            }

            // EXIF данные
            if (metadata.exif && Object.keys(metadata.exif).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4>EXIF данные</h4>`;

                for (const [key, value] of Object.entries(metadata.exif)) {
                    if (typeof value !== 'object') {
                        metadataHTML += `
                            <div class="metadata-item">
                                <div class="metadata-label">${key}:</div>
                                <div class="metadata-value">${value}</div>
                            </div>`;
                    }
                }

                metadataHTML += `</div>`;
            }

            // PNG информация
            if (metadata.png_info && Object.keys(metadata.png_info).length > 0) {
                metadataHTML += `<div class="metadata-group"><h4 data-i18n="png_metadata">${__("png_metadata")}</h4>`;

                for (const [key, value] of Object.entries(metadata.png_info)) {
                    if (key !== 'parameters') {
                        metadataHTML += `
                            <div class="metadata-item">
                                <div class="metadata-label">${key}:</div>
                                <div class="metadata-value">${value}</div>
                            </div>`;
                    }
                }

                metadataHTML += `</div>`;
            }

            metadataPanel.innerHTML = metadataHTML;
            updatePageTranslations();
        } catch (error) {
            console.error('Ошибка при загрузке метаданных:', error);
            metadataPanel.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || __("metadata_load_error")}</p>
                <p data-i18n="unsupported_or_corrupt_file">Возможно формат изображения не поддерживается или файл поврежден.</p>
            </div>`;

            // Здесь нужно вызвать updatePageTranslations чтобы обновить переводы в новых элементах
            updatePageTranslations();
        }
    }


    // Обработчик переключения фильтров
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            const filter = option.dataset.filter;

            // Обновляем UI
            filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            currentFilter = filter;

            if (filter === 'all' && currentDirectory) {
                // Возвращаемся к просмотру текущей директории
                selectDirectory(currentDirectory);
            } else if (filter === 'favorites') {
                // Показываем избранные изображения
                showFavorites();
            }
        });
    });

    // Загрузка корневых директорий
    async function loadRootDirectories() {
        try {
            const response = await fetch('/api/root_directories');

            if (response.ok) {
                rootDirectories = await response.json();
                console.log("Loaded root directories:", rootDirectories);

                // Получаем текущую выбранную директорию
                const currentRootResponse = await fetch('/api/current_root');
                const currentRootData = await currentRootResponse.json();
                currentRootName = currentRootData.current_root;

                // Обновляем селектор
                updateRootDirectorySelector();
            } else {
                console.error("Failed to load root directories");
            }
        } catch (error) {
            console.error("Error loading root directories:", error);
        }
    }

    // Обновление селектора корневых директорий
    function updateRootDirectorySelector() {
        // Очищаем селектор
        rootDirectorySelector.innerHTML = `<option value="" data-i18n="choose_directory">${__("choose_directory")}</option>`;

        // Добавляем опции для каждой директории
        for (const [name, path] of Object.entries(rootDirectories)) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            rootDirectorySelector.appendChild(option);
        }

        // Устанавливаем выбранную директорию
        if (currentRootName && rootDirectorySelector.querySelector(`option[value="${currentRootName}"]`)) {
            rootDirectorySelector.value = currentRootName;
        }

        // Обновляем кастомный селект, если он уже был создан
        const customSelect = document.querySelector(`.custom-select[data-for="${rootDirectorySelector.id}"]`);
        if (customSelect) {
            // Удаляем старый кастомный селект
            customSelect.remove();
            // Показываем оригинальный селект
            rootDirectorySelector.style.display = '';
            // Создаем новый кастомный селект
            createCustomSelect(rootDirectorySelector);
        }
    }

    // Переключение корневой директории
    async function switchRootDirectory(name) {
        if (name && rootDirectories[name]) {
            try {
                const response = await fetch(`/api/set_current_root/${encodeURIComponent(name)}`);

                if (response.ok) {
                    currentRootName = name;
                    rootDirectory = rootDirectories[name]; // Устанавливаем текущий путь

                    // Загружаем директории для нового пути
                    loadDirectories();
                } else {
                    console.error("Failed to switch root directory");
                }
            } catch (error) {
                console.error("Error switching root directory:", error);
            }
        }
    }

    // Отображение модального окна настроек
    function showSettingsModal() {
        settingsModal.style.display = 'block';
        updateRootDirectoriesListInSettings();
    }

    // Обновление списка корневых директорий в настройках
    function updateRootDirectoriesListInSettings() {
        rootDirectoriesList.innerHTML = '';

        if (Object.keys(rootDirectories).length === 0) {
            rootDirectoriesList.innerHTML = '<p>Нет добавленных директорий</p>';
            return;
        }

        for (const [name, path] of Object.entries(rootDirectories)) {
            const directoryItem = document.createElement('div');
            directoryItem.className = 'root-directory-item';

            directoryItem.innerHTML = `
            <div class="directory-info">
                <div class="directory-name">${name}</div>
                <div class="directory-path">${path}</div>
            </div>
            <div class="directory-actions">
                <button class="edit-button" data-name="${name}"><i class="fas fa-edit"></i></button>
                <button class="remove-button" data-name="${name}"><i class="fas fa-trash"></i></button>
            </div>
        `;

            // Добавляем обработчики событий
            const removeButton = directoryItem.querySelector('.remove-button');
            removeButton.addEventListener('click', () => removeRootDirectory(name));

            const editButton = directoryItem.querySelector('.edit-button');
            editButton.addEventListener('click', () => editRootDirectory(name, path));

            rootDirectoriesList.appendChild(directoryItem);
        }
    }

    // Удаление корневой директории
    async function removeRootDirectory(name) {
        if (confirm(`Вы уверены, что хотите удалить директорию "${name}"?`)) {
            try {
                const response = await fetch(`/api/remove_root_directory/${encodeURIComponent(name)}`);

                if (response.ok) {
                    delete rootDirectories[name];

                    // Если удалили текущую директорию, выбираем другую
                    if (currentRootName === name) {
                        if (Object.keys(rootDirectories).length > 0) {
                            currentRootName = Object.keys(rootDirectories)[0];
                            rootDirectory = rootDirectories[currentRootName];
                        } else {
                            currentRootName = '';
                            rootDirectory = '';
                        }

                        // Обновляем селектор
                        updateRootDirectorySelector();

                        // Перезагружаем директории
                        loadDirectories();
                    }

                    // Обновляем список в настройках
                    updateRootDirectoriesListInSettings();

                    showToast('Директория успешно удалена');
                } else {
                    console.error("Failed to remove root directory");
                    showToast('Ошибка при удалении директории');
                }
            } catch (error) {
                console.error("Error removing root directory:", error);
                showToast('Ошибка при удалении директории');
            }
        }
    }

    // Редактирование корневой директории
    function editRootDirectory(name, path) {
        newDirectoryName.value = name;
        newDirectoryPath.value = path;

        // Меняем текст кнопки на "Сохранить"
        addDirectoryButton.textContent = 'Сохранить';
        addDirectoryButton.dataset.editMode = 'true';
        addDirectoryButton.dataset.originalName = name;
    }

    // Добавление новой корневой директории
    async function addRootDirectory() {
        const name = newDirectoryName.value.trim();
        const path = normalizePath(newDirectoryPath.value.trim());

        if (!name) {
            alert('Пожалуйста, введите название директории');
            return;
        }

        if (!path) {
            alert('Пожалуйста, введите путь к директории');
            return;
        }

        // Проверяем, не находимся ли мы в режиме редактирования
        const editMode = addDirectoryButton.dataset.editMode === 'true';
        const originalName = addDirectoryButton.dataset.originalName;

        // Если не редактируем и такое имя уже существует
        if (!editMode && rootDirectories[name]) {
            alert('Директория с таким названием уже существует');
            return;
        }

        try {
            // Если редактируем, сначала удаляем старую директорию
            if (editMode && originalName !== name) {
                await fetch(`/api/remove_root_directory/${encodeURIComponent(originalName)}`);
            }

            // Добавляем новую директорию
            const response = await fetch(`/api/add_root_directory/${encodeURIComponent(name)}/${encodeURIComponent(path)}`);

            if (response.ok) {
                rootDirectories[name] = path;

                // Если это первая директория, устанавливаем её как текущую
                if (!currentRootName || (editMode && originalName === currentRootName)) {
                    currentRootName = name;
                    rootDirectory = path;
                }

                // Обновляем селектор и список в настройках
                updateRootDirectorySelector();
                updateRootDirectoriesListInSettings();

                // Сбрасываем форму
                newDirectoryName.value = '';
                newDirectoryPath.value = '';
                addDirectoryButton.textContent = 'Добавить';
                addDirectoryButton.dataset.editMode = 'false';
                delete addDirectoryButton.dataset.originalName;

                // ДОБАВЛЯЕМ: Запуск индексации после добавления директории
                startIndexing();

                showToast(editMode ? 'Директория успешно обновлена' : 'Директория успешно добавлена');

                // Если это была первая директория, загружаем директории
                if (Object.keys(rootDirectories).length === 1) {
                    loadDirectories();
                }
            } else {
                console.error("Failed to add root directory");
                showToast('Ошибка при добавлении директории');
            }
        } catch (error) {
            console.error("Error adding root directory:", error);
            showToast('Ошибка при добавлении директории');
        }
    }

    // Функция для нормализации пути перед отправкой на сервер
    function normalizePath(path) {
        console.log("Normalizing path:", path);

        // Удаляем лишние кавычки, если они есть
        if (path.startsWith('"') && path.endsWith('"')) {
            path = path.substring(1, path.length - 1);
            console.log("Removed quotes:", path);
        }

        // Удаляем лишние символы, которые могли быть случайно добавлены
        if (path.endsWith('/}')) {
            path = path.substring(0, path.length - 2);
            console.log("Removed trailing /}:", path);
        }

        // Другие возможные исправления...

        return path;
    }


    // Закрытие модального окна
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Закрытие модального окна по клику вне изображения
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Инициализация приложения 
    async function init() {
        console.log("Init: Loading configuration...");

        try {
            // Загружаем корневые директории
            await loadRootDirectories();

            // Проверяем, есть ли выбранная директория
            if (currentRootName && rootDirectories[currentRootName]) {
                rootDirectory = rootDirectories[currentRootName];
            } else if (Object.keys(rootDirectories).length > 0) {
                // Если нет выбранной, но есть хотя бы одна директория, выбираем первую
                currentRootName = Object.keys(rootDirectories)[0];
                rootDirectory = rootDirectories[currentRootName];
                // Сохраняем выбор
                await fetch(`/api/set_current_root/${encodeURIComponent(currentRootName)}`);
            } else {
                // Если нет директорий, показываем диалог выбора пути
                showPathSelectionPopup();
                // НЕ делаем return, чтобы инициализировать кастомный селект
            }

            // Запускаем индексацию метаданных
            startIndexing();

            // Запускаем периодическую проверку статуса индексации
            indexingCheckInterval = setInterval(checkIndexingStatus, 1000);

            // Загружаем коллекции
            await loadCollections();

            // Загружаем директории
            await loadDirectories();

            // Флаг для отслеживания, была ли открыта директория
            let directoryOpened = false;

            // Получаем текущую директорию из конфигурации
            try {
                const configResponse = await fetch('/api/config/get');
                const config = await configResponse.json();

                if (config.current_directory) {
                    currentDirectory = config.current_directory;

                    // Проверяем, существует ли директория в текущем состоянии
                    const dirExists = document.querySelector(`.folder-name[data-dir="${currentDirectory}"]`);

                    if (dirExists) {
                        console.log(`Восстановление последней директории: ${currentDirectory}`);
                        selectDirectory(currentDirectory);
                        directoryOpened = true;
                    } else {
                        console.log(`Директория ${currentDirectory} не найдена в текущем состоянии.`);
                    }
                }
            } catch (e) {
                console.error("Ошибка при получении конфигурации:", e);
            }

            // Если не удалось восстановить директорию из конфигурации или она не существует
            // Проверяем localStorage как запасной вариант
            if (!directoryOpened) {
                const savedDir = localStorage.getItem('sdGalleryCurrentDirectory');
                if (savedDir) {
                    const dirExists = document.querySelector(`.folder-name[data-dir="${savedDir}"]`);
                    if (dirExists) {
                        console.log(`Восстановление директории из localStorage: ${savedDir}`);
                        selectDirectory(savedDir);
                        directoryOpened = true;
                    }
                }
            }

            // Если ничего не найдено, показываем пустое состояние
            if (!directoryOpened) {
                galleryContainer.innerHTML = `<div class="empty-state">
                    <i class="fas fa-image"></i>
                    <p data-i18n="select_folder">${__("select_folder")}</p>
                </div>`;
            }

            // Инициализируем переводы
            updatePageTranslations();

            // ВСЕГДА инициализируем кастомные селекты
            console.log("Инициализация кастомных селектов...");
            setTimeout(() => {
                initCustomSelects();
                console.log("Кастомные селекты инициализированы");
            }, 20); // Увеличиваем задержку до 1 секунды

        } catch (error) {
            console.error("Error during initialization:", error);
            showPathSelectionPopup();

            // Даже при ошибке инициализируем кастомные селекты
            setTimeout(initCustomSelects, 20);
        }
    }
    // Обработчик для селектора корневых директорий
    rootDirectorySelector.addEventListener('change', () => {
        const selectedName = rootDirectorySelector.value;
        if (selectedName) {
            switchRootDirectory(selectedName);
        }
    });

    // Обработчик для кнопки настроек
    settingsButton.addEventListener('click', showSettingsModal);

    // Закрытие модального окна настроек
    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Закрытие модального окна по клику вне содержимого
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Обработчик для кнопки добавления директории
    addDirectoryButton.addEventListener('click', addRootDirectory);

    // обработчик для кнопки выбора директории
    browseDirectoryButton.addEventListener('click', async () => {
        if (window.pywebview && window.pywebview.api) {
            try {
                const directory = await window.pywebview.api.select_folder();
                if (directory) {
                    newDirectoryPath.value = directory;
                }
            } catch (error) {
                console.error("Error selecting folder:", error);
            }
        } else {
            alert('Выбор директории доступен только в десктопной версии приложения');
        }
    });
    // Обработчик для кнопки добавления коллекции
    addCollectionButton.addEventListener('click', () => {
        // Сбрасываем ID редактируемой коллекции
        editingCollectionId = null;

        // Очищаем поле ввода
        collectionName.value = '';

        // Обновляем заголовок модального окна
        collectionModalTitle.textContent = __("new_collection");

        // Обновляем текст кнопки
        saveCollectionButton.textContent = __("create");

        // Показываем модальное окно
        collectionModal.style.display = 'block';
    });

    // Закрытие модального окна коллекций
    closeCollection.addEventListener('click', () => {
        collectionModal.style.display = 'none';
    });

    // Закрытие модального окна по клику вне содержимого
    window.addEventListener('click', (e) => {
        if (e.target === collectionModal) {
            collectionModal.style.display = 'none';
        }

        if (e.target === selectCollectionModal) {
            selectCollectionModal.style.display = 'none';
        }
    });

    // Обработчик для кнопки сохранения коллекции
    saveCollectionButton.addEventListener('click', () => {
        if (editingCollectionId) {
            updateCollectionName();
        } else {
            createCollection();
        }
    });

    // Обработчик для кнопки отмены
    cancelCollectionButton.addEventListener('click', () => {
        collectionModal.style.display = 'none';
    });

    // Закрытие модального окна выбора коллекции
    closeSelectCollection.addEventListener('click', () => {
        selectCollectionModal.style.display = 'none';
    });

    // Обработчик для кнопки создания новой коллекции в модальном окне выбора
    newCollectionInModalButton.addEventListener('click', () => {
        // Закрываем модальное окно выбора
        selectCollectionModal.style.display = 'none';

        // Открываем модальное окно создания коллекции
        addCollectionButton.click();
    });
    // Обработчики для поиска
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();

        // Показываем/скрываем значок очистки
        if (query) {
            clearSearchIcon.classList.add('visible');
        } else {
            clearSearchIcon.classList.remove('visible');
        }

        // Отменяем предыдущий таймаут
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Устанавливаем таймаут для выполнения поиска
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500); // Задержка 500 мс
    });

    // Обработчик для очистки поиска
    clearSearchIcon.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchIcon.classList.remove('visible');

        // Отменяем поиск
        if (searchController) {
            searchController.abort();
            searchController = null;
        }

        // Возвращаемся к просмотру всех изображений
        if (currentFilter === 'search') {
            currentFilter = 'all';
            filterOptions.forEach(opt => {
                if (opt.dataset.filter === 'all') {
                    opt.classList.add('active');
                }
            });

            if (currentDirectory) {
                selectDirectory(currentDirectory);
            } else {
                galleryContainer.innerHTML = `<div class="empty-state">
                    <i class="fas fa-image"></i>
                    <p data-i18n="select_folder">${__("select_folder")}</p>
                </div>`;
            }
        }
    });

    // Обработчик нажатия Enter в поле поиска
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // Отменяем таймаут, если есть
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    searchTimeout = null;
                }

                // Выполняем поиск немедленно
                performSearch(query);
            }
        }
    });

    document.addEventListener('languageChanged', function (event) {
        console.log('Получено событие смены языка:', event.detail.language);
        // Обновляем коллекции при смене языка
        updateCollectionsInSidebar();
    });

    init();
});