import { Link, useLocation } from 'react-router-dom';
import { Home, Info, Mail, FileText } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <nav className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center text-2xl font-bold text-blue-400">
              <FileText className="w-7 h-7 mr-2" />
              Estate Planner
            </Link>

            <div className="flex space-x-1">
              <Link
                to="/"
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive('/')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link
                to="/about"
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive('/about')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
              <Link
                to="/contact"
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive('/contact')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-400">
            Simple estate planning tools to help you organize important information
          </p>
        </div>
      </footer>
    </div>
  );
}
