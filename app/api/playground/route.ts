import { ApiError, createT3trisClient } from "@t3tris/sdk";
import { PlaygroundInputError, parsePlaygroundInput } from "@/lib/playground";
import { playgroundFailure, runPlaygroundCall } from "@/lib/playground-runner";

/** Same-origin SDK playground. Only the visitor's key is used for each request. */
export async function POST(request: Request): Promise<Response> {
  try {
    if (Number(request.headers.get("content-length")) > 16_384) {
      return Response.json(
        { error: { code: "bad_request", message: "Inputs are too large." } },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const body: unknown = await request.json();
    const { call, values, apiKey, session } = parsePlaygroundInput(body);
    const client = createT3trisClient({ apiKey });
    return Response.json(
      { result: (await runPlaygroundCall(client, call, values, session)) ?? null },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const failure =
      error instanceof PlaygroundInputError || error instanceof SyntaxError
        ? { status: 400, code: "bad_request", message: error.message }
        : error instanceof ApiError
          ? {
              status: error.status >= 400 ? error.status : 502,
              code: error.code,
              message: error.message,
            }
          : playgroundFailure(error);
    return Response.json(
      { error: { code: failure.code, message: failure.message } },
      { status: failure.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
