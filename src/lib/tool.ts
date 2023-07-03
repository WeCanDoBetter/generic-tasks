import { hashFunctionContents } from "./util.";

export interface BaseToolContext {
  args: Record<string, unknown>;
}

export enum ToolType {
  Tool = "tool",
}

export interface Tool<
  Input = unknown,
  Output = unknown,
  Context extends BaseToolContext = BaseToolContext,
> {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  keywords: string[];
  spec: {
    input: string;
    output: string;
    args: Record<string, unknown>;
  };
  execute(input: Input, context: Context): Promise<Output>;
}

export const wikipedia: Tool<string, string> = {
  id: "wikipedia",
  name: "Wikipedia English",
  type: ToolType.Tool,
  description: "Searches Wikipedia for the given query.",
  keywords: [
    "wikipedia",
    "wikipedia-en",
    "wiki",
    "wiki-en",
    "api:en.wikipedia.org",
  ],
  spec: {
    input: "string",
    output: "string",
    args: {
      query: "string",
    },
  },
  async execute(input) {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("prop", "extracts");
    url.searchParams.set("exintro", "true");
    url.searchParams.set("explaintext", "true");
    url.searchParams.set("titles", input);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new ToolError("E_FETCH", wikipedia, [
        new Error(response.statusText),
      ], "Failed to fetch Wikipedia");
    }

    const data = await response.json() as {
      query: {
        pages: Record<string, {
          missing?: boolean;
          extract?: string;
        }>;
      };
    };

    const page = Object.values(data.query.pages)[0];

    if (page.missing) {
      throw new ToolError("E_MISSING", wikipedia, [], "Page not found");
    }

    return page.extract!;
  },
};

export const weather: Tool<string, string> = {
  id: "weather",
  name: "Weather",
  type: ToolType.Tool,
  description: "Searches the weather for the given input.",
  keywords: ["weather", "api:openweathermap.org"],
  spec: {
    input: "string",
    output: "string",
    args: {
      location: "string",
    },
  },
  async execute(input) {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", input);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "en");
    url.searchParams.set("appid", "blabla");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new ToolError(
        "E_FETCH",
        weather,
        [new Error(response.statusText)],
        "Failed to fetch weather",
      );
    }

    const data = await response.json();
    return `The weather in ${data.name} is ${
      data.weather[0].description
    } with a temperature of ${data.main.temp}°C.`;
  },
};

export const pubMed: Tool<string, Paper[]> = {
  id: "pubmed",
  name: "PubMed",
  type: ToolType.Tool,
  description: "Searches PubMed for the given input.",
  keywords: ["pubmed", "api:eutils.ncbi.nlm.nih.gov"],
  spec: {
    input: "string",
    output: "string",
    args: {
      query: "string",
    },
  },
  async execute(input) {
    const url = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
    );
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("retmode", "json");
    url.searchParams.set("term", input);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new ToolError(
        "E_FETCH",
        pubMed,
        [new Error(response.statusText)],
        "Failed to fetch PubMed",
      );
    }

    const data = await response.json();
    const results = data.esearchresult;
    const texts = results.idlist.map(async (id: string) => {
      const url = new URL(`https://pubmed.ncbi.nlm.nih.gov/${id}/`);
      const response = await fetch(url.toString());
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      const title = doc.querySelector(".heading-title")?.textContent;
      const authors = doc.querySelector(".authors-list")?.textContent;
      const abstract = doc.querySelector(".abstract-content")?.textContent;
      return { title, authors, abstract };
    });

    const resultsText = await Promise.allSettled(texts);
    const resultsTextFiltered = resultsText.filter(
      (result): result is PromiseFulfilledResult<any> => {
        return result.status === "fulfilled";
      },
    ).map((result) => result.value);

    return resultsTextFiltered.map((result) => {
      return {
        title: result.title.trim(),
        authors: result.authors.split("\n").map((author: string) =>
          author.trim()
        ),
        abstract: result.abstract.split("\n").map((paragraph: string) =>
          paragraph.trim()
        ).join(" "),
      };
    });
  },
};

export function createTool<
  Input = unknown,
  Output = unknown,
  Context extends BaseToolContext = BaseToolContext,
>(
  type: ToolType,
  options: {
    name: string;
    description: string;
    keywords: string[];
    spec: {
      input: string;
      output: string;
      args: Record<string, string>;
    };
  },
  execute: (input: Input, context: Context) => Promise<Output>,
): Tool<Input, Output, Context> {
  const id = hashFunctionContents(execute);
  return { ...options, id, type, execute };
}

export interface Paper {
  title: string;
  authors: string[];
  abstract: string;
}

export async function executeTool<
  Input = unknown,
  Output = unknown,
  Context extends BaseToolContext = BaseToolContext,
>(
  tool: Tool<Input, Output, Context>,
  input: Input,
  context: Context,
): Promise<Output> {
  try {
    const output = await tool.execute(input, context);
    return output;
  } catch (error: any) {
    throw error instanceof ToolError ? error : new ToolError(
      "E_FALL",
      tool,
      [error],
      `Uncaucht error in tool ${tool.name}`,
    );
  }
}

export class ToolError extends AggregateError {
  readonly code: string;
  readonly tool: Tool;

  constructor(
    code: string,
    tool: Tool,
    errors: readonly Error[],
    message = `Failed to execute tool ${tool.name}`,
  ) {
    super(errors, message);
    this.code = code;
    this.tool = tool;
  }
}
