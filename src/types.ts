import type { TaskError } from "./errors.js";

/**
 * The base context for all tasks and pipelines.
 */
export interface BaseContext extends Record<string, unknown> {
  /** The steps that have been added to the context. */
  readonly steps: {
    /** The name of the step. */
    readonly name: string;
    /** The status of the step. */
    status: "pending" | "success" | "failure";
    /** The input of the step. */
    input?: unknown;
    /** The output of the step. */
    output?: unknown;
    /** The error of the step. */
    error?: TaskError;
  }[];
}

/**
 * A step in a task. A step is a function that takes an input and returns an output.
 * @param input The input of the step.
 * @param context The context of the step.
 * @template Input The type of the input.
 * @template Output The type of the output.
 * @template Context The type of the context.
 * @returns The output of the step.
 */
export type Step<Input, Output, Context extends BaseContext = BaseContext> = (
  input: Input,
  context: Context,
) => Promise<Output>;
