import { Label, Select } from "@medusajs/ui";
import { Control, Controller } from "react-hook-form";

type Option = {
  id: string;
  name: string;
};

type SelectFieldProps = {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  defaultValue?: string;
  isMulti?: boolean;
};

export function SelectField({
  name,
  control,
  label,
  placeholder = "Select...",
  options,
  disabled = false,
  defaultValue,
  isMulti = false,
}: SelectFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-x-1">
            <Label size="small" weight="plus">
              {label}
            </Label>
          </div>
          <Select 
            value={value} 
            onValueChange={onChange}
            disabled={disabled}
            defaultValue={defaultValue}
            enableSearch={true}
            size="base"
          >
            <Select.Trigger>
              <Select.Value>
                {isMulti 
                  ? Array.isArray(value) 
                    ? value.map(v => options.find(opt => opt.id === v)?.name).join(", ") || placeholder
                    : placeholder
                  : options.find(opt => opt.id === value)?.name || placeholder
                }
              </Select.Value>
            </Select.Trigger>
            <Select.Content>
              {options.map((option) => (
                <Select.Item key={option.id} value={option.id}>
                  {option.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      )}
    />
  );
} 