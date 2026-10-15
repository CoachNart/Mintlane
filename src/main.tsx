import React from "react";
import ReactDOM from "react-dom/client";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import App from "./App";
import "./styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Mintlane failed to render", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return <main style={{minHeight:"100vh",background:"#090b12",color:"#f1f2f8",fontFamily:"system-ui,sans-serif",display:"grid",placeItems:"center",padding:24}}>
        <section style={{maxWidth:560,width:"100%",border:"1px solid #343044",background:"#11141e",borderRadius:18,padding:28}}>
          <div style={{fontSize:12,letterSpacing:2,color:"#b7a4ff",fontWeight:700}}>MINTLANE · STARTUP ERROR</div>
          <h1 style={{fontSize:26,margin:"14px 0 8px"}}>Mintlane couldn’t load</h1>
          <p style={{color:"#aeb3c4",lineHeight:1.6}}>The app hit a frontend error instead of rendering the dashboard. This screen is here so the problem is visible rather than a blank page.</p>
          <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",background:"#090b12",borderRadius:10,padding:14,color:"#ffb6c2",fontSize:12}}>{this.state.error.message || "Unknown rendering error"}</pre>
          <button onClick={() => window.location.reload()} style={{border:0,borderRadius:9,padding:"11px 16px",background:"#8d70ef",color:"#fff",fontWeight:700}}>Reload Mintlane</button>
        </section>
      </main>;
    }
    return this.props.children;
  }
}

const endpoint = "https://api.devnet.solana.com";
const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={[]} autoConnect>
            <WalletModalProvider><App /></WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </AppErrorBoundary>
    </React.StrictMode>
  );
}
