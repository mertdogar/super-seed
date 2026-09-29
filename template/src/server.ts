import handler from "@tanstack/react-start/server-entry";

import { dispatch } from "./api/dispatch";
import { ApiError, errorResponse } from "./api/route";

export default {
  async fetch(request, env, ctx) {
    const response = await dispatch(request, env, ctx);
    if (response) return response;
    if (new URL(request.url).pathname.startsWith("/api/"))
      return errorResponse(new ApiError(404, "not_found", "Not found"));
    return handler.fetch(request);
  },
} satisfies ExportedHandler<Env>;
