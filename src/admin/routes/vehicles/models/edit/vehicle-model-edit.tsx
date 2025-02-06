import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleModel } from "../../../../../api/admin/vehicles/models/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../../components/drawer-form-layout";
import { useDrawer } from "../../../../components/drawer";

const schema = PostAdminCreateVehicleModel;
type EditVehicleModelFormData = zod.infer<typeof schema>;

type VehicleModelEditProps = {
  model: {
    id: string;
    name: string;
    make_id: string;
    make?: { id?: string; name: string };
  };
};

function VehicleModelEditForm({ model }: VehicleModelEditProps) {
  const { close } = useDrawer();
  const navigate = useNavigate();

  const form = useForm<EditVehicleModelFormData>({
    defaultValues: {
      name: model.name,
      make_id: model.make?.id || model.make_id,
    },
    values: {
      name: model.name,
      make_id: model.make?.id || model.make_id,
    },
    resolver: zodResolver(schema),
  });

  const { data: makesData, isLoading } = useQuery({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
  });

  const makes = makesData?.vehicle_makes || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/models/${model.id}`, {
        method: "POST",
        body: data,
      });
      
      close();
      navigate("/vehicles/models");
    } catch (error) {
      console.error("Failed to update model:", error);
    }
  });

  const selectedMake = makes.find(m => m.id === (model.make?.id || model.make_id));

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Vehicle Model"
        description="Edit vehicle model details"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <SelectField
            name="make_id"
            control={form.control}
            label="Make"
            placeholder="Select a make..."
            options={makes}
            disabled={isLoading}
            defaultValue={selectedMake?.name}
          />
          
          <InputField
            name="name"
            control={form.control}
            label="Model Name"
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleModelEdit(props: VehicleModelEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-model-description">
      <VehicleModelEditForm model={props.model} />
    </Drawer.Content>
  );
} 