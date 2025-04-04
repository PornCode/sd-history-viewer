# Инструкция по установке и запуску приложения

## Описание

Это приложение представляет собой просмотрщик изображений с поддержкой отображения метаданных генерации. Часто бывает, что при генерации изображений в Stable Diffusion вы забываете, какие именно параметры использовали. Данное приложение позволяет удобно просматривать изображения из указанной директории (обычно это `/Users/PornCode/stable-diffusion-webui-forge/outputs`) и её вложенных папок, отображая при выборе изображения промт, негативный промт и все остальные метаданные, связанные с генерацией.

Вы можете добавить несколько разных директорий (например, для Stable Diffusion и ComfyUI) и переключаться между ними прямо из интерфейса приложения. Реализован поиск изображений по метаданным с предварительной индексацией, которая запускается автоматически при добавлении директории. При повторных запусках индекс будет автоматически обновляться при добавлении новых файлов.

Репозиторий проекта: [https://github.com/PornCode/sd-history-viewer](https://github.com/PornCode/sd-history-viewer)

## Требования

- Python версии 3.8 и выше
- Браузер для запуска веб-версии

## Установка и запуск

### Windows

#### Установка

1. Склонируйте репозиторий и перейдите в папку проекта:
```
git clone https://github.com/PornCode/sd-history-viewer
cd sd-history-viewer
```

2. Запустите файл установки зависимостей:
```
install.bat
```

#### Запуск веб-приложения

Запустите файл `run_web_app.bat`. Приложение автоматически откроется по адресу [http://127.0.0.1:5001](http://127.0.0.1:5001).

#### Запуск десктопного приложения

Запустите файл `run_desktop_app.bat`.

### macOS / Linux

#### Установка

1. Склонируйте репозиторий и перейдите в папку проекта:
```bash
git clone https://github.com/PornCode/sd-history-viewer
cd sd-history-viewer
```

2. Установите зависимости и подготовьте файлы для запуска:
```bash
chmod +x install.sh
./install.sh
```

#### Запуск веб-приложения

Запустите скрипт:
```bash
./run_web_app.sh
```
Приложение автоматически откроется в браузере по адресу [http://127.0.0.1:5001](http://127.0.0.1:5001).

#### Запуск десктопного приложения

Запустите скрипт:
```bash
./run_desktop_app.sh
```

## Дополнительно

Если возникнут проблемы с запуском приложения, убедитесь, что зависимости корректно установлены и версия Python соответствует требованиям.

---

Чтобы отправить сообщение разработчику или поддержать проект донатом (что очень приветствуется), воспользуйтесь [Telegram-ботом](https://t.me/create_donations_bot?start=github).

---
![Preview](https://raw.githubusercontent.com/PornCode/assets/main/sd-history-viewer/prew_screen.png)
