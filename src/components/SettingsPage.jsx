import React, { useState, useEffect } from 'react';
import { logOut } from '../firebase';

const SettingsPage = ({ user, onBack }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoSave: true,
    notifications: true,
    defaultViewMode: 'flowchart',
    enhancePrompts: true,
    saveToCloud: true,
    language: 'en',
    zoomSensitivity: 'medium',
    autoFitMindMap: true,
    showTutorials: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(`zolopilot_settings_${user?.uid || 'anonymous'}`);
    if (savedSettings) {
      setSettings(prev => ({
        ...prev,
        ...JSON.parse(savedSettings)
      }));
    }
  }, [user]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      // Save to localStorage immediately
      localStorage.setItem(`zolopilot_settings_${user?.uid || 'anonymous'}`, JSON.stringify(newSettings));
      
      return newSettings;
    });
    
    // Show confirmation message
    setMessage('Settings saved successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logOut();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      // Clear all ZoloPilot related localStorage items
      const keys = Object.keys(localStorage).filter(key => key.startsWith('zolopilot_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      setMessage('All local data cleared successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const exportData = () => {
    try {
      const data = {
        settings,
        mindMaps: JSON.parse(localStorage.getItem('zolopilot_savedMindMaps') || '[]'),
        profile: JSON.parse(localStorage.getItem(`zolopilot_profile_${user?.uid}`) || '{}'),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zolopilot-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('Data exported successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to export data: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        enabled ? 'bg-purple-600' : 'bg-slate-600'
      }`}
      disabled={disabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SelectDropdown = ({ value, onChange, options, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {options.map(option => (
        <option key={option.value} value={option.value} className="bg-slate-800">
          {option.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-white hover:text-purple-300 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              title="Back to Generation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 text-green-200 rounded-lg">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>General</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Auto Save</h3>
                  <p className="text-gray-400 text-sm">Automatically save your work as you type</p>
                </div>
                <ToggleSwitch
                  enabled={settings.autoSave}
                  onChange={(value) => handleSettingChange('autoSave', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Notifications</h3>
                  <p className="text-gray-400 text-sm">Show system notifications</p>
                </div>
                <ToggleSwitch
                  enabled={settings.notifications}
                  onChange={(value) => handleSettingChange('notifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Default View Mode</h3>
                  <p className="text-gray-400 text-sm">Choose your preferred mind map view</p>
                </div>
                <SelectDropdown
                  value={settings.defaultViewMode}
                  onChange={(value) => handleSettingChange('defaultViewMode', value)}
                  options={[
                    { value: 'flowchart', label: 'Mindmap' },
                    { value: 'list', label: 'List View' }
                  ]}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Language</h3>
                  <p className="text-gray-400 text-sm">Interface language</p>
                </div>
                <SelectDropdown
                  value={settings.language}
                  onChange={(value) => handleSettingChange('language', value)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                    { value: 'fr', label: 'Français' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'zh', label: '中文' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* AI & Generation Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI & Generation</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Enhance Prompts</h3>
                  <p className="text-gray-400 text-sm">Use AI to improve your input prompts</p>
                </div>
                <ToggleSwitch
                  enabled={settings.enhancePrompts}
                  onChange={(value) => handleSettingChange('enhancePrompts', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Save to Cloud</h3>
                  <p className="text-gray-400 text-sm">Automatically sync mind maps to cloud</p>
                </div>
                <ToggleSwitch
                  enabled={settings.saveToCloud}
                  onChange={(value) => handleSettingChange('saveToCloud', value)}
                  disabled={!user || user.isAnonymous}
                />
              </div>
            </div>
          </div>

          {/* Interface Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              <span>Interface</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Zoom Sensitivity</h3>
                  <p className="text-gray-400 text-sm">Mouse wheel zoom sensitivity</p>
                </div>
                <SelectDropdown
                  value={settings.zoomSensitivity}
                  onChange={(value) => handleSettingChange('zoomSensitivity', value)}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Auto Fit Mind Map</h3>
                  <p className="text-gray-400 text-sm">Automatically fit mind map to view</p>
                </div>
                <ToggleSwitch
                  enabled={settings.autoFitMindMap}
                  onChange={(value) => handleSettingChange('autoFitMindMap', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Show Tutorials</h3>
                  <p className="text-gray-400 text-sm">Display helpful tips and tutorials</p>
                </div>
                <ToggleSwitch
                  enabled={settings.showTutorials}
                  onChange={(value) => handleSettingChange('showTutorials', value)}
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span>Data Management</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Export Data</h3>
                  <p className="text-gray-400 text-sm">Download all your data as JSON</p>
                </div>
                <button
                  onClick={exportData}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  Export
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Clear Local Data</h3>
                  <p className="text-gray-400 text-sm">Remove all locally stored data</p>
                </div>
                <button
                  onClick={clearAllData}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          {user && !user.isAnonymous && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Account</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Sign Out</h3>
                    <p className="text-gray-400 text-sm">Sign out of your account</p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Sign Out</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to sign out? Your local data will be preserved.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;