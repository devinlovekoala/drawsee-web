import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './app/app.tsx';
import Blank from "@/app/pages/blank/blank.tsx";
import Flow from "@/app/pages/flow/flow.tsx";
import { ReactFlowProvider } from '@xyflow/react';
import About from './about/about.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/blank',
        element: <Blank />
      },
      {
        path: '/flow',
        element: <Flow />
      },
    ]
  },
  {
    path: '/about',
    element: <About />
  }
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ReactFlowProvider>
			<RouterProvider router={router} />
		</ReactFlowProvider>
	</StrictMode>
);