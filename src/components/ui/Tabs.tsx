export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({ tabs, value, onChange }: { tabs: TabItem[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`flex h-11 items-center border-b-[3px] px-3 text-sm ${
              active ? 'border-brand font-semibold text-brand-dark' : 'border-transparent font-medium text-ink-600 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
