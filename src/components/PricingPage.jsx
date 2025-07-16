import { useState } from 'react'

function PricingPage({ onBack }) {
  const [isYearly, setIsYearly] = useState(false)

  const handleGetStarted = () => {
    // Navigate to registration/app access for Free Plan
    console.log('Navigating to Free Plan registration')
  }

  const handleUpgradeNow = () => {
    // Navigate to payment/subscription page with selected billing cycle
    const billingCycle = isYearly ? 'yearly' : 'monthly'
    console.log(`Navigating to Pro Plan subscription: ${billingCycle}`)
  }

  const handleGetLifetimeAccess = () => {
    // Navigate to one-time payment page for lifetime access
    console.log('Navigating to One-time Plan purchase')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/20 to-black/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,30,0.15),transparent_70%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6">
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-4 md:px-6 py-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Choose Your <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Perfect Plan</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Transform your ideas into billion-dollar roadmaps with our AI-powered strategic planning tools
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl hover:border-slate-600/50 transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Free Plan</h3>
                  <div className="text-4xl font-bold text-white mb-2">Free</div>
                  <p className="text-slate-400">Perfect for getting started</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-300">Generate up to 5 mindmaps</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-300">Basic editing & basic cloud saving</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-300">1 PDF export per month</span>
                  </li>
                </ul>
                
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200 border border-slate-600 hover:border-slate-500"
                >
                  Get Started
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-b from-purple-900/50 to-purple-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/50 p-8 shadow-2xl hover:border-purple-400/50 transition-all duration-300 relative">
                {/* Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Pro Plan</h3>
                  
                  {/* Monthly/Yearly Toggle */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={() => setIsYearly(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        !isYearly 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setIsYearly(true)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isYearly 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                  
                  <div className="text-4xl font-bold text-white mb-2">
                    {isYearly ? '$120/year' : '$15/month'}
                  </div>
                  {isYearly && (
                    <div className="text-green-400 text-sm font-medium mb-2">
                      Save 33% with yearly billing
                    </div>
                  )}
                  <p className="text-purple-200">For growing businesses</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-purple-100">Unlimited mindmap generations</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-purple-100">Advanced editing, unlimited PDF exports & version history</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-purple-100">Priority support & advanced organization</span>
                  </li>
                </ul>
                
                <button
                  onClick={handleUpgradeNow}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                >
                  Upgrade Now
                </button>
              </div>

              {/* One-time Plan */}
              <div className="bg-gradient-to-b from-amber-900/50 to-amber-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/50 p-8 shadow-2xl hover:border-amber-400/50 transition-all duration-300 relative">
                {/* Limited Time Offer Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Limited Time Offer
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">One-time Plan</h3>
                  <div className="text-4xl font-bold text-white mb-2">$299</div>
                  <p className="text-amber-200">Lifetime access - pay once, use forever</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-100">All features of the Pro Plan</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-100">Lifetime access to mindmap generation & advanced editing</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-100">Dedicated priority support</span>
                  </li>
                </ul>
                
                <button
                  onClick={handleGetLifetimeAccess}
                  className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
                >
                  Get Lifetime Access
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="text-center mt-12">
              <p className="text-slate-400 text-lg mb-4">
                All plans include our core AI-powered mind mapping technology
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPage