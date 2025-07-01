import React from 'react';

const NavigationTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "",
  tabClassName = "",
  activeTabClassName = "bg-emerald-600 text-white",
  inactiveTabClassName = "bg-gray-100 text-gray-700 hover:bg-gray-200"
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-2 ${className}`}>
      <nav className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 rounded-lg font-medium text-sm transition-colors
              ${activeTab === tab.id ? activeTabClassName : inactiveTabClassName}
              ${tabClassName}
            `}
          >
            {tab.icon && <tab.icon className="inline-block mr-2" size={16} />}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavigationTabs;
