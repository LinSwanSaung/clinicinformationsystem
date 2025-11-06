# Clinic Workflow Summary

## Quick Reference: Entity Lifecycle

### APPOINTMENT

```
scheduled → waiting → in_progress → completed
                ↓
            (cancelled/no_show)
```

### QUEUE TOKEN

```
waiting → ready → called → serving → completed
    ↓                                    ↓
(cancelled/missed)              (visit_end_time set)
```

### VISIT

```
in_progress (created) → in_progress (consultation ends) → completed (invoice paid)
        ↓                        ↓                              ↓
   (can add data)        (visit_end_time set)          (total_cost calculated)
```

---

## Critical Business Rules

1. **Visit Creation:** Happens when token is issued (walk-in or appointment)
2. **Visit Completion:** ONLY happens when invoice is paid
3. **Consultation End:** Only sets `visit_end_time`, does NOT complete visit
4. **Medical Data:** Can only be added when visit is `in_progress` AND `visit_end_time` is NOT set

---

## Top 5 Bug Scenarios to Watch

### 🐛 #1: Token has no `visit_id`

- **Symptom:** Visit never gets `visit_end_time`
- **Fix:** Ensure all tokens have `visit_id` (backfill + validation)

### 🐛 #2: Invoice has no `visit_id`

- **Symptom:** Invoice paid but visit never completed
- **Fix:** Validate invoice creation requires `visit_id`

### 🐛 #3: `markPatientMissed()` doesn't cancel visit

- **Symptom:** Visit stays `in_progress` after patient marked missed
- **Fix:** Add visit cancellation in `markPatientMissed()`

### 🐛 #4: Multiple visits per patient

- **Symptom:** Warning doesn't show, billing confusion
- **Fix:** Check for existing active visit before creating new one

### 🐛 #5: Visit completion fails but invoice completes

- **Symptom:** Money received but visit not closed
- **Fix:** Use transaction or complete visit first, then invoice

---

## Workflow Timeline

```
T0: Appointment created (scheduled)
T1: Patient arrives → Token + Visit created (both in_progress)
T2: Doctor calls → Token: serving, Visit: in_progress (visit_start_time set)
T3: Consultation ends → Token: completed, Visit: in_progress (visit_end_time set)
T4: Invoice paid → Visit: completed (payment_status: paid)
```

**Key Point:** Visit stays `in_progress` from T1 to T4 (only completes at T4)
