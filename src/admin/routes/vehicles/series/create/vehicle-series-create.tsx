import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleSeries } from "../../../../../api/admin/vehicles/series/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";

import { ListVehiclesRes } from "../../../../types";
import { ListVehicleModelsRes } from "../../../../types";

const schema = PostAdminCreateVehicleSeries;
type CreateVehicleSeriesFormData = zod.infer<typeof schema>;

type VehicleSeriesCreateProps = {
  onClose: () => void;
};

export function VehicleSeriesCreate({ onClose }: VehicleSeriesCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateVehicleSeriesFormData>({
    defaultValues: {
      start_year: 0,
      end_year: 0,
      vehicle_id: "",
      model_id: "",
    },
    resolver: zodResolver(schema),
  });

  const { data: vehiclesData } = useQuery<ListVehiclesRes>({
    queryKey: ["vehicles"],
    queryFn: () => sdk.client.fetch("/admin/vehicles"),
  });

  const vehicles = vehiclesData?.vehicles || [];
  const { data: vehicleModelsData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/models"),
  });

  const vehicleModels = vehicleModelsData?.vehicle_models || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/series", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/vehicles/series");
    } catch (error) {
      console.error("Failed to create Vehicle Series:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Vehicle Series"
        onSubmit={handleSubmit}
        onClose={onClose}
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
          <SelectField
            name="vehicle_id"
            control={form.control}
            label="Vehicle"
            placeholder="Select a Vehicle..."
            options={vehicles}            
          />
          <SelectField
            name="vehicle_model_id"
            control={form.control}
            label="Vehicle Model"
            placeholder="Select a Vehicle Model..."
            options={models}            
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 