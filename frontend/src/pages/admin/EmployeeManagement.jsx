import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import PageLayout from '../../components/PageLayout';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';
import employeeService from '../../services/employeeService';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [employeesData, rolesData] = await Promise.all([
          employeeService.getAllEmployees(),
          employeeService.getRoles()
        ]);
        setEmployees(employeesData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load employees: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter employees based on search and role
  const filteredEmployees = Array.isArray(employees) ? employees.filter(employee => {
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.specialty && employee.specialty.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    return matchesSearch && matchesRole;
  }) : [];

  const handleDeleteEmployee = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        setEmployees(Array.isArray(employees) ? employees.filter(emp => emp.id !== id) : []);
      } catch (error) {
        console.error('Error deleting employee:', error);
        setError('Failed to delete employee. Please try again.');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const employee = Array.isArray(employees) ? employees.find(emp => emp.id === id) : null;
      if (!employee) {
        setError('Employee not found');
        return;
      }
      const updatedEmployee = await employeeService.toggleEmployeeStatus(id, !employee.is_active);
      setEmployees(Array.isArray(employees) ? employees.map(emp => 
        emp.id === id ? updatedEmployee : emp
      ) : []);
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

  const handleSaveEdit = async (updatedData) => {
    try {
      const updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, updatedData);
      setEmployees(Array.isArray(employees) ? employees.map(emp => 
        emp.id === editingEmployee.id ? updatedEmployee : emp
      ) : []);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee. Please try again.');
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
      license_number: ''
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
          license_number: '' 
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
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  First Name
                </label>
                <Input
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Last Name
                </label>
                <Input
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Role
                </label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Specialty
                </label>
                <Input
                  placeholder="Enter specialty (optional)"
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone Number
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  License Number
                </label>
                <Input
                  placeholder="Enter license number (optional)"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
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
      license_number: editingEmployee?.license_number || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError('');
      
      try {
        await handleSaveEdit(formData);
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
          <CardDescription>
            Update employee information and role assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  required
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  required
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  required
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  disabled={isSubmitting}
                >
                  <option value="">Select role</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <Input
                  placeholder="Enter specialty (optional)"
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <Input
                  placeholder="Enter license number (optional)"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  disabled={isSubmitting}
                />
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
          <p className="text-muted-foreground mt-2">Add, edit, and manage clinic staff members</p>
        </div>

        {/* Add Employee Form */}
        {showAddForm && <AddEmployeeForm />}

        {/* Edit Employee Form */}
        {editingEmployee && <EditEmployeeForm />}

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {(employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {employee.first_name} {employee.last_name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{employee.role}</p>
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
                      <span>Last login: {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {employee.specialty || 'General'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
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
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleActive(employee.id)}
                      className="flex-1"
                    >
                      {employee.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteEmployee(employee.id)}
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedRole !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : 'Get started by adding your first employee'
                }
              </p>
              {!searchTerm && selectedRole === 'all' && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Employee
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        </div>
    </PageLayout>
  );
};

export default EmployeeManagement;
