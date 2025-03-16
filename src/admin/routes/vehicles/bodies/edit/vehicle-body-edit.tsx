import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateVehicleBody } from "../../../../../api/admin/vehicles/bodies/validators";
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
import { VehicleBody } from "../../../../types";
import { ListVehicleModelsRes } from "../../../../types";

const schema = PostAdminUpdateVehicleBody;
type EditVehicleBodyFormData = zod.infer<typeof schema>;

type VehicleBodyEditProps = {
  vehicleBody: {
    id: string;
    name: string;
    models: string;
    models_ids: string[];
    models?: { id: string; name: string }[];
  };
  onClose: () => void;
};

function VehicleBodyEditForm({ vehicleBody, onClose }: VehicleBodyEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleBodyFormData>({
    defaultValues: {
      name: vehicleBody.name,
      models: vehicleBody.models,
      models_ids: vehicleBody.models_ids,
    },
    resolver: zodResolver(schema),
  });

  const { data: vehiclemodelData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/vehicle-models"),
  });

  const vehiclemodels = vehiclemodelData?.vehicle_models || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/bodies/${vehicleBody.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["bodies"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/vehicles/bodies");
    } catch (error) {
      console.error("Failed to update vehicle-body:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle Body"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="name"
            control={form.control}
            label="Name"
          />
          <SelectField
            name="models_ids"
            control={form.control}
            label="Models"
            placeholder="Select models..."
            options={ vehiclemodels }
            isMulti
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleBodyEdit(props: VehicleBodyEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-vehicle-body-description">
      <VehicleBodyEditForm {...props} />
    </Drawer.Content>
  );
}