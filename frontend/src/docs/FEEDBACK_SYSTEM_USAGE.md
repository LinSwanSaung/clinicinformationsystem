# Feedback System Usage Guide

This guide explains how to use the comprehensive feedback system across all dashboards following HCI principles.

## Overview

The feedback system provides:
- **Toast notifications** (non-blocking, appears in top-right corner)
- **Success messages** (auto-dismiss after 4 seconds)
- **Error messages** (stay until manually dismissed)
- **Warning messages** (auto-dismiss after 5 seconds)
- **Info messages** (auto-dismiss after 5 seconds)

## Basic Usage

### 1. Import the hook

```jsx
import { useFeedback } from '@/contexts/FeedbackContext';
```

### 2. Use in your component

```jsx
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useFeedback();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data: ' + error.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## Examples

### Success Messages

```jsx
// Simple success message
showSuccess('Patient record updated successfully');

// With custom title
showSuccess('Record saved', { title: 'Update Complete' });

// With action button
showSuccess('Invoice generated', {
  action: <Button onClick={viewInvoice}>View Invoice</Button>
});
```

### Error Messages

```jsx
// Simple error
showError('Failed to load patient data');

// With custom title
showError('Network error occurred', { title: 'Connection Failed' });

// With retry action
showError('Failed to save changes', {
  action: <Button onClick={retry}>Retry</Button>
});
```

### Warning Messages

```jsx
showWarning('This action cannot be undone');
showWarning('Patient has outstanding balance', {
  title: 'Payment Required'
});
```

### Info Messages

```jsx
showInfo('Refreshing patient list...');
showInfo('Changes will be saved automatically', {
  title: 'Auto-save Enabled'
});
```

## Replacing Existing Patterns

### Replace `alert()`

**Before:**
```jsx
alert('Vitals saved successfully!');
```

**After:**
```jsx
showSuccess('Vitals saved successfully!');
```

### Replace inline state messages

**Before:**
```jsx
const [successMessage, setSuccessMessage] = useState(null);
const [error, setError] = useState(null);

// In JSX
{successMessage && <div className="success">{successMessage}</div>}
{error && <div className="error">{error}</div>}
```

**After:**
```jsx
const { showSuccess, showError } = useFeedback();

// In handler
showSuccess('Operation completed!');
showError('Operation failed!');
// No JSX needed - toasts appear automatically
```

### Replace custom notification functions

**Before:**
```jsx
const showNotification = (type, message) => {
  setNotification({ type, message });
  setTimeout(() => setNotification(null), 5000);
};
```

**After:**
```jsx
const { showSuccess, showError, showWarning, showInfo } = useFeedback();

// Use appropriate function
if (type === 'success') showSuccess(message);
else if (type === 'error') showError(message);
// etc.
```

## Best Practices

1. **Use appropriate types:**
   - `showSuccess` - For completed actions
   - `showError` - For failures that need attention
   - `showWarning` - For important notices
   - `showInfo` - For informational messages

2. **Be specific:**
   ```jsx
   // ❌ Bad
   showError('Error');
   
   // ✅ Good
   showError('Failed to save patient record. Please check your connection and try again.');
   ```

3. **Provide actionable messages:**
   ```jsx
   // ✅ Good
   showError('Failed to connect to server. Please check your internet connection.', {
     action: <Button onClick={retry}>Retry</Button>
   });
   ```

4. **Use in async operations:**
   ```jsx
   const handleSubmit = async () => {
     try {
       setIsLoading(true);
       await api.save();
       showSuccess('Saved successfully!');
     } catch (error) {
       showError(error.message || 'Failed to save');
     } finally {
       setIsLoading(false);
     }
   };
   ```

## HCI Principles Applied

✅ **Immediate Feedback** - Users see results instantly
✅ **Clear Visual Cues** - Colors and icons indicate message type
✅ **Non-intrusive** - Toasts don't block workflow
✅ **Accessible** - ARIA labels and proper roles
✅ **Actionable** - Errors stay visible until dismissed
✅ **Consistent** - Same system across all dashboards

