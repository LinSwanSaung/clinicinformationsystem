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
  activeTabClassName = 'bg-primary text-primary-foreground',
  inactiveTabClassName = 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
}) => {
  return (
    <div className={`rounded-lg bg-card p-2 shadow-sm ${className}`}>
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
