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
    if (this.state.error) return <StartupError message={this.state.error.message || "Unknown rendering error"} />;
    return this.props.children;
  }
}

function StartupError({ message }: { message: string }) {
  return <main style={{minHeight:"100vh",background:"#090b12",color:"#f1f2f8",fontFamily:"system-ui,sans-serif",display:"grid",placeItems:"center",padding:24}}>
    <section style={{maxWidth:560,width:"100%",border:"1px solid #343044",background:"#11141e",borderRadius:18,padding:28}}>
      <div style={{fontSize:12,letterSpacing:2,color:"#b7a4ff",fontWeight:700}}>MINTLANE · STARTUP DIAGNOSTICS</div>
      <h1 style={{fontSize:26,margin:"14px 0 8px"}}>Mintlane couldn’t load</h1>
      <p style={{color:"#aeb3c4",lineHeight:1.6}}>The startup process failed. The message below identifies the failing module or runtime error.</p>
      <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",background:"#090b12",borderRadius:10,padding:14,color:"#ffb6c2",fontSize:12}}>{message}</pre>
      <button onClick={() => window.location.reload()} style={{border:0,borderRadius:9,padding:"11px 16px",background:"#8d70ef",color:"#fff",fontWeight:700}}>Reload Mintlane</button>
    </section>
  </main>;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<StartupError message="Loading Mintlane modules…" />);

  // Load the wallet SDK and app only after the page has mounted. This lets us
  // show a useful error if a third-party module crashes during initialization.
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
    const message = error instanceof Error ? error.stack || error.message : String(error);
    root.render(<StartupError message={message} />);
  });

  window.addEventListener("error", (event) => {
    console.error("Mintlane window error", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Mintlane unhandled rejection", event.reason);
  });
}
