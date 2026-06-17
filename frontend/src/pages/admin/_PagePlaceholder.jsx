import { Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';

export function PagePlaceholder({ title, description, endpoints = [] }) {
  return (
    <div className="space-y-4">
      <Reveal animation="fade-up">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </Reveal>
      <Reveal animation="fade-up" delay={80}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary animate-scale-in">
                <Wrench className="h-5 w-5 animate-float" />
              </span>
              <p className="text-sm text-muted-foreground">
                UI for this module will be built in <strong>Phase 12</strong>. The backend API and RTK Query hooks are already wired and ready to use.
              </p>
            </div>
            {endpoints.length > 0 && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Available endpoints</div>
                <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                  {endpoints.map((e, i) => (
                    <li key={e} className="animate-fade-up-sm" style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
