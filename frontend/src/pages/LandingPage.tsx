import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Zap,
  Bell,
  Shield,
  Globe,
  BarChart3,
  ArrowRight,
  Check,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Activity,
  Target
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AlphaStream</h1>
                <p className="text-xs text-cyan-400">v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors hidden md:block">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors hidden md:block">
                Pricing
              </a>
              <a href="#docs" className="text-gray-300 hover:text-white transition-colors hidden md:block">
                Docs
              </a>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Real-time Trading Intelligence</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Stream Alpha.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Trade Smarter.
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Professional-grade trading platform with multi-channel alerts, custom watchlists,
                and automated broker integration. Get instant notifications on breakouts, targets, and stop losses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-lg shadow-blue-500/50"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-lg"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-10 flex items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Free tier available</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">RELIANCE • NSE</p>
                      <p className="text-sm font-semibold text-white">Breakout at ₹2,510</p>
                      <p className="text-xs text-green-400">+2.5% • High confidence</p>
                    </div>
                    <Bell className="w-5 h-5 text-green-400" />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">INFY • NSE</p>
                      <p className="text-sm font-semibold text-white">Target 1 Hit ₹1,520</p>
                      <p className="text-xs text-blue-400">+4.2% profit locked</p>
                    </div>
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-6 pt-6 border-t border-slate-700">
                    <div className="text-center">
                      <Mail className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Email</p>
                    </div>
                    <div className="text-center">
                      <Smartphone className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">SMS</p>
                    </div>
                    <div className="text-center">
                      <Send className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Telegram</p>
                    </div>
                    <div className="text-center">
                      <MessageSquare className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">WhatsApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-800/30 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">5</div>
              <div className="text-sm text-gray-400">Notification Channels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">30s</div>
              <div className="text-sm text-gray-400">Real-time Updates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">3</div>
              <div className="text-sm text-gray-400">Broker Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <div className="text-sm text-gray-400">Custom Watchlists</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Trade Better
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional features designed for serious traders. From real-time monitoring to automated execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Channel Alerts</h3>
              <p className="text-gray-400 mb-4">
                Get instant notifications via Email, SMS, WhatsApp, Telegram, and Webhooks. Never miss a trading opportunity.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">Email</span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">SMS</span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">Telegram</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-400 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Monitoring</h3>
              <p className="text-gray-400 mb-4">
                30-second real-time monitoring during market hours. Automatic detection of breakouts, targets, and stop losses.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">Real-time</span>
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">Auto-detect</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Custom Watchlists</h3>
              <p className="text-gray-400 mb-4">
                Create unlimited watchlists with complete trading parameters. Entry, stop loss, multiple targets, and more.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">Unlimited</span>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">Customizable</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-green-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Broker Integration</h3>
              <p className="text-gray-400 mb-4">
                Connect Zerodha, Upstox, and Interactive Brokers. Auto-execute trades, manage positions, and track P&L.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Zerodha</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Upstox</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-400 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure & Encrypted</h3>
              <p className="text-gray-400 mb-4">
                Bank-grade encryption for broker credentials. Secure WebSocket connections. Your data is always protected.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">Encrypted</span>
                <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">Secure</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cloud Deployed</h3>
              <p className="text-gray-400 mb-4">
                Hosted on Google Cloud Run. Auto-scaling, 99.9% uptime, global CDN. Access from anywhere, anytime.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full">Cloud</span>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full">Scalable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Telegram (unlimited)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Email (100/day)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Custom watchlists</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Live monitoring</span>
                </li>
              </ul>
              <Link
                to="/dashboard"
                className="block w-full py-3 text-center bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 relative transform scale-105 shadow-2xl shadow-blue-500/50">
              <div className="absolute top-0 right-0 px-4 py-1 bg-white text-blue-600 text-xs font-bold rounded-bl-lg rounded-tr-xl">
                POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$12</span>
                  <span className="text-blue-100">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-0.5" />
                  <span className="text-white">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-0.5" />
                  <span className="text-white">SMS alerts (unlimited)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-0.5" />
                  <span className="text-white">WhatsApp alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-0.5" />
                  <span className="text-white">Broker integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white mt-0.5" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <Link
                to="/dashboard"
                className="block w-full py-3 text-center bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">Custom</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Custom deployment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">Dedicated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300">SLA guarantee</span>
                </li>
              </ul>
              <button className="block w-full py-3 text-center bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Stream Alpha?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join traders who are getting instant alerts and trading smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-lg shadow-blue-500/50"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/yourusername/alphastream"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-lg"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AlphaStream</h3>
                  <p className="text-xs text-cyan-400">v1.0.0</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Professional trading intelligence platform with real-time alerts and automated execution.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 AlphaStream. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/docs/SENDGRID_SETUP.md" className="text-gray-400 hover:text-white transition-colors">Setup Guides</a></li>
                <li><a href="/docs/TESTING_GUIDE.md" className="text-gray-400 hover:text-white transition-colors">Testing</a></li>
                <li><a href="/docs/CLOUD_RUN_DEPLOYMENT.md" className="text-gray-400 hover:text-white transition-colors">Deployment</a></li>
                <li><a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
              <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
