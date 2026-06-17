import { Card, CardContent } from '@/components/ui/Card';

export function PagePlaceholder({ title, description, endpoints = [] }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            UI for this module will be built in <strong>Phase 12</strong>. The backend API and RTK Query hooks are already wired and ready to use.
          </p>
          {endpoints.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Available endpoints</div>
              <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                {endpoints.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
