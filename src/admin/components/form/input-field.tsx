import { Label, Input } from "@medusajs/ui";
import { Control, Controller } from "react-hook-form";

type InputFieldProps = {
  name: string;
  control: Control<any>;
  label: string;
  type?: string;
};

export function InputField({
  name,
  control,
  label,
  type = "text",
}: InputFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-x-1">
            <Label size="small" weight="plus">
              {label}
            </Label>
          </div>
          <Input type={type} {...field} />
        </div>
      )}
    />
  );
} 