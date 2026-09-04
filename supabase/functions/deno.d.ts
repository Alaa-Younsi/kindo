// Minimal ambient surface for the Deno globals these functions use, so a plain
// TypeScript server (no Deno extension) doesn't flag `Deno`. `declare namespace`
// merges with the real Deno types when the Deno LSP is active — no conflict.

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;

  interface ServeHandlerInfo {
    remoteAddr: { hostname: string; port: number };
  }
  type ServeHandler = (
    request: Request,
    info?: ServeHandlerInfo,
  ) => Response | Promise<Response>;

  function serve(handler: ServeHandler): void;
}

// The Edge Runtime resolves `npm:` specifiers natively. For the editor's plain
// TS server, re-export the types from the copy installed in node_modules.
declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
