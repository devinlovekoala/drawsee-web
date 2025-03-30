import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import App from "@/app/app.tsx";
import Flow from "@/app/pages/flow/flow.tsx";
import "./main.css";
import "@/styles/index.css";
import About from "@/about/about.tsx";
import CourseSelection from "@/app/pages/course/CourseSelection.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/about" replace />,
  },
  {
    path: "/courses",
    element: <CourseSelection />,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "flow",
        element: <Flow />,
      },
      {
        path: "blank",
        element: <div>Blank Page</div>,
      },
    ],
  },
  {
    path: "/about",
    element: <About />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);