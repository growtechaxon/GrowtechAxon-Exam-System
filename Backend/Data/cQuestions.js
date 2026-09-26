const cProgrammingQuestions = [
  {
    question: "Which header file is commonly used for input and output functions in C?",
    options: ["<math.h>", "<stdio.h>", "<string.h>", "<stdlib.h>"],
    answer: 1
  },
  {
    question: "Which function is the usual entry point of a C program?",
    options: ["start()", "main()", "init()", "run()"],
    answer: 1
  },
  {
    question: "Which format specifier is used to print an integer with printf?",
    options: ["%f", "%c", "%d", "%s"],
    answer: 2
  },
  {
    question: "Which format specifier is used to print a character?",
    options: ["%c", "%d", "%f", "%lf"],
    answer: 0
  },
  {
    question: "Which format specifier is used for a string in printf?",
    options: ["%d", "%s", "%c", "%x"],
    answer: 1
  },
  {
    question: "Which operator is used to get the address of a variable?",
    options: ["*", "&", "%", "#"],
    answer: 1
  },
  {
    question: "Which operator is used to dereference a pointer?",
    options: ["&", "*", "->", "."],
    answer: 1
  },
  {
    question: "Which keyword declares a constant variable?",
    options: ["static", "const", "fixed", "constant"],
    answer: 1
  },
  {
    question: "Which data type is used to store a single character?",
    options: ["string", "char", "character", "byte"],
    answer: 1
  },
  {
    question: "Which data type is used for decimal floating-point values?",
    options: ["float", "int", "char", "void"],
    answer: 0
  },
  {
    question: "Which statement is used to make a decision based on a condition?",
    options: ["if", "goto", "typedef", "sizeof"],
    answer: 0
  },
  {
    question: "Which statement provides an alternative branch to an if statement?",
    options: ["case", "else", "default", "continue"],
    answer: 1
  },
  {
    question: "Which loop is guaranteed to execute its body at least once?",
    options: ["for", "while", "do-while", "if"],
    answer: 2
  },
  {
    question: "Which loop is commonly used when the number of iterations is known?",
    options: ["for", "switch", "if", "goto"],
    answer: 0
  },
  {
    question: "Which keyword exits a loop immediately?",
    options: ["skip", "continue", "break", "exitloop"],
    answer: 2
  },
  {
    question: "Which keyword skips the remaining statements of the current loop iteration?",
    options: ["break", "continue", "pass", "next"],
    answer: 1
  },
  {
    question: "Which statement is used for multi-way selection based on an expression?",
    options: ["switch", "select", "choose", "when"],
    answer: 0
  },
  {
    question: "Which keyword is used to define a structure?",
    options: ["record", "struct", "structure", "object"],
    answer: 1
  },
  {
    question: "Which keyword creates a type alias in C?",
    options: ["alias", "typedef", "define", "type"],
    answer: 1
  },
  {
    question: "Which preprocessor directive includes a header file?",
    options: ["#include", "#header", "#import", "#using"],
    answer: 0
  },
  {
    question: "Which preprocessor directive is commonly used to define a macro?",
    options: ["#macro", "#define", "#const", "#set"],
    answer: 1
  },
  {
    question: "What does sizeof return?",
    options: ["The value of a variable", "The size in bytes of a type or object", "The address of an object", "The number of bits only"],
    answer: 1
  },
  {
    question: "Which function allocates a block of dynamic memory?",
    options: ["alloc()", "malloc()", "memalloc()", "new()"],
    answer: 1
  },
  {
    question: "Which function allocates dynamic memory and initializes it to zero?",
    options: ["malloc()", "calloc()", "realloc()", "zeroalloc()"],
    answer: 1
  },
  {
    question: "Which function changes the size of previously allocated memory?",
    options: ["resize()", "realloc()", "memchange()", "expand()"],
    answer: 1
  },
  {
    question: "Which function releases dynamically allocated memory?",
    options: ["delete()", "free()", "release()", "clear()"],
    answer: 1
  },
  {
    question: "Which header file declares malloc, calloc, realloc and free?",
    options: ["<stdio.h>", "<stdlib.h>", "<memory.h>", "<alloc.h>"],
    answer: 1
  },
  {
    question: "What is the first valid index of a C array?",
    options: ["0", "1", "-1", "Depends on compiler"],
    answer: 0
  },
  {
    question: "How are elements of a C array stored in memory?",
    options: ["Randomly", "Contiguously", "Only on the stack", "Only on the heap"],
    answer: 1
  },
  {
    question: "Which declaration creates an array of 10 integers?",
    options: ["int a(10);", "int a[10];", "array int a[10];", "int[10] a;"],
    answer: 1
  },
  {
    question: "What does a string in C normally end with?",
    options: ["EOF", "\\0", "\\n", "\\t"],
    answer: 1
  },
  {
    question: "Which header file contains strlen and strcpy?",
    options: ["<stdio.h>", "<string.h>", "<stdlib.h>", "<ctype.h>"],
    answer: 1
  },
  {
    question: "Which function compares two strings?",
    options: ["strcompare()", "strcmp()", "compare()", "strmatch()"],
    answer: 1
  },
  {
    question: "Which function copies one C string to another?",
    options: ["strcopy()", "strcpy()", "copystr()", "memcopystr()"],
    answer: 1
  },
  {
    question: "What is a pointer?",
    options: ["A variable that stores an address", "A constant integer", "A function only", "A type of array"],
    answer: 0
  },
  {
    question: "What does the expression *(p + 1) generally access for an int pointer p?",
    options: ["The address of p", "The next int element", "The previous int element", "The size of p"],
    answer: 1
  },
  {
    question: "Which operator accesses a structure member through a structure pointer?",
    options: [".", "->", "::", "#"],
    answer: 1
  },
  {
    question: "Which storage class preserves a local variable's value between function calls?",
    options: ["auto", "register", "static", "extern"],
    answer: 2
  },
  {
    question: "Which keyword declares a variable defined in another source file?",
    options: ["extern", "static", "global", "import"],
    answer: 0
  },
  {
    question: "What is recursion?",
    options: ["A loop without a condition", "A function calling itself", "A pointer to a function", "A compiler optimization"],
    answer: 1
  },
  {
    question: "Which function can be used to read a line of text safely with a specified buffer size?",
    options: ["gets()", "fgets()", "scanfline()", "readline()"],
    answer: 1
  },
  {
    question: "Why is gets() generally avoided in modern C programs?",
    options: ["It cannot read text", "It has no way to limit input length", "It only works with numbers", "It requires C++"],
    answer: 1
  },
  {
    question: "Which operator has higher precedence in the expression a + b * c?",
    options: ["+", "*", "=", "&&"],
    answer: 1
  },
  {
    question: "What is the result of 5 / 2 when both operands are int?",
    options: ["2.5", "3", "2", "1"],
    answer: 2
  },
  {
    question: "Which logical operator means AND in C?",
    options: ["&", "&&", "||", "!"],
    answer: 1
  },
  {
    question: "Which logical operator means OR in C?",
    options: ["|", "&&", "||", "!"],
    answer: 2
  },
  {
    question: "Which operator means logical NOT?",
    options: ["~", "!", "^", "not"],
    answer: 1
  },
  {
    question: "Which operator is used for the remainder of integer division?",
    options: ["/", "%", "//", "mod"],
    answer: 1
  },
  {
    question: "What does a function prototype provide to the compiler?",
    options: ["Only the function's machine code", "The function's name, return type and parameter types", "The function's output value", "A dynamic memory block"],
    answer: 1
  },
  {
    question: "Which return type indicates that a function returns no value?",
    options: ["null", "empty", "void", "none"],
    answer: 2
  },
  {
    question: "Which command is commonly used to compile a C source file with GCC?",
    options: ["gcc program.c -o program", "run program.c", "c program.c", "compile program.c"],
    answer: 0
  },

  {
    question: "Which operator is used for bitwise AND in C?",
    options: ["&&", "&", "|", "^"],
    answer: 1
  },
  {
    question: "Which operator is used for bitwise OR in C?",
    options: ["||", "&", "|", "^"],
    answer: 2
  },
  {
    question: "Which operator is used for bitwise XOR in C?",
    options: ["^", "~", "&", "|"],
    answer: 0
  },
  {
    question: "Which operator performs a left bit shift?",
    options: [">>", "<<", "<", ">"],
    answer: 1
  },
  {
    question: "Which keyword can be used to prevent a function parameter from being modified through that parameter?",
    options: ["static", "volatile", "const", "extern"],
    answer: 2
  },
  {
    question: "What does NULL commonly represent when used with a pointer?",
    options: ["A pointer to the first byte of memory", "A pointer that does not point to a valid object", "A pointer to an integer", "A pointer to a function only"],
    answer: 1
  },
  {
    question: "Which function converts a string to a long integer?",
    options: ["strlong()", "atolong()", "strtol()", "longstr()"],
    answer: 2
  },
  {
    question: "Which header file provides the declaration of the isdigit function?",
    options: ["<ctype.h>", "<stdio.h>", "<stdlib.h>", "<string.h>"],
    answer: 0
  },
  {
    question: "Which keyword is used to define an enumeration type?",
    options: ["enum", "enumeration", "list", "choice"],
    answer: 0
  },
  {
    question: "What is the value of the expression 3 + 4 * 2 in C when all operands are int?",
    options: ["14", "11", "10", "9"],
    answer: 1
  }
];

module.exports = {
  cProgrammingQuestions: cProgrammingQuestions
    .filter((q) => q.question !== "Which command is commonly used to compile a C source file with GCC?")
    .slice(0, 60)
};
