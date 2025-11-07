import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, UserCheck, UserX, Mail, Phone, Calendar, Clock } from 'lucide-react';

export default function EmployeeCard({ employee, onEdit, onToggleActive, onDelete }) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <div className="space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <span className="font-semibold text-primary">
                {(employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm capitalize text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {employee.is_active ? (
              <UserCheck className="h-4 w-4 text-green-600" />
            ) : (
              <UserX className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{employee.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined: {new Date(employee.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last login:{' '}
              {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Status and Specialty */}
        <div className="border-t pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {employee.specialty || 'General'}
            </span>
            <Badge variant={employee.is_active ? 'default' : 'destructive'}>
              {employee.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(employee)} className="flex-1">
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleActive(employee.id)}
            className="flex-1"
          >
            {employee.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(employee.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
