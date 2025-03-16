import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicle } from "../../../../api/admin/vehicles/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { ModalForm } from "../../../components/form/modal-form";
import { ListVehicleMakesRes } from "../../../types";
import { ListVehicleModelsRes } from "../../../types";

const schema = PostAdminCreateVehicle;
type CreateVehicleFormData = zod.infer<typeof schema>;

type VehicleCreateProps = {
  onClose: () => void;
};

export function VehicleCreate({ onClose }: VehicleCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateVehicleFormData>({
    defaultValues: {
      make_id: "",
      model_id: "",
    },
    resolver: zodResolver(schema),
  });

  const { data: makesData } = useQuery<ListVehicleMakesRes>({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
  });
  const makes = makesData?.makes || [];
 
  const { data: modelsData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/models"),
  });
  const models = modelsData?.models || [];
 

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/vehicles");
    } catch (error) {
      console.error("Failed to create vehicle:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Vehicle"
        onSubmit={handleSubmit}
        onClose={onClose}
      >
        <FormLayout>
          <SelectField
            name="make_id"
            control={form.control}
            label="Make"
            placeholder="Select a make..."
            options={makes}
          />
          <SelectField
            name="model_id"
            control={form.control}
            label="Model"
            placeholder="Select a model..."
            options={models}
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  )
}