import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Mintlane failed to render", error, info.componentStack);
  }
  render() {
    if (this.state.error) return <StartupScreen failed />;
    return this.props.children;
  }
}

function StartupScreen({ failed = false }: { failed?: boolean }) {
  return <main className="startup-screen" role="status" aria-live="polite">
    <div className="startup-brand">
      <img src="/mintlane-mark.svg" alt="" width="42" height="42" />
      <span>Mintlane</span>
    </div>
    {failed ? <>
      <div className="startup-status-mark" aria-hidden="true">!</div>
      <h1>Mintlane couldn’t load</h1>
      <p>Something interrupted startup. Please try again.</p>
      <button className="startup-reload" onClick={() => window.location.reload()}>Reload Mintlane</button>
    </> : <>
      <div className="startup-spinner" aria-hidden="true" />
      <p className="startup-loading-copy">Preparing your launchpad…</p>
    </>}
  </main>;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  // The cinematic entry loader belongs to the landing page only. Keep the app route free of a second loader.
  root.render(null);

  Promise.all([
    import("./App"),
    import("@solana/wallet-adapter-react"),
    import("@solana/wallet-adapter-react-ui")
  ]).then(([appModule, walletReact, walletUi]) => {
    const App = appModule.default;
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <walletReact.ConnectionProvider endpoint="https://api.devnet.solana.com">
            <walletReact.WalletProvider wallets={[]} autoConnect>
              <walletUi.WalletModalProvider><App /></walletUi.WalletModalProvider>
            </walletReact.WalletProvider>
          </walletReact.ConnectionProvider>
        </AppErrorBoundary>
      </React.StrictMode>
    );
  }).catch((error: unknown) => {
    console.error("Mintlane startup module failed", error);
    root.render(<StartupScreen failed />);
  });

  window.addEventListener("error", (event) => {
    console.error("Mintlane window error", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Mintlane unhandled rejection", event.reason);
  });
}
