<<<<<<< HEAD
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
=======
# todo-cpp

A small command-line to-do list written in C++17. Add tasks, mark them done, delete them, and they are saved to a file between runs.

## Features

- Add, list, complete and delete tasks
- Tasks saved automatically to `tasks.txt`
- Handles bad input (letters instead of numbers, empty tasks, wrong task numbers)
- One file, no libraries beyond the C++ standard library

## Build and run

You need a C++ compiler such as `g++` or `clang++`.

```bash
g++ -std=c++17 -Wall -Wextra -o todo main.cpp
./todo
```

On Windows (MinGW), run `todo.exe` instead of `./todo`.

## Example

```
=== To-Do List ===
1. Show tasks
2. Add task
3. Mark task as done
4. Delete task
0. Quit
Choose: 2
New task: Finish calculus homework
Added.
```

```
Your tasks:
  1. [x] Finish calculus homework
  2. [ ] Practice C++ for 30 minutes
```

## How it works

- A `Task` struct holds the text and a `done` flag.
- Tasks live in a `std::vector<Task>` while the program runs.
- `tasks.txt` stores one task per line as `0|text` (not done) or `1|text` (done).

## Ideas to extend it

- Edit an existing task
- Add due dates
- Sort tasks, or show only unfinished ones
- Split the code into `Task.h` / `Task.cpp` and a separate `main.cpp`
- Write a few tests
>>>>>>> e4b99c94b64220538dc07279a8e13e35177a7d4c
