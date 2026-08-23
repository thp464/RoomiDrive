import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">
        Loading...
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (user.must_reset_password) return <ResetPasswordScreen />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
