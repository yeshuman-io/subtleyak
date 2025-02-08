import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateVehicleModel } from "../../../../../api/admin/vehicles/models/validators";
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
import { VehicleModel } from "../../../../types";
import { ListVehicleMakesRes } from "../../../../types";
import { ListVehiclesRes } from "../../../../types";
import { ListVehicleBodysRes } from "../../../../types";

const schema = PostAdminUpdateVehicleModel;
type EditVehicleModelFormData = zod.infer<typeof schema>;

type VehicleModelEditProps = {
  vehicleModel: {
    id: string;
    name: string;
    make: string;
    make_id: string;
    make?: { id: string; name: string };
    vehicles: string;
    vehicles_ids: string[];
    vehicles?: { id: string; name: string }[];
    bodies: string;
    bodies_ids: string[];
    bodies?: { id: string; name: string }[];
  };
  onClose: () => void;
};

function VehicleModelEditForm({ vehicleModel, onClose }: VehicleModelEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleModelFormData>({
    defaultValues: {
      name: vehicleModel.name,
      make: vehicleModel.make,
      make_id: vehicleModel.make_id,
      vehicles: vehicleModel.vehicles,
      vehicles_ids: vehicleModel.vehicles_ids,
      bodies: vehicleModel.bodies,
      bodies_ids: vehicleModel.bodies_ids,
    },
    resolver: zodResolver(schema),
  });

  const { data: vehiclemakeData } = useQuery<ListVehicleMakesRes>({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicle-makes"),
  });

  const vehiclemakes = vehiclemakeData?.vehicle_makes || [];
  const { data: vehicleData } = useQuery<ListVehiclesRes>({
    queryKey: ["vehicles"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicles"),
  });

  const vehicles = vehicleData?.vehicles || [];
  const { data: vehiclebodyData } = useQuery<ListVehicleBodysRes>({
    queryKey: ["vehicle_bodys"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicle-bodys"),
  });

  const vehiclebodys = vehiclebodyData?.vehicle_bodys || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/models/${vehicleModel.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["models"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/vehicles/models");
    } catch (error) {
      console.error("Failed to update vehicle-model:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle Model"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="name"
            control={form.control}
            label="Name"
          />
          <SelectField
            name="make_id"
            control={form.control}
            label="Make"
            placeholder="Select make..."
            options={ vehiclemakes }
          />
          <SelectField
            name="vehicles_ids"
            control={form.control}
            label="Vehicles"
            placeholder="Select vehicles..."
            options={ vehicles }
            isMulti
          />
          <SelectField
            name="bodies_ids"
            control={form.control}
            label="Bodies"
            placeholder="Select bodies..."
            options={ vehiclebodys }
            isMulti
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleModelEdit(props: VehicleModelEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-vehicle-model-description">
      <VehicleModelEditForm {...props} />
    </Drawer.Content>
  );
}