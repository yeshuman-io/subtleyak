import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateVehicleSeries } from "../../../../../api/admin/vehicles/series/validators";
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
import { VehicleSeries } from "../../../../types";
import { ListVehiclesRes } from "../../../../types";
import { ListVehicleModelsRes } from "../../../../types";

const schema = PostAdminUpdateVehicleSeries;
type EditVehicleSeriesFormData = zod.infer<typeof schema>;

type VehicleSeriesEditProps = {
  vehicleSeries: {
    id: string;
    start_year: number;
    end_year: number;
    vehicle: string;
    vehicle_id: string;
    vehicle?: { id: string; name: string };
    model: string;
    model_id: string;
    model?: { id: string; name: string };
  };
  onClose: () => void;
};

function VehicleSeriesEditForm({ vehicleSeries, onClose }: VehicleSeriesEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleSeriesFormData>({
    defaultValues: {
      start_year: vehicleSeries.start_year,
      end_year: vehicleSeries.end_year,
      vehicle: vehicleSeries.vehicle,
      vehicle_id: vehicleSeries.vehicle_id,
      model: vehicleSeries.model,
      model_id: vehicleSeries.model_id,
    },
    resolver: zodResolver(schema),
  });

  const { data: vehicleData } = useQuery<ListVehiclesRes>({
    queryKey: ["vehicles"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicles"),
  });

  const vehicles = vehicleData?.vehicles || [];
  const { data: vehiclemodelData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicle-models"),
  });

  const vehiclemodels = vehiclemodelData?.vehicle_models || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/series/${vehicleSeries.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["series"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/vehicles/series");
    } catch (error) {
      console.error("Failed to update vehicle-series:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle Series"
        onSubmit={handleSubmit}
      >
        <FormLayout>
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
          <InputField
            name="vehicle"
            control={form.control}
            label="Vehicle"
          />
          <SelectField
            name="vehicle_id"
            control={form.control}
            label="Vehicle"
            placeholder="Select vehicle..."
            options={ vehicles }
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
            placeholder="Select model..."
            options={ vehiclemodels }
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleSeriesEdit(props: VehicleSeriesEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-vehicle-series-description">
      <VehicleSeriesEditForm {...{
        vehicleSeries: props.vehicleSeries,
        onClose: props.onClose
      }} />
    </Drawer.Content>
  );
} 