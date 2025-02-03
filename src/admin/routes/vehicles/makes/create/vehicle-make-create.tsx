import * as zod from "zod"
import { 
  FocusModal,
  Heading,
  Label,
  Input,
  Button,
} from "@medusajs/ui"
import { 
  FormProvider,
  Controller,
  useForm,
} from "react-hook-form"
import { PostAdminCreateVehicleMake } from "../../../../../api/admin/vehicles/makes/validators"
import { sdk } from "../../../../lib/sdk"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { InputField } from "../../../../components/form/input-field"
import { FormLayout } from "../../../../components/form/form-layout"
import { ModalForm } from "../../../../components/form/modal-form"

// We can reuse our existing validator schema
const schema = PostAdminCreateVehicleMake;
type CreateVehicleMakeFormData = zod.infer<typeof schema>;

type VehicleMakeCreateProps = {
  onClose: () => void;
};

export function VehicleMakeCreate({ onClose }: VehicleMakeCreateProps) {
  const navigate = useNavigate()

  const form = useForm<CreateVehicleMakeFormData>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/makes", {
        method: "POST",
        body: data
      });
      
      // Close modal and refresh page
      onClose()
      navigate("/vehicles/makes")
    } catch (error) {
      console.error("Failed to create make:", error)
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Vehicle Make"
        onSubmit={handleSubmit}
        onClose={onClose}
      >
        <FormLayout>
          <InputField
            name="name"
            control={form.control}
            label="Make Name"
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 