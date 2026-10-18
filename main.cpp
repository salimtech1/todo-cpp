// A simple command-line to-do list in C++17.
// Tasks are saved to tasks.txt so they are still there next time you run it.

#include <fstream>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

struct Task {
    std::string text;
    bool done = false;
};

const std::string FILE_NAME = "tasks.txt";

// File format: one task per line, "0|text" (not done) or "1|text" (done).
void loadTasks(std::vector<Task>& tasks) {
    std::ifstream in(FILE_NAME);
    std::string line;
    while (std::getline(in, line)) {
        if (line.size() < 3 || line[1] != '|') continue;  // skip bad lines
        tasks.push_back({line.substr(2), line[0] == '1'});
    }
}

void saveTasks(const std::vector<Task>& tasks) {
    std::ofstream out(FILE_NAME);
    for (const Task& t : tasks) {
        out << (t.done ? '1' : '0') << '|' << t.text << '\n';
    }
}

void showTasks(const std::vector<Task>& tasks) {
    if (tasks.empty()) {
        std::cout << "\nNo tasks yet.\n";
        return;
    }
    std::cout << "\nYour tasks:\n";
    for (std::size_t i = 0; i < tasks.size(); ++i) {
        std::cout << "  " << i + 1 << ". [" << (tasks[i].done ? 'x' : ' ') << "] "
                  << tasks[i].text << '\n';
    }
}

// Reads a whole number from the user. Returns -1 if they typed something
// that is not a number, and 0 if the input has ended (so the program quits).
int readNumber(const std::string& prompt) {
    std::cout << prompt;
    int n;
    if (!(std::cin >> n)) {
        if (std::cin.eof()) return 0;
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        return -1;
    }
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    return n;
}

int main() {
    std::vector<Task> tasks;
    loadTasks(tasks);

    while (true) {
        std::cout << "\n=== To-Do List ===\n"
                  << "1. Show tasks\n"
                  << "2. Add task\n"
                  << "3. Mark task as done\n"
                  << "4. Delete task\n"
                  << "0. Quit\n";

        int choice = readNumber("Choose: ");
        if (choice == 0) break;

        if (choice == 1) {
            showTasks(tasks);
        } else if (choice == 2) {
            std::cout << "New task: ";
            std::string text;
            std::getline(std::cin, text);
            if (text.empty()) {
                std::cout << "A task can't be empty.\n";
            } else {
                tasks.push_back({text, false});
                saveTasks(tasks);
                std::cout << "Added.\n";
            }
        } else if (choice == 3 || choice == 4) {
            if (tasks.empty()) {
                std::cout << "\nNo tasks yet.\n";
                continue;
            }
            showTasks(tasks);
            int number = readNumber("Task number: ");
            if (number < 1 || number > static_cast<int>(tasks.size())) {
                std::cout << "That number isn't in the list.\n";
                continue;
            }
            std::size_t index = static_cast<std::size_t>(number - 1);
            if (choice == 3) {
                tasks[index].done = true;
                std::cout << "Marked as done.\n";
            } else {
                tasks.erase(tasks.begin() + static_cast<std::ptrdiff_t>(index));
                std::cout << "Deleted.\n";
            }
            saveTasks(tasks);
        } else {
            std::cout << "Please choose a number from the menu.\n";
        }
    }

    saveTasks(tasks);
    std::cout << "Bye!\n";
    return 0;
}
