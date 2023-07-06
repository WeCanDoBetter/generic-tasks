import type { BaseContext } from "../types.js";
import { Task } from "./task.js";
import { PipelineError, TaskError } from "../errors.js";

/**
 * The configuration for a pipeline. The selector is used to select the input for the task.
 * @template Context The type of the context.
 */
export type PipelineConfiguration<
  Context extends BaseContext = BaseContext,
> = Task<unknown, unknown, Context> | {
  /**
   * The selector for the task. The selector is used to select the input for the task.
   * @param input The output of the previous task.
   * @param context The context of the pipeline.
   * @returns The input for the task.
   */
  selector?: (input: unknown, context: Context) => unknown;
  /** The task to run. */
  task: Task<unknown, unknown, Context>;
};

/**
 * The options for a pipeline. The name is used to identify the pipeline.
 * @template Context The type of the context.
 */
export interface PipelineOptions<Context extends BaseContext = BaseContext> {
  name: string;
  tasks: PipelineConfiguration<Context>[];
}

/**
 * The output of a pipeline. The output is the output of the last task.
 * @template Output The type of the output.
 * @template Context The type of the context.
 */
export interface PipelineOutput<
  Output = unknown,
  Context extends BaseContext = BaseContext,
> {
  /** The output of the last task. */
  output: Output;
  /** The context of the pipeline. */
  context: Context;
}

/**
 * A pipeline. A pipeline is a collection of tasks. A pipeline can be run with an input and a context. The context is passed to all tasks.
 * @template Input The type of the input.
 * @template Output The type of the output.
 * @template Context The type of the context.
 * @throws {TypeError} If no tasks are given.
 */
export class Pipeline<
  Input = unknown,
  Output = unknown,
  Context extends BaseContext = BaseContext,
> {
  /** The name of the pipeline. */
  readonly name: string;
  /** The tasks of the pipeline. */
  readonly tasks: PipelineConfiguration<Context>[] = [];

  constructor({ name, tasks }: PipelineOptions<Context>) {
    this.name = name;

    if (!tasks.length) {
      throw new TypeError("Expected at least one task");
    }

    this.tasks.push(...tasks);
  }

  /**
   * Run the pipeline with the given input and context. The tasks are run in the order they are added. The output of a task is passed to the next task.
   * @param input The input of the pipeline.
   * @param context The context of the pipeline.
   * @returns The output of the pipeline.
   * @throws {PipelineError} If a task throws an error.
   */
  async run(
    input: Input,
    context: Omit<Context, "steps">,
  ): Promise<PipelineOutput<Output, Context>> {
    const baseContext = { steps: [] } as BaseContext;
    const ctx = { ...context, ...baseContext } as Context;

    let output: any = input;
    for (const task of this.tasks) {
      try {
        const taskFn = "task" in task ? task.task : task;
        const taskInput = "selector" in task
          ? task.selector?.(output, ctx)
          : output;

        const { output: taskOutput } = await taskFn.run(taskInput, ctx);
        output = taskOutput;
      } catch (error) {
        throw new PipelineError(
          ctx.steps.filter((step) => step.status === "failure").map((step) =>
            step.error as TaskError
          ),
          ctx,
        );
      }
    }

    return { output, context: ctx };
  }
}
