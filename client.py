import websocket
import json
import threading
import time
import os
import pyautogui
import random
try:
    from pynput.mouse import Controller as MouseController
    mouse = MouseController()
except:
    mouse = None

# Конфигурация
SERVER_URL = "wss://your-app-name.onrender.com"  # заменить на реальный URL Render
ROOM_CODE = input("Введите код комнаты (4 цифры): ")

def on_message(ws, message):
    data = json.loads(message)
    if 'command' in data:
        cmd = data['command']
        print(f"Получена команда: {cmd}")
        execute_command(cmd)

def on_error(ws, error):
    print(f"Ошибка: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Соединение закрыто")

def on_open(ws):
    # Регистрируемся на сервере
    ws.send(json.dumps({"type": "register", "room": ROOM_CODE}))

def execute_command(cmd):
    """Выполнение команд на компьютере жертвы"""
    try:
        if cmd == "calc":
            os.system("calc")  # Windows
        elif cmd == "notepad":
            os.system("notepad")
        elif cmd == "move_mouse":
            # Сдвинуть мышь на случайное смещение
            x, y = pyautogui.position()
            pyautogui.moveTo(x + random.randint(-100, 100), y + random.randint(-100, 100))
        elif cmd == "type_hello":
            pyautogui.typewrite("С 1 апреля!", interval=0.1)
        elif cmd == "screenshot":
            # Сделать скриншот и сохранить (шутка)
            pyautogui.screenshot("screenshot.png")
        elif cmd == "volume_up":
            # Увеличить громкость (Windows)
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            current = volume.GetMasterVolumeLevelScalar()
            volume.SetMasterVolumeLevelScalar(min(current + 0.1, 1.0), None)
        elif cmd == "volume_down":
            # Уменьшить громкость (Windows)
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            current = volume.GetMasterVolumeLevelScalar()
            volume.SetMasterVolumeLevelScalar(max(current - 0.1, 0.0), None)
        elif cmd == "mute":
            os.system("nircmd mutesysvolume 1")  # требует nircmd, можно заменить другим способом
        elif cmd == "open_browser":
            os.system("start https://www.youtube.com/watch?v=dQw4w9WgXcQ")  # Рикролл
        elif cmd == "invert_colors":
            # Инвертировать цвета (только Windows через magnifier)
            os.system("magnify.exe")
        # Добавьте свои команды
    except Exception as e:
        print(f"Ошибка выполнения команды {cmd}: {e}")

def start_client():
    ws = websocket.WebSocketApp(SERVER_URL,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()

if __name__ == "__main__":
    start_client()
