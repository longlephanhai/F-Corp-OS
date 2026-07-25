import { createBrowserRouter, RouterProvider } from "react-router-dom"
import LayoutAdmin from "./layout/admin"
import ErrorPage from "./pages/result/error"
import NotFoundPage from "./pages/result/not-found"


function App() {

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
      element: <div>Login</div>
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
