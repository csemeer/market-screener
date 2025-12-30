import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TrendingUp, Search, Calculator, BarChart3, Menu, X, Activity, Calendar, Settings as SettingsIcon, ListPlus } from 'lucide-react';
import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AutoScanDashboard from './pages/AutoScanDashboard';
import EODDashboard from './pages/EODDashboard';
import Settings from './pages/Settings';
import CustomWatchlist from './pages/CustomWatchlist';
import Screener from './pages/Screener';
import IntradayScanner from './pages/IntradayScanner';
import SwingScanner from './pages/SwingScanner';
import RiskCalculator from './pages/RiskCalculator';
import StockDetail from './pages/StockDetail';
import LoggerDrawer from './components/LoggerDrawer';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/autoscan', label: 'Auto-Scan', icon: Activity },
    { to: '/eod', label: 'EOD Trading', icon: Calendar },
    { to: '/watchlist', label: 'Watchlist', icon: ListPlus },
    { to: '/screener', label: 'Screener', icon: Search },
    { to: '/intraday', label: 'Intraday', icon: TrendingUp },
    { to: '/swing', label: 'Swing', icon: TrendingUp },
    { to: '/risk-calculator', label: 'Risk Calc', icon: Calculator },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    <span className="hidden sm:inline">AlphaStream</span>
                    <span className="sm:hidden">AS</span>
                  </div>
                  <div className="text-xs text-cyan-600 font-medium -mt-1">v1.0.0</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6 lg:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center space-x-1"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/autoscan" element={<AutoScanDashboard />} />
            <Route path="/eod" element={<EODDashboard />} />
            <Route path="/watchlist" element={<CustomWatchlist />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/intraday" element={<IntradayScanner />} />
            <Route path="/swing" element={<SwingScanner />} />
            <Route path="/risk-calculator" element={<RiskCalculator />} />
            <Route path="/stock/:exchange/:symbol" element={<StockDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600 text-sm">
              AlphaStream v1.0.0 - Stream Alpha. Trade Smarter.
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              Disclaimer: This tool is for educational purposes. Always do your own research before trading.
            </p>
          </div>
        </footer>

        {/* Logger Drawer - Global monitoring tool */}
        <LoggerDrawer />
      </div>
    </Router>
  );
}

export default App;
