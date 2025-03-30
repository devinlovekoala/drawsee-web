import './app.css';
import './styles/tailwind.css';
import Header from "@/app/components/header.tsx";
import Footer from "@/app/components/footer.tsx";
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Toaster position="top-center" richColors/>
        <Header/>
        <main className="main-content">
          <Outlet />
        </main>
        <Footer/>
      </div>
    </AppProvider>
  );
}

export default App;