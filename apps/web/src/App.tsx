import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { SkillList } from "./pages/SkillList";
import { SkillDetail } from "./pages/SkillDetail";
import { ExpertList } from "./pages/ExpertList";
import { ExpertDetail } from "./pages/ExpertDetail";
import { ConnectorList } from "./pages/ConnectorList";
import { ConnectorDetail } from "./pages/ConnectorDetail";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/skills" element={<SkillList />} />
            <Route path="/skills/:slug" element={<SkillDetail />} />
            <Route path="/experts" element={<ExpertList />} />
            <Route path="/experts/:slug" element={<ExpertDetail />} />
            <Route path="/connectors" element={<ConnectorList />} />
            <Route path="/connectors/:slug" element={<ConnectorDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
