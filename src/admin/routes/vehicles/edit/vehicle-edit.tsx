import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../components/drawer-form-layout";
import { useDrawer } from "../../../components/drawer";
import { PostAdminCreateVehicle } from "../../../../api/admin/vehicles/validators";
import { Vehicle } from "../../../types";
import { ListVehicleMakesRes } from "../../../types";
import { ListVehicleModelsRes } from "../../../types";

const schema = PostAdminCreateVehicle;
type VehicleEditFormData = zod.infer<typeof schema>;

type VehicleEditProps = {
  vehicle: Vehicle;
  onClose: () => void;
};

function VehicleEditForm({ vehicle }: Omit<VehicleEditProps, "onClose">) {
  const { close } = useDrawer();
  const navigate = useNavigate();
  
  const form = useForm<VehicleEditFormData>({
    defaultValues: {
      make: make.make,
      make_id: make.make_id,
      model: model.model,
      model_id: model.model_id,
      series: series.series,
      series_ids: series.series_ids,
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/${vehicle.id}`, {
        method: "POST",
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
          <InputField
            name="make"
            control={form.control}
            label="Make"
          />
          <SelectField
            name="make_id"
            control={form.control}
            label="Make"
            placeholder="Select a make..."
            options={makes}
          />
          <InputField
            name="model"
            control={form.control}
            label="Model"
          />
          <SelectField
            name="model_id"
            control={form.control}
            label="Model"
            placeholder="Select a model..."
            options={models}
          />
          <InputField
            name="series"
            control={form.control}
            label="Series"
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
  )
}
