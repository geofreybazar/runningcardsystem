import { BrowserRouter } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "@/components/app/providers/AuthProvider.jsx";
import useTheme from "@/hooks/useTheme.js";
import Router from "./Router.jsx";

function App() {
  const [theme] = useTheme();
  return (
    <BrowserRouter>
      <AuthProvider>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API}>
          <TooltipProvider>
            <Router />
            <Toaster richColors position='top-right' theme={theme} />
          </TooltipProvider>
        </APIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
