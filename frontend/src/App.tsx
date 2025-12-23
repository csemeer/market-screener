import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TrendingUp, Search, Calculator, BarChart3 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import IntradayScanner from './pages/IntradayScanner';
import SwingScanner from './pages/SwingScanner';
import RiskCalculator from './pages/RiskCalculator';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Market Screener Pro</span>
              </Link>

              <nav className="flex space-x-8">
                <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/screener" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Custom Screener
                </Link>
                <Link to="/intraday" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Intraday
                </Link>
                <Link to="/swing" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Swing Trade
                </Link>
                <Link to="/risk-calculator" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Risk Calculator
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/intraday" element={<IntradayScanner />} />
            <Route path="/swing" element={<SwingScanner />} />
            <Route path="/risk-calculator" element={<RiskCalculator />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600 text-sm">
              Market Screener Pro - Advanced Stock Analysis for Indian & US Markets
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              Disclaimer: This tool is for educational purposes. Always do your own research before trading.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
