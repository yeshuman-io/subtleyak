import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateVehicleMake } from "../../../../../api/admin/vehicles/makes/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { SwitchField } from "../../../../components/form/switch-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../../components/drawer-form-layout";
import { useDrawer } from "../../../../components/drawer";
import { VehicleMake } from "../../../../types";
import { ListVehicleModelsRes } from "../../../../types";
import { ListVehiclesRes } from "../../../../types";

const schema = PostAdminUpdateVehicleMake;
type EditVehicleMakeFormData = zod.infer<typeof schema>;

type VehicleMakeEditProps = {
  vehicleMake: {
    id: string;
    name: string;
    models: string;
    models_ids: string[];
    models?: { id: string; name: string }[];
    vehicles: string;
    vehicles_ids: string[];
    vehicles?: { id: string; name: string }[];
  };
  onClose: () => void;
};

function VehicleMakeEditForm({ vehicleMake, onClose }: VehicleMakeEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleMakeFormData>({
    defaultValues: {
      name: vehicleMake.name,
      models: vehicleMake.models,
      models_ids: vehicleMake.models_ids,
      vehicles: vehicleMake.vehicles,
      vehicles_ids: vehicleMake.vehicles_ids,
    },
    resolver: zodResolver(schema),
  });

  const { data: vehiclemodelData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicle-models"),
  });

  const vehiclemodels = vehiclemodelData?.vehicle_models || [];
  const { data: vehicleData } = useQuery<ListVehiclesRes>({
    queryKey: ["vehicles"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicles"),
  });

  const vehicles = vehicleData?.vehicles || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/makes/${vehicleMake.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["makes"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/vehicles/makes");
    } catch (error) {
      console.error("Failed to update vehicle-make:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle Make"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="name"
            control={form.control}
            label="Name"
          />
          <InputField
            name="models"
            control={form.control}
            label="Models"
          />
          <SelectField
            name="models_ids"
            control={form.control}
            label="Models"
            placeholder="Select models..."
            options={ vehiclemodels }
            isMulti
          />
          <InputField
            name="vehicles"
            control={form.control}
            label="Vehicles"
          />
          <SelectField
            name="vehicles_ids"
            control={form.control}
            label="Vehicles"
            placeholder="Select vehicles..."
            options={ vehicles }
            isMulti
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleMakeEdit(props: VehicleMakeEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-vehicle-make-description">
      <VehicleMakeEditForm {...{
        vehicleMake: props.vehicleMake,
        onClose: props.onClose
      }} />
    </Drawer.Content>
  );
} 