# Application Installation and Launch Guide
[🇷🇺 Читать на русском](README_ru.md)
## Description

This application is an image viewer that displays generation metadata. Often, when generating images using Stable Diffusion, you may forget which parameters you used. This application conveniently lets you view images from a specified directory (typically `/Users/PornCode/stable-diffusion-webui-forge/outputs`) and its subfolders. When selecting an image, it displays the prompt, negative prompt, and all associated metadata.

You can add multiple directories (e.g., for Stable Diffusion and ComfyUI) and easily switch between them directly from the application's interface. The app also supports image search using metadata indexing, which automatically initiates upon adding a directory. The index updates automatically upon subsequent launches if new files have been added.

Project repository: [https://github.com/PornCode/sd-history-viewer](https://github.com/PornCode/sd-history-viewer)

## Requirements

- Python 3.8 or higher
- Browser for web version

## Installation and Launch

### Windows

#### Installation

1. Clone the repository and navigate to the project directory:
```
git clone https://github.com/PornCode/sd-history-viewer
cd sd-history-viewer
```

2. Run the dependencies installation file:
```
install.bat
```

#### Launching the Web Application

Run the `run_web_app.bat` file. The application will automatically open at [http://127.0.0.1:5001](http://127.0.0.1:5001).

#### Launching the Desktop Application

Run the `run_desktop_app.bat` file.

### macOS / Linux

#### Installation

1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/PornCode/sd-history-viewer
cd sd-history-viewer
```

2. Install dependencies and prepare launch files:
```bash
chmod +x install.sh
./install.sh
```

#### Launching the Web Application

Run the script:
```bash
./run_web_app.sh
```
The application will automatically open in your browser at [http://127.0.0.1:5001](http://127.0.0.1:5001).

#### Launching the Desktop Application

Run the script:
```bash
./run_desktop_app.sh
```

## Additional Information

If you encounter issues running the application, ensure dependencies are correctly installed and your Python version meets the requirements.

---

To send a message to the developer or support the project with a donation (highly appreciated), please use the [Telegram bot](https://t.me/create_donations_bot?start=github).

---
![Preview](https://raw.githubusercontent.com/PornCode/assets/refs/heads/main/sd-history-viewer/prew_screen.png)

