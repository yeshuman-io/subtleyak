import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleBody } from "../../../../../api/admin/vehicles/bodies/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "../../../../components/form/input-field";
import { MultiSelectField } from "../../../../components/form/multi-select-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../../components/drawer-form-layout";
import { useDrawer } from "../../../../components/drawer";
import { ListVehicleModelsRes } from "../../../../types";

const schema = PostAdminCreateVehicleBody;
type EditVehicleBodyFormData = zod.infer<typeof schema>;

type VehicleBodyEditProps = {
  body: {
    id: string;
    name: string;
    models?: { id: string }[];
  };
  onClose: () => void;
};

function VehicleBodyEditForm({ body, onClose }: VehicleBodyEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleBodyFormData>({
    defaultValues: {
      name: body.name,
      model_ids: body.models?.map(m => m.id) || [],
    },
    resolver: zodResolver(schema),
  });

  const { data: modelsData } = useQuery<ListVehicleModelsRes>({
    queryKey: ["vehicle_models"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/models"),
  });

  const models = modelsData?.vehicle_models || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/bodies/${body.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["vehicle_bodies"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/vehicles/bodies");
    } catch (error) {
      console.error("Failed to update body:", error);
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
            label="Body Name"
          />
          <MultiSelectField
            name="model_ids"
            control={form.control}
            label="Vehicle Models"
            placeholder="Select models..."
            options={models}
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function VehicleBodyEdit(props: VehicleBodyEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-body-description">
      <VehicleBodyEditForm {...props} />
    </Drawer.Content>
  );
} 