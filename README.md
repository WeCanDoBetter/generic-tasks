# @wecandobetter/generic-tasks

A TypeScript library designed to create, manage, and execute complex tasks and
pipelines, allowing detailed control and logging of each step and the context.
This package is perfect for handling workflows, data processing, or any
situation where tasks need to be executed in a controlled and detailed manner.

## Features 💫

- 📦 **Built with TypeScript**: Type safety and IntelliSense support out of the
  box.
- ⛓ **Tasks and Pipelines**: Easily create tasks and pipelines with any level of
  complexity.
- 🔀 **Step Management**: Add steps to your tasks, each with their own input,
  output, and error handling.
- 🔄 **Context Handling**: Each task and step has access to a context, allowing
  detailed logging and control.
- ⚡ **Async Support**: Steps can be asynchronous, supporting Promise based
  operations.
- 🛠 **Detailed Error Handling**: Custom `TaskError` and `PipelineError` classes
  provide detailed error information, including the context.

## Installation 📦

You can install the package via npm:

```bash
npm install @wecandobetter/generic-tasks
```

Or via yarn:

```bash
yarn add @wecandobetter/generic-tasks
```

## Usage Examples 🚀

Here's a basic example of creating a task with two steps and running it:

```typescript
import { type BaseContext, Task } from "@wecandobetter/generic-tasks";

const task = new Task<number, string>({
  name: "My Task",
  steps: [
    async (input: number, context: BaseContext) => {
      // step 1
      return `Step 1: ${input.toString()}`;
    },
    async (input: string, context: BaseContext) => {
      // step 2
      return `${input} -> Step 2 done!`;
    },
  ],
});

const input = 5;
const context: BaseContext = { steps: [] };

task.run(input, context).then((output) => console.log(output));
```

Output:

```bash
Step 1: 5 -> Step 2 done!
```

Here's a more complex example of creating a pipeline with two tasks and running
it:

```typescript
import { type BaseContext, Pipeline, Task } from "@wecandobetter/generic-tasks";

// Define two tasks
const task1 = new Task<number, string>({
  name: "Task1",
  steps: [
    async (input: number, context: BaseContext) => {
      return `Task 1: ${input.toString()}`;
    },
  ],
});

const task2 = new Task<string, string>({
  name: "Task2",
  steps: [
    async (input: string, context: BaseContext) => {
      return `${input} -> Task 2 done!`;
    },
  ],
});

// Define the pipeline
const pipeline = new Pipeline<number, string>({
  name: "My Pipeline",
  tasks: [
    {
      selector: (input: number) => input, // selector is optional
      task: task1,
    },
    {
      selector: (input: string) => input, // selector is optional
      task: task2,
    },
  ],
});

// Define input and context
const input = 5;
const context: BaseContext = { steps: [] };

// Run the pipeline
pipeline.run(input, context).then((output) => console.log(output));
```

Output:

```bash
Task 1: 5 -> Task 2 done!
```

## API Reference 📚

Detailed API documentation can be found in the TypeScript interfaces and classes
in the code. The primary components are:

- `BaseContext`: The interface for the context passed to each step.
- `Step`: A type representing a function that is a step in a task.
- `TaskOptions`: Options for creating a new `Task`.
- `TaskOutput`: The output from running a `Task`.
- `Task`: A class representing a task made up of multiple steps.
- `PipelineConfiguration`: Configuration for adding a `Task` to a `Pipeline`.
- `PipelineOptions`: Options for creating a new `Pipeline`.
- `PipelineOutput`: The output from running a `Pipeline`.
- `Pipeline`: A class representing a pipeline made up of multiple tasks.
- `TaskError`: A custom `Error` class for errors occurring in a `Task`.
- `PipelineError`: A custom `Error` class for errors occurring in a `Pipeline`.

## Contributing 🤝

Contributions, issues and feature requests are welcome! Feel free to check
[issues page](https://github.com/wecandobetter/generic-tasks/issues).

## License 📄

This project is licensed under the MIT License.

Enjoy the package! If you encounter any problems or have suggestions for
improvements, feel free to open an issue or a pull request.
