import { Routes, Route, Navigate } from "react-router-dom";
import { trpc } from "./lib/trpc";
import Login from "./pages/Login";
import Inbox from "./pages/Inbox";
import Health from "./pages/Health";
import Analytics from "./pages/Analytics";
import Setup from "./pages/Setup";
import Layout from "./components/Layout";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="health" element={<Health />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="setup" element={<Setup />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
