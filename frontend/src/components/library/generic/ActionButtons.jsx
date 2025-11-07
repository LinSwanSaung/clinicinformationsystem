import { Button } from '@/components/ui/button';

export default function ActionButtons({
  buttons,
  variant = 'default',
  size = 'default',
  className = '',
  spacing = 'gap-4',
}) {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap ${spacing} ${className}`}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || variant}
          size={button.size || size}
          onClick={button.onClick}
          disabled={button.disabled}
          className={`flex items-center gap-2 ${button.className || ''}`}
        >
          {button.icon && <button.icon className="h-4 w-4" />}
          {button.label}
        </Button>
      ))}
    </div>
  );
}
