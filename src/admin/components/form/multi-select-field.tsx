import { Label, Select, Checkbox } from "@medusajs/ui";
import { Control, Controller } from "react-hook-form";

type Option = {
  id: string;
  name: string;
};

type MultiSelectFieldProps = {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
};

export function MultiSelectField({
  name,
  control,
  label,
  placeholder = "Select...",
  options,
  disabled = false,
  required = false,
}: MultiSelectFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selectedValues = Array.isArray(value) ? value : [];
        const selectedLabels = selectedValues
          .map(v => options.find(opt => opt.id === v)?.name)
          .filter(Boolean);

        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-x-1">
              <Label size="small" weight="plus">
                {label}
              </Label>
              {required && (
                <span className="text-rose-500">*</span>
              )}
            </div>
            <Select 
              value={selectedValues.length > 0 ? "selected" : undefined}
              onValueChange={() => {}}
              disabled={disabled}
            >
              <Select.Trigger>
                <Select.Value>
                  {selectedLabels.length > 0
                    ? selectedLabels.join(", ")
                    : placeholder}
                </Select.Value>
              </Select.Trigger>
              <Select.Content>
                <div className="p-2 flex flex-col gap-2">
                  {options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedValues.includes(option.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...selectedValues, option.id]
                            : selectedValues.filter(v => v !== option.id);
                          onChange(newValue);
                        }}
                        disabled={disabled}
                      />
                      <span className="text-sm">{option.name}</span>
                    </div>
                  ))}
                </div>
              </Select.Content>
            </Select>
            {error && (
              <span className="text-rose-500 text-sm">{error.message}</span>
            )}
          </div>
        );
      }}
    />
  );
} 