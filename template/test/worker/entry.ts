import { dispatch } from "@/api/dispatch";

// src/server.ts also serves pages through TanStack Start, which only exists inside its Vite plugin
export default {
  fetch: async (request, env, ctx) =>
    (await dispatch(request, env, ctx)) ?? new Response("Not found", { status: 404 }),
} satisfies ExportedHandler<Env>;
