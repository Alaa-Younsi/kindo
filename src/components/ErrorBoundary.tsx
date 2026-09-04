import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** "app" renders a standalone full-page fallback with no app hooks (it sits
   *  outside the Theme/Language providers). "route" renders a compact inline
   *  card and can sit inside them. */
  variant?: "app" | "route";
}

interface State {
  hasError: boolean;
}

const STALE_CHUNK = /loading chunk|dynamically imported module|failed to fetch dynamically/i;
const RELOAD_FLAG = "kindo-chunk-reload";

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A stale deploy: the user's tab holds an old bundle and a route chunk
    // 404s on the new hash. One automatic reload fixes it — guarded so a
    // genuinely broken build can't reload-loop.
    if (STALE_CHUNK.test(error.message)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
          return;
        }
      } catch {
        /* private mode — fall through to the fallback UI */
      }
    }

    // The only crash signal the operator gets in production.
    console.error("[KINDO] render error:", error, info.componentStack);
    try {
      window.fbq?.("trackCustom", "AppError", { message: error.message?.slice(0, 200) });
    } catch {
      /* pixel blocked — nothing to do */
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.variant === "route") {
      return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <p className="text-lg font-bold text-ink">Une erreur est survenue · حدث خطأ ما</p>
          <p className="mt-2 text-sm text-muted">
            Merci de recharger la page · يرجى إعادة تحميل الصفحة
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-brand px-5 py-2 text-sm font-bold text-brand-ink"
          >
            Recharger · إعادة التحميل
          </button>
        </div>
      );
    }

    // Top-level: styled from :root CSS tokens only — no Tailwind theme classes,
    // no app hooks (this renders outside every provider).
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          background: "rgb(var(--c-bg))",
          color: "rgb(var(--c-ink))",
          fontFamily: "Poppins, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
          Une erreur est survenue
        </h1>
        <p style={{ margin: 0, opacity: 0.7 }} dir="rtl">
          حدث خطأ ما. يرجى إعادة تحميل الصفحة.
        </p>
        <p style={{ margin: 0, opacity: 0.7 }}>Merci de recharger la page.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            border: 0,
            borderRadius: "9999px",
            padding: "0.6rem 1.4rem",
            fontWeight: 700,
            cursor: "pointer",
            background: "rgb(var(--c-brand))",
            color: "rgb(var(--c-brand-ink))",
          }}
        >
          Recharger / إعادة التحميل
        </button>
      </div>
    );
  }
}
