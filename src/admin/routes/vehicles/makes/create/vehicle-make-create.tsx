import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleMake } from "../../../../../api/admin/vehicles/makes/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";


const schema = PostAdminCreateVehicleMake;
type CreateVehicleMakeFormData = zod.infer<typeof schema>;

type VehicleMakeCreateProps = {
  onClose: () => void;
};

export function VehicleMakeCreate({ onClose }: VehicleMakeCreateProps) {
  const navigate = useNavigate();
  
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
        body: data,
      });
      
      onClose();
      navigate("/vehicles/makes");
    } catch (error) {
      console.error("Failed to create Vehicle Make:", error);
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
            label="Name"
            
            
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 