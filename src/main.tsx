import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './pages/app.tsx';
import Auth from '@/pages/auth/auth.tsx';
import LoginForm from '@/pages/auth/components/login-form.tsx';
import SignUpForm from '@/pages/auth/components/signup-form.tsx';
import Flow from '@/pages/flow/flow.tsx';
import Knowledgenode from '@/pages/admin/components/knowledgenode.tsx';
import About from '@/pages/about/about.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/auth',
    element: <Auth />,
    children: [
      {
        path: 'login',
        element: <LoginForm />
      },
      {
        path: 'signup',
        element: <SignUpForm />
      }
    ]
  },
  {
    path: '/flow',
    element: <Flow />
  },
  {
    path: '/admin',
    element: <Knowledgenode />
  },
  {
    path: '/about',
    element: <About />
  }
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
);