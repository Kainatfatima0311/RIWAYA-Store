import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function FilterBar({ children, search, onSearch, placeholder = 'Search…' }) {
  return (
    <div className="bg-card border rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3 animate-fade-up-sm">
      {onSearch !== undefined && (
        <div className="relative flex-1 min-w-[220px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-9" />
        </div>
      )}
      {children}
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
