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
import { PostAdminCreateWiper } from "../../../../api/admin/wipers/validators";
import { Wiper } from "../../../types";

const schema = PostAdminCreateWiper;
type WiperEditFormData = zod.infer<typeof schema>;

type WiperEditProps = {
  wiper: Wiper;
  onClose: () => void;
};

function WiperEditForm({ wiper }: Omit<WiperEditProps, "onClose">) {
  const { close } = useDrawer();
  const navigate = useNavigate();
  
  const form = useForm<WiperEditFormData>({
    defaultValues: {
      name: name.name,
      code: code.code,
      kits: kits.kits,
      kits_ids: kits.kits_ids,
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/${wiper.id}`, {
        method: "POST",
        body: data,
      });
      
      close();
      navigate("/wipers");
    } catch (error) {
      console.error("Failed to update wiper:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper"
        description="Edit wiper details"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="name"
            control={form.control}
            label="Name"
          />
          <InputField
            name="code"
            control={form.control}
            label="Code"
          />
          <InputField
            name="kits"
            control={form.control}
            label="Kits"
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperEdit(props: WiperEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-description">
      <WiperEditForm wiper={props.wiper} />
    </Drawer.Content>
  )
}
