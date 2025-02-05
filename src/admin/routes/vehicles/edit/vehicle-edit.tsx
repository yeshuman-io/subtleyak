import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicle } from "../../../../api/admin/vehicles/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../components/drawer-form-layout";
import { Vehicle } from "../../../types";
import { useDrawer } from "../../../components/drawer";

const schema = PostAdminCreateVehicle;
type EditVehicleFormData = zod.infer<typeof schema>;

type VehicleEditProps = {
  vehicle: Vehicle;
};

function VehicleEditForm({ vehicle }: Omit<VehicleEditProps, "onClose">) {
  const { close } = useDrawer();
  const navigate = useNavigate();
  
  const form = useForm<EditVehicleFormData>({
    defaultValues: {
      make_id: vehicle.make_id,
      model_id: vehicle.model_id,
      start_year: vehicle.start_year,
      end_year: vehicle.end_year,
    },
    resolver: zodResolver(schema),
  });

  const { data: makesData } = useQuery({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
  });

  const makes = makesData?.vehicle_makes || [];

  const { data: modelsData } = useQuery({
    queryKey: ["vehicle_models", form.watch("make_id")],
    queryFn: () => sdk.client.fetch("/admin/vehicles/models", {
      query: { make_id: form.watch("make_id") },
    }),
    enabled: !!form.watch("make_id"),
  });

  const models = modelsData?.vehicle_models || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/${vehicle.id}`, {
        method: "PATCH",
        body: data,
      });
      
      close();
      navigate("/vehicles");
    } catch (error) {
      console.error("Failed to update vehicle:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle"
        description="Edit vehicle details"
        onSubmit={handleSubmit}
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
            disabled={!form.watch("make_id")}
          />

          <InputField
            name="start_year"
            control={form.control}
            label="Start Year"
            type="number"
          />

          <InputField
            name="end_year"
            control={form.control}
            label="End Year"
            type="number"
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleEdit(props: VehicleEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-vehicle-description">
      <VehicleEditForm vehicle={props.vehicle} />
    </Drawer.Content>
  );
} 