import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";

export default function Layout() {
  const { data: user } = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-500 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-gray-900 text-sm">
                Premium Auto Analysis
              </span>
              <nav className="flex items-center gap-1">
                <NavLink to="/inbox" className={navClass}>
                  Inbox
                </NavLink>
                <NavLink to="/health" className={navClass}>
                  Health
                </NavLink>
                <NavLink to="/analytics" className={navClass}>
                  Analytics
                </NavLink>
                <NavLink to="/setup" className={navClass}>
                  Setup
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
