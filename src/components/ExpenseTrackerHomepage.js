import { useState, useEffect } from 'react';
import { 
    ArrowRight, 
    TrendingUp, 
    PieChart, 
    BarChart3, 
    Zap, 
    Shield, 
    Cloud, 
    Brain, 
    IndianRupee, 
    CreditCard, 
    Pizza,
    Car, 
    Home, 
    Plus, 
    ArrowUpRight 
} from 'lucide-react';

const ExpenseTrackerHomepage = () => {
  const [animatedValues, setAnimatedValues] = useState({ spent: 0, saved: 0, budget: 0 });
  const [currentTransaction, setCurrentTransaction] = useState(0);
  const [chartData, setChartData] = useState([
    { category: 'Food', amount: 0, color: 'bg-emerald-500' },
    { category: 'Transport', amount: 0, color: 'bg-blue-500' },
    { category: 'Shopping', amount: 0, color: 'bg-purple-500' },
    { category: 'Bills', amount: 0, color: 'bg-orange-500' }
  ]);

  const transactions = [
    { icon: Pizza, name: 'Swiggy', amount: -360, category: 'Food' },
    { icon: Car, name: 'Uber', amount: -450, category: 'Transport' },
    { icon: CreditCard, name: 'Amazon', amount: -2998, category: 'Shopping' },
    { icon: Home, name: 'Rent', amount: -12000, category: 'Bills' }
  ];

  // Animate values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues({ spent: 2847, saved: 1250, budget: 3500 });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Animate transactions and chart
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTransaction(prev => (prev + 1) % transactions.length);
      
      // Update chart data based on current transaction
      const transaction = transactions[currentTransaction];
      setChartData(prev => prev.map(item => {
        if (item.category === transaction.category) {
          return { ...item, amount: Math.abs(transaction.amount) };
        }
        return { ...item, amount: item.amount * 0.9 }; // Fade other categories
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTransaction]);

  const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
      let start = 0;
      const end = value;
      const duration = 1500;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [value]);
    
    return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
  };

  const FloatingMoney = ({ delay = 0 }) => (
    <div 
      className="absolute animate-pulse"
      style={{
        animationDelay: `${delay}ms`,
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 80}%`
      }}
    >
      <IndianRupee className="w-6 h-6 text-blue-400 opacity-30" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-grey-500 to-slate-900 text-white overflow-hidden bg-fixed">
      {/* Floating Money Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <FloatingMoney key={i} delay={i * 200} />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center mt-12 lg:mt-8">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent leading-tight">
                Take Control of Your Money
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed">
                Track expenses, visualize spending patterns, and make smarter financial decisions with beautiful insights and AI-powered suggestions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-xl p-0 text-white relative overflow-hidden hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                <a href="/dashboard" className="group relative z-10 px-8 py-4 font-semibold text-lg flex items-center justify-center w-full">
                    Start Free Trial
                    <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
              </div>
              <button className="border border-blue-500/50 hover:border-blue-400 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-blue-500/10 backdrop-blur-sm">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  <AnimatedNumber value={animatedValues.spent} prefix="$" />
                </div>
                <div className="text-slate-400 text-sm">Monthly Spending</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  <AnimatedNumber value={animatedValues.saved} prefix="$" />
                </div>
                <div className="text-slate-400 text-sm">Money Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300">
                  <AnimatedNumber value={animatedValues.budget} prefix="$" />
                </div>
                <div className="text-slate-400 text-sm">Budget Goal</div>
              </div>
            </div>
          </div>

          {/* Right - Animated Dashboard Preview */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-800/30 via-purple-800/30 to-blue-800/30 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-2xl font-bold">Your Dashboard</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>

              {/* Live Transaction Feed */}
              <div className="space-y-4 mb-8 relative z-10">
                <h4 className="text-lg font-semibold text-slate-300">Recent Transactions</h4>
                {transactions.map((transaction, index) => {
                  const Icon = transaction.icon;
                  const isActive = index === currentTransaction;
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 scale-105' 
                          : 'bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.name}</div>
                          <div className="text-sm text-slate-400">{transaction.category}</div>
                        </div>
                      </div>
                      <div className={`font-bold ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                        {transaction.amount < 0 ? '-' : '+'}₹{Math.abs(transaction.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Animated Chart */}
              <div className="space-y-4 relative z-10">
                <h4 className="text-lg font-semibold text-slate-300">Spending by Category</h4>
                <div className="space-y-3">
                  {chartData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-medium">₹{item.amount.toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${item.color}`}
                          style={{ width: `${(item.amount) / 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Everything you need to manage money
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your finances with minimal effort
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Insights',
                description: 'Smart categorization and spending pattern analysis that learns from your habits',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: BarChart3,
                title: 'Beautiful Visualizations',
                description: 'Interactive charts and graphs that make your financial data easy to understand',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Zap,
                title: 'Real-time Tracking',
                description: 'Instant expense recording with automatic sync across all your devices',
                color: 'from-emerald-500 to-teal-500'
              },
              {
                icon: Shield,
                title: 'Bank-level Security',
                description: 'Your financial data is encrypted and protected with industry-standard security',
                color: 'from-orange-500 to-red-500'
              },
              {
                icon: PieChart,
                title: 'Budget Management',
                description: "Set spending limits and get alerts when you're approaching your budget",
                color: 'from-indigo-500 to-purple-500'
              },
              {
                icon: Cloud,
                title: 'Cloud Sync',
                description: 'Access your data anywhere, anytime with automatic cloud synchronization',
                color: 'from-teal-500 to-green-500'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-slate-800/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-800/10 to-purple-800/10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Start tracking in 3 simple steps
          </h2>
          <p className="text-xl text-slate-400 mb-16 max-w-3xl mx-auto">
            Get started with your expense tracking journey in minutes, not hours
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Add Your Expenses',
                description: 'Simply enter what you spent - our AI will categorize and organize everything automatically',
                icon: Plus
              },
              {
                step: '02',
                title: 'Get Smart Insights',
                description: 'Watch as patterns emerge and receive personalized suggestions to optimize your spending',
                icon: TrendingUp
              },
              {
                step: '03',
                title: 'Make Better Decisions',
                description: 'Use beautiful charts and reports to understand your money flow and plan your budget',
                icon: BarChart3
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <div className="bg-gradient-to-br from-blue-800/20 via-purple-800/20 to-blue-800/20 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-blue-400 relative z-10" />
                  <h3 className="text-2xl font-bold mb-4 relative z-10">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed relative z-10">{item.description}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-6 w-8 h-8 text-blue-500/60" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Start your financial journey today
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Join thousands of users who have taken control of their finances with our expense tracker
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-xl p-0 text-white relative overflow-hidden hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <a href="/dashboard" className="group relative z-10 px-12 py-6 font-bold text-xl flex items-center justify-center">
                  Get Started Free
                  <ArrowUpRight className="inline-block ml-2 w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
            <button className="border-2 border-blue-500/50 hover:border-blue-400 px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:bg-blue-500/10 backdrop-blur-sm">
              View Demo
            </button>
          </div>
          
          <p className="text-sm text-slate-500 mt-8">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                ExpenseTracker
              </h3>
              <p className="text-slate-400 max-w-md">
                The most intuitive way to track expenses and take control of your financial future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 ExpenseTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExpenseTrackerHomepage;