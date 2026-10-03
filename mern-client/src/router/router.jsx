import { createBrowserRouter,RouterProvider,} from "react-router-dom";
import App from "../App";
import Home from "../home/Home"
import Shop from "../shop/Shop";
import About from "../components/About"
import Blog from "../components/Blog"
import SingleBook from "../shop/SingleBook";
import DashboardLayout from "../Dashboard/DashboardLayout";
import Dashboard from "../Dashboard/Dashboard";
import UploadBooks from "../Dashboard/UploadBooks";
import ManageBooks from "../Dashboard/ManageBooks";
import EditBooks from "../Dashboard/EditBooks";
import Signup from "../components/Signup";
import Login from "../components/Login";
import PrivateRoute from "../PrivateRoute/PrivateRoute";
import Logout from "../components/Logout";

const API = import.meta.env.VITE_API_URL;

const router = createBrowserRouter([
    {
      path: "/",
      element: <App/>,
      children:[
        {
            path: "/",
            element: <Home/>
        },
        {
            path:"/shop",
            element:<Shop/>
        },
        {
            path:"/about",
            element:<About/>
        },
        {
            path:"/Blog",
            element:<Blog/>
        },
        {
          path:"/book/:id",
          element:<PrivateRoute><SingleBook/></PrivateRoute>,
          loader:({params}) => fetch(`${API}/book/${params.id}`)
        }
      ]
    },
    {
      path: "/admin/dashboard",
      element:<PrivateRoute><DashboardLayout/></PrivateRoute>,
      children:[
        {
          path: "/admin/dashboard",
          element: <Dashboard/>
        },
        {
          path: "/admin/dashboard/upload",
          element:<UploadBooks/>
        },
        {
          path: "/admin/dashboard/manage",
          element: <ManageBooks/>
        },
        {
          path: "/admin/dashboard/edit-books/:id",
          element: <EditBooks/>,
          loader:({params}) => fetch(`${API}/book/${params.id}`)
        }
      ]
    },
     {
      path: "/sign-up",
      element: <Signup/>
     },
     {
      path:"/login",
      element: <Login/>
     },
     {
      path:"logout",
      element: <Logout/>
     }
  ]);

export default router;