import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdate } from "../../../../api/admin/vehicles/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { DrawerFormLayout } from "../../../components/drawer-form-layout";
import {  } from "../../../types";
import { useDrawer } from "../../../components/drawer";

const schema = PostAdminUpdate;
type EditFormData = zod.infer<typeof schema>;

type EditProps = {
  model: ;
};

function EditForm({ model }: Omit<EditProps, "onClose">) {
  const { close } = useDrawer();
  const navigate = useNavigate();
  
  const form = useForm<EditFormData>({
    defaultValues: {
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/${model.id}`, {
        method: "POST",
        body: data,
      });
      
      close();
      navigate("/vehicles");
    } catch (error) {
      console.error("Failed to update :", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit "
        description="Edit  details"
        onSubmit={handleSubmit}
      >
        <FormLayout>
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function Edit(props: EditProps) {
  return (
    <Drawer.Content aria-describedby="edit--description">
      <EditForm model={props.model} />
    </Drawer.Content>
  );
} 