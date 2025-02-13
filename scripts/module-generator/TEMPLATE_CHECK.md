# Module Generator Template Check

## Template Locations

### Old Structure (`[module]`)
```
src/
├── modules/[module]/
│   ├── index.hbs
│   ├── service.hbs
│   └── models/
│       └── [model].hbs
├── api/admin/[module]/
│   ├── route.hbs
│   ├── validators.hbs
│   └── [id]/
│       └── route.hbs
└── admin/routes/[module]/
    ├── page.hbs
    ├── create/
    │   └── [model]-create.hbs
    └── edit/
        └── [model]-edit.hbs
```

@src reference files:
- `src/modules/vehicles/index.ts`
- `src/modules/vehicles/service.ts`
- `src/modules/vehicles/models/vehicle-make.ts`
- `src/api/admin/vehicles/route.ts`
- `src/api/admin/vehicles/validators.ts`
- `src/api/admin/vehicles/[id]/route.ts`
- `src/admin/routes/vehicles/page.tsx`
- `src/admin/routes/vehicles/create/vehicle-make-create.tsx`
- `src/admin/routes/vehicles/edit/vehicle-make-edit.tsx`

### New Structure (`[module.plural]`)
```
src/
├── modules/[module.plural]/
│   ├── [module.modelName].hbs
│   ├── index.hbs
│   ├── service.hbs
│   └── models/
│       └── [model.name].hbs
├── api/admin/[module.plural]/
│   └── [model.plural]/
│       ├── route.hbs
│       ├── validators.hbs
│       └── [id]/
│           └── route.hbs
└── admin/routes/[module.plural]/
    └── [model.plural]/
        ├── page.hbs
        ├── create/
        │   └── [model.name]-create.hbs
        └── edit/
            └── [model.name]-edit.hbs
```

@src reference files:
- `src/modules/vehicles/vehicle.ts`
- `src/modules/vehicles/index.ts`
- `src/modules/vehicles/service.ts`
- `src/modules/vehicles/models/vehicle-model.ts`
- `src/api/admin/vehicles/models/route.ts`
- `src/api/admin/vehicles/models/validators.ts`
- `src/api/admin/vehicles/models/[id]/route.ts`
- `src/admin/routes/vehicles/models/page.tsx`
- `src/admin/routes/vehicles/models/create/vehicle-model-create.tsx`
- `src/admin/routes/vehicles/models/edit/vehicle-model-edit.tsx`

## Files to Check

### 1. Service ✅
- [x] Old: `templates/src/modules/[module]/service.hbs`
- [x] New: `templates/src/modules/[module.plural]/service.hbs`
- [x] Reference: `src/modules/vehicles/service.ts`

### 2. Index ✅
- [x] Old: `templates/src/modules/[module]/index.hbs`
- [x] New: `templates/src/modules/[module.plural]/index.hbs`
- [x] Reference: `src/modules/vehicles/index.ts`

### 3. Model Definition ✅
- [x] Old: `templates/src/modules/[module]/models/[model].hbs`
- [x] New: `templates/src/modules/[module.plural]/models/[model.name].hbs`
- [x] Reference: `src/modules/vehicles/models/vehicle-make.ts`

### 4. Module Model ✅
- [x] Old: N/A
- [x] New: `templates/src/modules/[module.plural]/models/[module.modelName].hbs`
- [x] Reference: `src/modules/vehicles/models/vehicle.ts`

### 5. Module List Route ✅
- [x] Old: `templates/src/api/admin/[module]/route.hbs`
- [x] New: `templates/src/api/admin/[module.plural]/route.hbs`
- [x] Reference: `src/api/admin/vehicles/route.ts`

### 5.1 Model List Route ✅
- [x] Old: `templates/src/api/admin/[module]/models/route.hbs`
- [x] New: `templates/src/api/admin/[module.plural]/[model.plural]/route.hbs`
- [x] Reference: `src/api/admin/vehicles/models/route.ts`

### 6. ID Route
- [ ] Old: `templates/src/api/admin/[module]/[id]/route.hbs`
- [ ] New: `templates/src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs`
- [ ] Reference: `src/api/admin/vehicles/models/[id]/route.ts`

### 7. Validators
- [ ] Old: `templates/src/api/admin/[module]/validators.hbs`
- [ ] New: `templates/src/api/admin/[module.plural]/[model.plural]/validators.hbs`
- [ ] Reference: `src/api/admin/vehicles/models/validators.ts`

### 8. List Page ✅
- [x] Old: `templates/src/admin/routes/[module]/page.hbs`
- [x] New: `templates/src/admin/routes/[module.plural]/[model.plural]/page.hbs`
- [x] Reference: `src/admin/routes/vehicles/models/page.tsx`

### 9. Create Form
- [ ] Old: `templates/src/admin/routes/[module]/create/[model]-create.hbs`
- [ ] New: `templates/src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs`
- [ ] Reference: `src/admin/routes/vehicles/models/create/vehicle-model-create.tsx`

### 10. Edit Form
- [ ] Old: `templates/src/admin/routes/[module]/edit/[model]-edit.hbs`
- [ ] New: `templates/src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs`
- [ ] Reference: `src/admin/routes/vehicles/models/edit/vehicle-model-edit.tsx`

## Reference Files
- `src/modules/vehicles/service.ts`
- `src/modules/vehicles/models/vehicle.ts`
- `src/modules/vehicles/models/vehicle-make.ts`
- `src/api/admin/vehicles/route.ts`
- `src/admin/routes/vehicles/page.tsx`

## Notes
- Need to verify variable names match new module config structure
- Check import paths use correct casing (kebab-case)
- Ensure templates support all relationship types
- Verify admin UI components match actual implementation 