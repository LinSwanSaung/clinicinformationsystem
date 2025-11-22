/**
 * NavigationTabs - Tab navigation component
 *
 * Application-level component for tab navigation with icons and custom styling.
 * Not a base UI primitive - uses base HTML/button elements.
 */
const NavigationTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  tabClassName = '',
  activeTabClassName = 'bg-emerald-600 text-white',
  inactiveTabClassName = 'bg-gray-100 text-gray-700 hover:bg-gray-200',
}) => {
  return (
    <div className={`rounded-lg bg-white p-2 shadow-sm ${className}`}>
      <nav className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? activeTabClassName : inactiveTabClassName} ${tabClassName} `}
          >
            {tab.icon && <tab.icon className="mr-2 inline-block" size={16} />}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavigationTabs;
