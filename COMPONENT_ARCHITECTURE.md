# RealCIS Component Architecture Documentation

## Professional Component Naming Convention

This document outlines the refactored, professional component structure for the RealCIS Electronic Medical Records system.

### Main Page Components

#### `ElectronicMedicalRecords.jsx`
**Location**: `src/pages/nurse/ElectronicMedicalRecords.jsx`
**Purpose**: Main EMR page container with tabbed interface
**Dependencies**: All nurse-specific components listed below

---

### Reusable Component Library

#### Navigation Components

##### `NavigationTabs.jsx`
**Location**: `src/components/ui/NavigationTabs.jsx`
**Purpose**: Reusable tab navigation component
**Props**:
- `tabs`: Array of tab objects with `id`, `label`, and optional `icon`
- `activeTab`: Currently active tab ID
- `onTabChange`: Function to handle tab changes
- `className`: Optional custom styling
- `tabClassName`: Custom styling for individual tabs
- `activeTabClassName`: Styling for active tab state
- `inactiveTabClassName`: Styling for inactive tab state

---

#### Patient-Specific Components

##### `PatientSearchInterface.jsx`
**Location**: `src/components/nurse/PatientSearchInterface.jsx`
**Purpose**: Professional patient search functionality with autocomplete
**Props**:
- `patients`: Array of patient objects to search through
- `onPatientSelect`: Callback when patient is selected
- `placeholder`: Search input placeholder text
- `className`: Custom styling
- `minSearchLength`: Minimum characters for search activation

##### `PatientInformationHeader.jsx`
**Location**: `src/components/nurse/PatientInformationHeader.jsx`
**Purpose**: Displays comprehensive patient demographic information
**Props**:
- `patient`: Patient object with demographic data
- `onBackClick`: Navigation callback for back button
- `onClearSelection`: Callback to clear patient selection
- `showBackButton`: Boolean to show/hide back button
- `showClearButton`: Boolean to show/hide clear button
- `className`: Custom styling

##### `PatientVitalsDisplay.jsx`
**Location**: `src/components/nurse/PatientVitalsDisplay.jsx`
**Purpose**: Professional vitals display with action buttons
**Props**:
- `vitals`: Patient vitals object (BP, heart rate, temperature, weight)
- `onAddVitals`: Callback for adding new vitals
- `onEditVitals`: Callback for editing existing vitals
- `showAddButton`: Boolean to show add vitals button
- `showEditButton`: Boolean to show edit vitals button
- `className`: Custom styling

##### `MedicalInformationPanel.jsx`
**Location**: `src/components/nurse/MedicalInformationPanel.jsx`
**Purpose**: Comprehensive medical information display (allergies, diagnoses, medications)
**Props**:
- `patient`: Patient object with medical history
- `onAddAllergy`: Callback for adding allergies
- `onAddDiagnosis`: Callback for adding diagnoses
- `onAddMedication`: Callback for adding medications
- `className`: Custom styling
- `showActionButtons`: Boolean to show/hide action buttons

##### `ClinicalNotesDisplay.jsx`
**Location**: `src/components/nurse/ClinicalNotesDisplay.jsx`
**Purpose**: Professional clinical notes display with expandable entries
**Props**:
- `notes`: Array of clinical note objects
- `onAddNote`: Callback for adding new notes
- `onEditNote`: Callback for editing existing notes
- `showAddButton`: Boolean to show add note button
- `className`: Custom styling

##### `PatientDocumentManager.jsx`
**Location**: `src/components/nurse/PatientDocumentManager.jsx`
**Purpose**: Professional document management with upload/download capabilities
**Props**:
- `files`: Array of patient document objects
- `onUploadFile`: Callback for file upload
- `onViewFile`: Callback for file viewing
- `onDownloadFile`: Callback for file download
- `showUploadButton`: Boolean to show upload interface
- `className`: Custom styling

---

### Component Benefits

#### 1. **Reusability**
- Components can be used across different parts of the application
- Consistent UI patterns across admin, reception, and nurse interfaces

#### 2. **Maintainability**
- Single source of truth for each component type
- Easy to update styling and functionality globally

#### 3. **Professional Standards**
- Clear, descriptive naming conventions
- Well-documented props and purposes
- Healthcare industry appropriate terminology

#### 4. **Scalability**
- Easy to extend with new features
- Modular architecture supports future enhancements
- TypeScript-ready structure

#### 5. **Testing**
- Each component can be tested independently
- Clear separation of concerns

---

### Usage Example

```jsx
import ElectronicMedicalRecords from '../pages/nurse/ElectronicMedicalRecords';

// In your routing
<Route path="/nurse/emr" element={<ElectronicMedicalRecords />} />
```

### Next Steps

1. **Integration**: Replace existing EMRPageTabbed.jsx with ElectronicMedicalRecords.jsx
2. **Testing**: Add unit tests for each component
3. **TypeScript**: Convert components to TypeScript for better type safety
4. **Documentation**: Add JSDoc comments for better IDE support
5. **Storybook**: Create component stories for design system documentation

### Migration Path

1. Import the new `ElectronicMedicalRecords` component
2. Update routing to use the new component
3. Test functionality thoroughly
4. Remove old EMRPageTabbed.jsx once confirmed working
5. Apply similar refactoring patterns to other large components

This architecture provides a solid foundation for a professional, maintainable healthcare information system.
