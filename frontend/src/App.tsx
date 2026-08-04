import { createBrowserRouter, RouterProvider } from "react-router-dom"
import LayoutAdmin from "./layout/admin"
import ErrorPage from "./pages/result/error"
import NotFoundPage from "./pages/result/not-found"
import LoginPage from "./pages/auth/login"
import { useAppDispatch } from "./hooks/hooks"
import { useEffect } from "react"
import { fetchAccount } from "./redux/account/accountSlice"
import DashboardPage from "./pages/admin/dashboard"     
import UsersPage from "./pages/admin/users"                
import RolesPage from "./pages/admin/roles"              
import PermissionsPage from "./pages/admin/permissions"    


function App() {

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAccount())
  }, [])

  const router = createBrowserRouter([
    {
      path: "/",
      element: <div>Home</div>
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
      ]
    },
    {
      path: "/login",
      element: <LoginPage />
    },
    {
      path: "/register",
      element: <div>Register</div>
    },
    {
      path: "*",
      element: <NotFoundPage />
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App