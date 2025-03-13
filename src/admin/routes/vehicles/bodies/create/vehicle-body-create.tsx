import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleBody } from "../../../../../api/admin/vehicles/bodies/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";


const schema = PostAdminCreateVehicleBody;
type CreateVehicleBodyFormData = zod.infer<typeof schema>;

type VehicleBodyCreateProps = {
  onClose: () => void;
};

export function VehicleBodyCreate({ onClose }: VehicleBodyCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateVehicleBodyFormData>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/bodies", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/vehicles/bodies");
    } catch (error) {
      console.error("Failed to create Vehicle Body:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Vehicle Body"
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