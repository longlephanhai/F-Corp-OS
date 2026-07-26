import { createBrowserRouter, RouterProvider } from "react-router-dom"
import LayoutAdmin from "./layout/admin"
import ErrorPage from "./pages/result/error"
import NotFoundPage from "./pages/result/not-found"
import LoginPage from "./pages/auth/login"
import { useAppDispatch } from "./hooks/hooks"
import { useEffect } from "react"
import { fetchAccount } from "./redux/account/accountSlice"


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
      errorElement: <ErrorPage />
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
