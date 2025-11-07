import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, actionButton, className = '', children }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-4">
        {actionButton && (
          <Link to={actionButton.href}>
            <Button
              className={`flex items-center gap-3 ${actionButton.className || 'hover:bg-primary/90 bg-primary px-8 py-6 text-lg text-primary-foreground'}`}
            >
              {actionButton.icon && <actionButton.icon className="h-6 w-6" />}
              {actionButton.label}
            </Button>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
