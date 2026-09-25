import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}
