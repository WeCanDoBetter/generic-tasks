import type { BaseContext, Step } from "../types.js";
import { TaskError } from "../errors.js";

/**
 * The options for a task.
 * @template Context The type of the context.
 */
export interface TaskOptions<Context extends BaseContext = BaseContext> {
  /** The name of the task. */
  name: string;
  /** The steps of the task. */
  steps?: Step<unknown, unknown, Context>[];
}

/**
 * The output of a task.
 * @template Output The type of the output.
 */
export interface TaskOutput<Output = unknown> {
  output: Output;
}

/**
 * A task. A task is a collection of steps. A task can be run with an input and a context. The context is passed to all steps.
 * @template Input The type of the input.
 * @template Output The type of the output.
 * @template Context The type of the context.
 */
export class Task<
  Input = unknown,
  Output = unknown,
  Context extends BaseContext = BaseContext,
> {
  /** The name of the task. */
  readonly name: string;
  /** The steps of the task. */
  readonly steps: Step<unknown, unknown, Context>[] = [];

  constructor({ name, steps }: TaskOptions<Context>) {
    this.name = name;

    if (steps?.length) {
      this.steps.push(...steps);
    }
  }

  /**
   * The id of the task. The id is the name of the task followed by the names of the steps separated by a dot.
   * It is used to identify the task in the context.
   */
  get id(): string {
    return this.steps.map((step) => step.name).join(".");
  }

  /**
   * Adds steps to the task. The steps are added to the end of the task. The steps are run in the order they are added.
   * @param steps The steps to add.
   */
  push(...steps: Step<unknown, unknown, Context>[]): this {
    if (!steps.length) {
      throw new TypeError("Expected at least one step");
    }

    this.steps.push(...steps);
    return this;
  }

  /**
   * Runs the task with the given input and context. The steps are run in the order they are added.
   * @param input The input of the task.
   * @param context The context of the task.
   * @returns The output of the task.
   * @throws {TaskError} If a step throws an error.
   */
  async run(input: Input, context: Context): Promise<TaskOutput<Output>> {
    let output: any = input;

    context.steps.push(
      ...this.steps.map((step) => ({
        name: step.name,
        status: "pending" as const,
      })),
    );

    for (const step of this.steps) {
      context.steps[context.steps.length - 1].input = output;

      try {
        output = await step(output, context);
        context.steps[context.steps.length - 1].status = "success";
        context.steps[context.steps.length - 1].output = output;
      } catch (error: any) {
        context.steps[context.steps.length - 1].status = "failure";
        context.steps[context.steps.length - 1].error = error;
        throw error instanceof TaskError
          ? error
          : new TaskError("FALL_THROUGH", context, [error]);
      }
    }

    return { output };
  }
}
