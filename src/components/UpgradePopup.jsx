import React from 'react';

const UpgradePopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleUpgrade = (plan) => {
    // Handle upgrade logic here
    console.log('Upgrading to:', plan);
    // You can add payment integration here
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Limit Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  You've reached your free plan limit!
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You've generated 5 mind maps with your free account. Upgrade to continue creating unlimited mind maps with additional features.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pro Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">$15</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">Perfect for professionals and growing businesses</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Unlimited mindmap generations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Advanced AI insights</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Export to PDF/PNG</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Cloud storage & sync</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => handleUpgrade('pro-monthly')}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Upgrade to Pro
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Or save with annual billing:</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">$120</span>
                    <span className="text-gray-600">/year</span>
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Save $60
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpgrade('pro-yearly')}
                    className="mt-2 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Choose Annual
                  </button>
                </div>
              </div>
            </div>

            {/* One-time Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">One-time Plan</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">$299</span>
                  <span className="text-gray-600">/lifetime</span>
                </div>
                <p className="text-gray-600 mb-6">Pay once, use forever</p>
                
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Lifetime access</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Unlimited mindmap generations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">All Pro features included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Future updates included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">No recurring payments</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => handleUpgrade('lifetime')}
                  className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Get Lifetime Access
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>All plans include a 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePopup;