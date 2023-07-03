import { BaseContext } from "./types.js";

/**
 * A task error. A task error is thrown when a task throws an error.
 */
export class TaskError<Context extends BaseContext = BaseContext>
  extends AggregateError {
  readonly code: string;
  readonly context: Context;

  constructor(
    code: string,
    context: Context,
    errors: Error[],
    message = "Task failed",
  ) {
    super(errors, message);
    this.context = context;
    this.code = code;
  }
}

/**
 * A pipeline error. A pipeline error is thrown when a pipeline throws an error.
 */
export class PipelineError<Context extends BaseContext = BaseContext>
  extends AggregateError {
  readonly context: Context;

  constructor(
    errors: TaskError[],
    context: Context,
    message = "Pipeline failed",
  ) {
    super(errors, message);
    this.context = context;
  }
}
