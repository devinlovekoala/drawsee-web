import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './app/app.tsx';
import Blank from "@/app/pages/blank/blank.tsx";
import Flow from "@/app/pages/flow/flow.tsx";
import Course from "@/app/pages/course/course.tsx";
import CourseDetail from "@/app/pages/course/course-detail.tsx";
import { ReactFlowProvider } from '@xyflow/react';
import About from './about/about.tsx';
import Circuit from "@/app/pages/circuit/circuit.tsx";
import CircuitListPage from "@/app/circuit/list/page.tsx";
import CircuitViewPage from "@/app/circuit/view/[id]/page.tsx";
import CircuitEditPage from "@/app/circuit/edit/[id]/page.tsx";
import CircuitCreatePage from "@/app/circuit/create/page.tsx";
import CircuitExperimentTask from "@/app/pages/circuit-experiment/CircuitExperimentTask";
import DocumentLibrary from "@/app/pages/circuit-experiment/DocumentLibrary";
import DocumentUpload from "@/app/pages/circuit-experiment/DocumentUpload";
import DocumentAnalysis from "@/app/pages/circuit-experiment/DocumentAnalysis";
import DigitalWorkbench from "@/app/pages/digital/DigitalWorkbench";
import VisualizerPage from "@/app/pages/visualizer";

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, 
    children: [
      {
        path: '/',
        element: <Navigate to="/circuit" replace />
      },
      {
        path: '/blank',
        element: <Blank />
      },
      {
        path: '/flow',
        element: <Flow />
      },
      {
        path: '/share/:shareToken',
        element: <Flow />
      },
      {
        path: '/course',
        element: <Course />
      },
      {
        path: '/course/:id',
        element: <CourseDetail />
      },
      {
        path: '/digital',
        element: <DigitalWorkbench />
      },
      {
        path: '/visualizer',
        element: <VisualizerPage />
      },
      {
        path: '/circuit',
        element: <Circuit />
      },
      {
        path: '/circuit/list',
        element: <CircuitListPage />
      },
      {
        path: '/circuit/create',
        element: <CircuitCreatePage />
      },
      {
        path: '/circuit/view/:id',
        element: <CircuitViewPage />
      },
      {
        path: '/circuit/edit/:id',
        element: <CircuitEditPage />
      },
      {
        path: '/circuit/list/*',
        element: <Navigate to="/circuit/list" replace />
      },
      // 新增电路实验任务分析路由
      {
        path: '/circuit/experiment',
        element: <CircuitExperimentTask />
      },
      // 电路实验文档库路由
      {
        path: '/circuit-experiment/documents',
        element: <DocumentLibrary />
      },
      {
        path: '/circuit-experiment/upload',
        element: <DocumentUpload />
      },
      {
        path: '/circuit-experiment/document/:id',
        element: <DocumentAnalysis />
      }
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
