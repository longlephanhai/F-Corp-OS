import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LayoutAdmin from "./layout/admin";
import ErrorPage from "./pages/result/error";
import NotFoundPage from "./pages/result/not-found";
import LoginPage from "./pages/auth/login";
import { useAppDispatch } from "./hooks/hooks";
import { useEffect } from "react";
import { fetchAccount } from "./redux/account/accountSlice";
import DashboardPage from "./pages/admin/dashboard";
import UsersPage from "./pages/admin/users";
import RolesPage from "./pages/admin/roles";
import PermissionsPage from "./pages/admin/permissions";
import LayoutHR from "./layout/hr";
import HRDashboard from "./pages/hr/Dashboard";
import WalletAdmin from "./pages/hr/WalletAdmin";
import ReviewConsole from "./pages/hr/ReviewConsole";
import LayoutPM from "./layout/pm";

import { SprintManagementPage } from "./pages/pm/SprintManagement";
import { MyTeamPage } from "./pages/pm/MyTeamPage"; // (Trang ở sprint trước)
import LayoutApp from "./components/protected-route/layout.app";
import ProtectedRoute from "./components/protected-route";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: 48, textAlign: "center", color: "#8c8c8c" }}>
    <h2>{title}</h2>
    <p>Trang đang được phát triển.</p>
  </div>
);

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAccount())
  }, [])

  const router = createBrowserRouter([
    {
      path: "/",
      element: <div>Home</div>,
    },
    {
      path: "/admin",
      element: <LayoutAdmin />,
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "users", element: <UsersPage /> },
        { path: "roles", element: <RolesPage /> },
        { path: "permissions", element: <PermissionsPage /> },
      ],
    },
    {
      path: "/hr",
      element: <LayoutHR />,
      errorElement: <ErrorPage />,
      children: [
        { path: "dashboard", element: <HRDashboard /> },
        { path: "wallet", element: <WalletAdmin /> },
        { path: "review", element: <ReviewConsole /> },
        { path: "bench", element: <PlaceholderPage title="Dự báo Bench" /> },
      ],
    },

    {
      path: "/pm",
      element: <LayoutPM />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <MyTeamPage />,
        },
        {
          path: "my-team",
          element: <MyTeamPage />,
        },
        {
          path: "sprints/:sprintId",
          element: <SprintManagementPage />,
        },
      ],
    },

    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <div>Register</div>,
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App;
