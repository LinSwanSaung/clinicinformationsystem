import React, { useEffect, useMemo, useRef, useState } from 'react';
import useDebounce from '@/utils/useDebounce';
import PageLayout from '@/components/PageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Link as LinkIcon, Unlink, Users, Search, Plus } from 'lucide-react';
import patientAccountService from '@/services/patientAccountService';
import api from '@/services/api';

const defaultAccountForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'patient',
  password: '',
  confirmPassword: ''
};

const PatientAccountRegistration = () => {
  const [accounts, setAccounts] = useState([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(defaultAccountForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  const [bindPatientQuery, setBindPatientQuery] = useState('');
  const [bindLookupError, setBindLookupError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bindSuggestions, setBindSuggestions] = useState([]);
  const [bindSuggestionsOpen, setBindSuggestionsOpen] = useState(false);
  const [bindSearching, setBindSearching] = useState(false);
  const debouncedBindQuery = useDebounce(bindPatientQuery, 300);
  const lastManualBindQueryRef = useRef('');
  const bindInputBlurTimeout = useRef(null);

  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearch, 300);
  const [patientResults, setPatientResults] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [binding, setBinding] = useState(false);

  const loadAccounts = async (search = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await patientAccountService.list({
        search: search.trim() || undefined
      });
      setAccounts(Array.isArray(response.data) ? response.data : []);
      setTotalAccounts(response.total ?? 0);
    } catch (err) {
      console.error('Failed to load patient accounts:', err);
      setError(err.message || 'Failed to load patient accounts.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts(debouncedSearch);
  }, [debouncedSearch]);

  const handleCreateFieldChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearBindBlurTimeout = () => {
    if (bindInputBlurTimeout.current) {
      clearTimeout(bindInputBlurTimeout.current);
      bindInputBlurTimeout.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearBindBlurTimeout();
    };
  }, []);

  const resetCreateForm = () => {
    clearBindBlurTimeout();
    setCreateForm(defaultAccountForm);
    setCreateSuccess('');
    setCreateError('');
    setBindPatientQuery('');
    setBindLookupError('');
    setSelectedPatient(null);
    setBindSuggestions([]);
    setBindSuggestionsOpen(false);
    setBindSearching(false);
    lastManualBindQueryRef.current = '';
  };

  const handleSelectBindSuggestion = (patient) => {
    if (!patient) return;
    clearBindBlurTimeout();
    setSelectedPatient(patient);
    if (patient.patient_number) {
      setBindPatientQuery(patient.patient_number);
    } else {
      const name = [patient.first_name, patient.last_name].filter(Boolean).join(' ').trim();
      setBindPatientQuery(name || '');
    }
    setBindLookupError('');
    setBindSuggestions([]);
    setBindSuggestionsOpen(false);
    lastManualBindQueryRef.current = '';
  };

  const handleBindByQuery = async () => {
    clearBindBlurTimeout();
    const query = bindPatientQuery.trim();
    if (!query) {
      setBindLookupError('Enter a patient number or name to search.');
      setSelectedPatient(null);
      setBindSuggestions([]);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const matchFromSuggestions = bindSuggestions.find((patient) => {
      const numberMatch =
        patient.patient_number &&
        patient.patient_number.toString().toLowerCase() === normalizedQuery;
      const nameMatch = [patient.first_name, patient.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
        .toLowerCase() === normalizedQuery;
      return numberMatch || nameMatch;
    });

    if (matchFromSuggestions) {
      handleSelectBindSuggestion(matchFromSuggestions);
      return;
    }

    try {
      setBindLookupError('');
      setBindSearching(true);
      lastManualBindQueryRef.current = normalizedQuery;
      const response = await api.get('/patients', {
        params: {
          search: query,
          limit: 8
        }
      });
      const patients = Array.isArray(response?.data) ? response.data : [];
      if (!patients.length) {
        setBindLookupError('No patient found with that query.');
        setSelectedPatient(null);
        setBindSuggestions([]);
        setBindSuggestionsOpen(true);
        return;
      }

      if (patients.length === 1) {
        handleSelectBindSuggestion(patients[0]);
        return;
      }

      setBindSuggestions(patients);
      setBindSuggestionsOpen(true);
      setSelectedPatient(null);
      setBindLookupError('Multiple patients found. Select one from the suggestions.');
    } catch (err) {
      console.error('Failed to look up patient:', err);
      setBindLookupError(err.message || 'Failed to search for patient.');
      setSelectedPatient(null);
      lastManualBindQueryRef.current = '';
    } finally {
      setBindSearching(false);
    }
  };

  useEffect(() => {
    if (!bindSuggestionsOpen) {
      return;
    }

    const term = debouncedBindQuery.trim();
    if (!term) {
      setBindSuggestions([]);
      setBindSearching(false);
      return;
    }

    const normalizedTerm = term.toLowerCase();
    if (lastManualBindQueryRef.current === normalizedTerm) {
      lastManualBindQueryRef.current = '';
      return;
    }

    let isCancelled = false;
    const fetchSuggestions = async () => {
      setBindSearching(true);
      try {
        const response = await api.get('/patients', {
          params: {
            search: term,
            limit: 8
          }
        });
        if (isCancelled) return;
        const patients = Array.isArray(response?.data) ? response.data : [];
        setBindSuggestions(patients);
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to search patients for binding:', err);
        setBindLookupError((prev) => prev || err.message || 'Failed to search for patient.');
        setBindSuggestions([]);
      } finally {
        if (!isCancelled) {
          setBindSearching(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [debouncedBindQuery, bindSuggestionsOpen]);

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setCreateSuccess('');
    setCreateError('');

    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Passwords do not match.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        phone: createForm.phone || undefined,
        role: createForm.role || 'patient'
      });

      const newAccount = response?.data;

      if (selectedPatient && newAccount?.id) {
        try {
          await patientAccountService.bindAccount(newAccount.id, selectedPatient.id);
        } catch (bindErr) {
          console.error('Failed to link patient after creating account:', bindErr);
          setCreateError(bindErr.message || 'Account created but failed to link patient.');
        }
      }

      setCreateSuccess(`Created patient account for ${createForm.first_name} ${createForm.last_name}`);
      await loadAccounts(debouncedSearch);
      resetCreateForm();
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create patient account:', err);
      setCreateError(err.message || 'Failed to create patient account.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openBindDialog = (account) => {
    setSelectedAccount(account);
    setSelectedPatient(account?.patient || null);
    setPatientSearch('');
    setPatientResults([]);
    setPatientError('');
    setBindDialogOpen(true);
  };

  const closeBindDialog = () => {
    setBindDialogOpen(false);
    setSelectedAccount(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setPatientError('');
  };

  const loadPatients = async (term) => {
    if (!bindDialogOpen) return;
    try {
      setPatientLoading(true);
      setPatientError('');
      const response = await api.get('/patients', {
        params: {
          search: term?.trim() || undefined,
          limit: 15
        }
      });
      const patients = response?.data || [];
      setPatientResults(Array.isArray(patients) ? patients : []);
    } catch (err) {
      console.error('Failed to search patients:', err);
      setPatientError(err.message || 'Failed to fetch patients.');
      setPatientResults([]);
    } finally {
      setPatientLoading(false);
    }
  };

  useEffect(() => {
    if (!bindDialogOpen) return;
    loadPatients(debouncedPatientSearch);
  }, [debouncedPatientSearch, bindDialogOpen]);

  const handleBindAccount = async () => {
    if (!selectedAccount || !selectedPatient) {
      setPatientError('Select a patient to bind.');
      return;
    }

    setBinding(true);
    try {
      const response = await patientAccountService.bindAccount(selectedAccount.id, selectedPatient.id);
      const updated = response?.data;
      if (updated) {
        setAccounts((prev) => prev.map((account) => (account.id === updated.id ? updated : account)));
      }
      closeBindDialog();
    } catch (err) {
      console.error('Failed to bind patient account:', err);
      setPatientError(err.message || 'Failed to bind account.');
    } finally {
      setBinding(false);
    }
  };

  const handleUnbindAccount = async (account) => {
    if (!account) return;
    try {
      const response = await patientAccountService.unbindAccount(account.id);
      const updated = response?.data;
      if (updated) {
        setAccounts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
    } catch (err) {
      console.error('Failed to unbind account:', err);
      setError(err.message || 'Failed to unbind account.');
    }
  };

  const accountRows = useMemo(() => {
    return accounts.map((account) => {
      const isLinked = Boolean(account.patient);
      return (
        <TableRow key={account.id}>
          <TableCell className="font-medium">
            {account.first_name} {account.last_name}
          </TableCell>
          <TableCell>{account.email}</TableCell>
          <TableCell>{account.phone ? account.phone : 'Not provided'}</TableCell>
          <TableCell>
            {isLinked ? (
              <div className="flex flex-col">
                <Badge className="w-fit mb-1" variant="secondary">
                  Linked
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {account.patient?.patient_number} - {account.patient?.first_name} {account.patient?.last_name}
                </span>
              </div>
            ) : (
              <Badge variant="outline">Unlinked</Badge>
            )}
          </TableCell>
          <TableCell>
            <span className="text-sm text-muted-foreground">
              {account.last_login ? new Date(account.last_login).toLocaleString() : 'Never'}
            </span>
          </TableCell>
          <TableCell className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openBindDialog(account)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              {account.patient ? 'Re-link' : 'Bind'}
            </Button>
            {account.patient && (
              <Button size="sm" variant="ghost" onClick={() => handleUnbindAccount(account)}>
                <Unlink className="h-4 w-4 mr-2" />
                Unbind
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    });
  }, [accounts]);

  return (
    <PageLayout
      title="Patient Account Management"
      subtitle="Create patient portal accounts and link them to existing patient records."
    >
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Patient Accounts
              </CardTitle>
              <CardDescription>
                {totalAccounts} accounts found. Use the search box to locate accounts by name or email.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Patient Account
              </Button>
              <Button variant="outline" onClick={() => loadAccounts(debouncedSearch)} disabled={loading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or email"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Linked Patient</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[210px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Loading patient accounts...
                      </TableCell>
                    </TableRow>
                  ) : accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No patient accounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountRows
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              resetCreateForm();
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Patient Account</DialogTitle>
              <DialogDescription>
                Generate login credentials for a patient. They will still need to link their account with the correct patient record.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={createForm.first_name}
                    onChange={handleCreateFieldChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={createForm.last_name}
                    onChange={handleCreateFieldChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateFieldChange}
                  required
                  placeholder="patient@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={createForm.phone}
                  onChange={handleCreateFieldChange}
                  placeholder="+95 9 123 456 789"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Account Role</Label>
                <select
                  id="role"
                  name="role"
                  value={createForm.role}
                  onChange={handleCreateFieldChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled
                >
                  <option value="patient">Patient</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Patient accounts are limited to the patient role.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bindPatient">Link to Patient (optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="bindPatient"
                      className="w-full"
                      placeholder="Enter patient number or name"
                      value={bindPatientQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        clearBindBlurTimeout();
                        setBindPatientQuery(value);
                        const hasValue = Boolean(value.trim());
                        setBindSuggestionsOpen(hasValue);
                        if (!hasValue) {
                          setBindSuggestions([]);
                          lastManualBindQueryRef.current = '';
                        }
                        if (bindLookupError) setBindLookupError('');
                        if (selectedPatient) setSelectedPatient(null);
                      }}
                      onFocus={() => {
                        clearBindBlurTimeout();
                        if (bindPatientQuery.trim()) {
                          setBindSuggestionsOpen(true);
                        }
                      }}
                      onBlur={() => {
                        clearBindBlurTimeout();
                        bindInputBlurTimeout.current = setTimeout(() => {
                          setBindSuggestionsOpen(false);
                          setBindSuggestions([]);
                          bindInputBlurTimeout.current = null;
                        }, 150);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleBindByQuery();
                        }
                      }}
                    />
                    {bindSuggestionsOpen && bindPatientQuery.trim() && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
                        {bindSearching ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Searching patients...
                          </div>
                        ) : bindSuggestions.length > 0 ? (
                          <ul className="max-h-56 overflow-y-auto">
                            {bindSuggestions.map((patient) => {
                              const displayName = [patient.first_name, patient.last_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim() || 'Unknown patient';
                              const meta = [];
                              if (patient.patient_number) {
                                meta.push(`ID: ${patient.patient_number}`);
                              }
                              if (patient.date_of_birth) {
                                meta.push(`DOB: ${patient.date_of_birth}`);
                              }
                              return (
                                <li
                                  key={patient.id}
                                  className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    handleSelectBindSuggestion(patient);
                                  }}
                                >
                                  <div className="font-medium">{displayName}</div>
                                  {meta.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {meta.join(' | ')}
                                    </div>
                                  )}
                                  {patient.phone && (
                                    <div className="text-xs text-muted-foreground">
                                      {patient.phone}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No patients found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={handleBindByQuery}>
                    Bind
                  </Button>
                </div>
                {bindLookupError && (
                  <p className="text-sm text-red-600">{bindLookupError}</p>
                )}
                {selectedPatient && !bindLookupError && (
                  <p className="text-sm text-muted-foreground">
                    Selected patient: {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.patient_number})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={createForm.password}
                    onChange={handleCreateFieldChange}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={handleCreateFieldChange}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {createError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}
              {createSuccess && (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <DialogFooter className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { resetCreateForm(); setIsCreateDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubmitting}>
                  {createSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={bindDialogOpen} onOpenChange={(open) => { if (!open) closeBindDialog(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bind Patient Account</DialogTitle>
              <DialogDescription>
                {selectedAccount
                  ? <>Link <strong>{`${selectedAccount.first_name} ${selectedAccount.last_name}`}</strong> to a patient record.</>
                  : 'Select a patient record to associate with this account.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patient-search">Search Patients</Label>
                <Input
                  id="patient-search"
                  placeholder="Search by name, patient number, or phone"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                />
              </div>

              {patientError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <span>{patientError}</span>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-md border">
                {patientLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Searching patients...</div>
                ) : patientResults.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No patients found.</div>
                ) : (
                  <ul className="divide-y">
                    {patientResults.map((patient) => {
                      const isSelected = selectedPatient && selectedPatient.id === patient.id;
                      const rowClass = isSelected
                        ? 'p-4 cursor-pointer transition-colors bg-primary/10 border-l-4 border-primary'
                        : 'p-4 cursor-pointer transition-colors hover:bg-muted';
                      return (
                        <li
                          key={patient.id}
                          className={rowClass}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <div className="font-medium">
                            {patient.first_name} {patient.last_name} ({patient.patient_number})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {patient.gender ? `${patient.gender} · ` : ''}{patient.date_of_birth}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {patient.phone || 'No phone'}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedPatient ? (
                  <>Selected patient: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong></>
                ) : (
                  'Select a patient from the list above.'
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={closeBindDialog}>
                  Cancel
                </Button>
                <Button onClick={handleBindAccount} disabled={!selectedPatient || binding}>
                  {binding ? 'Linking...' : 'Link Account'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default PatientAccountRegistration;
