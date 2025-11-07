import { Card } from '@/components/ui/card';

export default function LoadingCard({ message = 'Loading...' }) {
  return (
    <Card className="bg-card p-12 text-center">
      <p className="text-xl text-muted-foreground">{message}</p>
    </Card>
  );
}
