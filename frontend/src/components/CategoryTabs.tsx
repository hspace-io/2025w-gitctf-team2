interface CategoryTab {
  value: string;
  label: string;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  activeTab: string;
  onChange: (value: string) => void;
}

const CategoryTabs = ({ tabs, activeTab, onChange }: CategoryTabsProps) => {
  return (
    <div className="border-b border-night">
      <nav className="-mb-px flex space-x-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`tab ${
              activeTab === tab.value
                ? 'tab-active text-night-heading border-[#7c5dfa]'
                : 'text-night-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CategoryTabs;

