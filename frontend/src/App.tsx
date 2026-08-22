import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">
        Loading...
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
