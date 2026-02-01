import { Navbar } from './Navigation/Navbar';
import { Sidebar } from './Navigation/Sidebar';

export function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-text-dark">Quiz Desktop</h1>
          <p className="text-gray-600 mt-2">AI-Powered Quiz Generation</p>
        </div>
        {children}
      </div>
    </div>
  );
}
