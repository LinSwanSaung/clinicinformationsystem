import { useState, useEffect, useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import PageLayout from '../../components/PageLayout';
import { LoadingSpinner, StatusBadge, TableToolbar, ConfirmDialog } from '@/components/library';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Clock,
} from 'lucide-react';
import employeeService from '../../services/employeeService';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // showDeleted replaced by selectedStatus

  // Confirm dialogs state
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null, // 'delete' | 'toggle'
    employeeId: null,
    nextActive: null,
  });

  const openDeleteConfirm = (id) =>
    setConfirmState({ open: true, type: 'delete', employeeId: id, nextActive: null });
  const openToggleConfirm = (id, nextActive) =>
    setConfirmState({ open: true, type: 'toggle', employeeId: id, nextActive });
  const closeConfirm = () =>
    setConfirmState({ open: false, type: null, employeeId: null, nextActive: null });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      let params = {};
      if (selectedStatus === 'active') {
        params = { is_active: true };
      } else if (selectedStatus === 'inactive') {
        params = { is_active: false };
      } else if (selectedStatus === 'deleted') {
        params = { includeDeleted: true };
      } else if (selectedStatus === 'all') {
        params = { includeDeleted: true };
      }
      const [employeesData, rolesData] = await Promise.all([
        // When showDeleted is on, include deleted and do not restrict by is_active
        employeeService.getAllEmployees({ params }),
        employeeService.getRoles(),
      ]);
      setEmployees(employeesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Failed to load employees: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter employees based on search and role (null-safe)
  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter((employee = {}) => {
    const term = (debouncedSearch ?? '').toString().toLowerCase();
    const fullName = `${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`.toLowerCase();
    const email = (employee?.email ?? '').toString().toLowerCase();
    const specialty = (employee?.specialty ?? '').toString().toLowerCase();
    const role = (employee?.role ?? '').toString().toLowerCase();

    const matchesSearch =
      term === ''
        ? true
        : fullName.includes(term) || email.includes(term) || specialty.includes(term);

    const selectedRoleValue = (selectedRole ?? 'all').toString().toLowerCase();
    const matchesRole = selectedRoleValue === 'all' || role === selectedRoleValue;
    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = !employee?.deleted_at && employee?.is_active === true;
    } else if (selectedStatus === 'inactive') {
      matchesStatus = !employee?.deleted_at && employee?.is_active === false;
    } else if (selectedStatus === 'deleted') {
      matchesStatus = !!employee?.deleted_at;
    } else if (selectedStatus === 'all') {
      matchesStatus = true;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteEmployee = async (id) => {
    try {
      await employeeService.deleteEmployee(id);
      // Re-fetch to reflect server truth (tombstone)
      await loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee. Please try again.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const employee = Array.isArray(employees) ? employees.find((emp) => emp.id === id) : null;
      if (!employee) {
        setError('Employee not found');
        return;
      }
      const updatedEmployee = await employeeService.toggleEmployeeStatus(id, !employee.is_active);
      setEmployees(
        Array.isArray(employees)
          ? employees.map((emp) => (emp.id === id ? updatedEmployee : emp))
          : []
      );
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee status. Please try again.');
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
  };

  const handleSaveEdit = async (updatedData, options = {}) => {
    const { keepEditing = false } = options;

    try {
      const updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, updatedData);
      setEmployees(
        Array.isArray(employees)
          ? employees.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp))
          : []
      );

      if (keepEditing) {
        setEditingEmployee((prev) => (prev ? { ...prev, ...updatedEmployee } : prev));
      } else {
        setEditingEmployee(null);
      }

      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee. Please try again.');
      throw error;
    }
  };

  const AddEmployeeForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: '',
      specialty: '',
      phone: '',
      license_number: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError('');

      try {
        const newEmployee = await employeeService.addEmployee(formData);
        setEmployees(Array.isArray(employees) ? [...employees, newEmployee] : [newEmployee]);
        setShowAddForm(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          role: '',
          specialty: '',
          phone: '',
          license_number: '',
        });
      } catch (error) {
        console.error('Error creating employee:', error);
        setFormError(error.message || 'Failed to create employee. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Employee
          </CardTitle>
          <CardDescription>
            Create a new employee account with role and department assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                <Input
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                <Input
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Specialty</label>
                <Input
                  placeholder="Enter specialty (optional)"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <Input
                  placeholder="Enter license number (optional)"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Employee'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const EditEmployeeForm = () => {
    const [formData, setFormData] = useState({
      first_name: editingEmployee?.first_name || '',
      last_name: editingEmployee?.last_name || '',
      email: editingEmployee?.email || '',
      role: editingEmployee?.role || '',
      specialty: editingEmployee?.specialty || '',
      phone: editingEmployee?.phone || '',
      license_number: editingEmployee?.license_number || '',
      new_password: '',
      confirm_password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError('');

      const {
        new_password: newPassword,
        confirm_password: confirmPassword,
        ...profileUpdates
      } = formData;

      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          setFormError('New password and confirmation do not match.');
          setIsSubmitting(false);
          return;
        }
        if ((newPassword || '').length < 6) {
          setFormError('New password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
      }

      try {
        const targetId = editingEmployee?.id;
        await handleSaveEdit(profileUpdates, { keepEditing: true });

        if (targetId && newPassword) {
          await employeeService.resetEmployeePassword(targetId, newPassword);
        }

        setEditingEmployee(null);
      } catch (error) {
        console.error('Error updating employee:', error);
        setFormError(error.message || 'Failed to update employee. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Employee
          </CardTitle>
          <CardDescription>Update employee information and role assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                <Input
                  required
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                <Input
                  required
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  required
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Specialty</label>
                <Input
                  placeholder="Enter specialty (optional)"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <Input
                  placeholder="Enter license number (optional)"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="bg-muted/30 space-y-3 rounded-md border border-dashed border-gray-200 p-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Reset Password</h4>
                <p className="text-xs text-muted-foreground">
                  Leave the fields below blank to keep the current password. Passwords must be at
                  least 6 characters long.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Employee'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout
      title="Employee Management"
      subtitle="Manage clinic staff and their roles"
      fullWidth
    >
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Page Content */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Manage Employees</h2>
          <p className="mt-2 text-muted-foreground">Add, edit, and manage clinic staff members</p>
        </div>

        {/* Add Employee Form */}
        {showAddForm && <AddEmployeeForm />}

        {/* Edit Employee Form */}
        {editingEmployee && <EditEmployeeForm />}

        {/* Controls */}
        <TableToolbar
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search employees..."
          filters={[
            <select
              key="role-filter"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>,
            <div key="status-filter" className="flex items-center gap-2">
              <label className="select-none text-sm text-gray-700">Status</label>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deleted">Deleted</option>
                <option value="all">All</option>
              </select>
            </div>,
          ]}
          actions={
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          }
        />

        {/* Employee List */}
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label="Loading employees" size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card
                key={employee.id}
                className={`transition-shadow hover:shadow-lg ${employee.deleted_at ? 'opacity-75' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                        <span className="font-semibold text-primary">
                          {(employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {employee.first_name} {employee.last_name}
                          {employee.deleted_at && <StatusBadge status="deleted" />}
                        </CardTitle>
                        <p className="text-sm capitalize text-gray-600">{employee.role}</p>
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
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{employee.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Joined: {new Date(employee.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last login:{' '}
                        {employee.last_login
                          ? new Date(employee.last_login).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {employee.specialty || 'General'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          employee.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEmployee(employee)}
                      className="flex-1"
                      disabled={!!employee.deleted_at}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openToggleConfirm(employee.id, !employee.is_active)}
                      className="flex-1"
                      disabled={!!employee.deleted_at}
                    >
                      {employee.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteConfirm(employee.id)}
                      disabled={!!employee.deleted_at}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No employees found</h3>
              <p className="mb-4 text-gray-600">
                {searchTerm || selectedRole !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first employee'}
              </p>
              {!searchTerm && selectedRole === 'all' && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Employee
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirm: Delete Employee */}
        <ConfirmDialog
          isOpen={confirmState.open && confirmState.type === 'delete'}
          onOpenChange={(open) => (open ? null : closeConfirm())}
          onConfirm={() => {
            const id = confirmState.employeeId;
            closeConfirm();
            return handleDeleteEmployee(id);
          }}
          title="Delete employee"
          description="This action will permanently delete the employee record."
          confirmText="Delete"
          variant="destructive"
        />

        {/* Confirm: Toggle Active */}
        <ConfirmDialog
          isOpen={confirmState.open && confirmState.type === 'toggle'}
          onOpenChange={(open) => (open ? null : closeConfirm())}
          onConfirm={() => {
            const id = confirmState.employeeId;
            closeConfirm();
            return handleToggleActive(id);
          }}
          title={confirmState.nextActive ? 'Activate employee' : 'Deactivate employee'}
          description={
            confirmState.nextActive
              ? 'The employee will be marked as active.'
              : 'The employee will be marked as inactive.'
          }
          confirmText={confirmState.nextActive ? 'Activate' : 'Deactivate'}
        />
      </div>
    </PageLayout>
  );
};

export default EmployeeManagement;
