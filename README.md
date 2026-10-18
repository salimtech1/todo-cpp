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
