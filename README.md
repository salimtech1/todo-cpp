# Nura — quick start

Nura is a desktop app for tasks, habits, focus time, journaling, and more.

## Start the app (easiest way)

1. Make sure **Python 3.11 or newer** is installed.
2. Open this folder: `C:\Users\s191q\Downloads\todo-cpp`
3. Double-click **Start Nura.bat**.
4. On the first start, wait while Nura sets itself up. This may take a few minutes and may need an internet connection to install its Python packages.
5. Nura opens in its own desktop window. Add a task or choose a section from the sidebar.
6. When you are finished, close the Nura window. The black command window can then be closed too.

The first setup also needs the **Microsoft Edge WebView2 Runtime**. It is already included with most Windows installations.

## Start it from VS Code

1. Open this `todo-cpp` folder in VS Code.
2. Select **Terminal → Run Task…**.
3. Choose **Run Nura**.

You can also open the actual Nura project folder at `C:\Users\s191q\Downloads\Nura` and double-click its `Start Nura.bat`. The actual app code and full project README are in that folder.

## If Nura does not open

1. Close any old Nura command windows.
2. Confirm Python 3.11+ is installed. In PowerShell, run `py --version`.
3. Double-click **Start Nura.bat** again and read any error shown in the command window.
4. If setup reports that it cannot download packages, connect to the internet and try again.
5. If Windows reports a missing WebView2 Runtime, install the Microsoft Edge WebView2 Runtime, then start Nura again.

Keep the command window open while using Nura; it runs the app locally. Your data is stored on this computer in Nura's SQLite database. Nura is a desktop window, but it is not currently packaged as an `.exe` installer.
