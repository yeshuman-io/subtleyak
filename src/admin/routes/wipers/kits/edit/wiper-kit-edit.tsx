import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateWiperKit } from "../../../../../api/admin/wipers/kits/validators";
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
import { WiperKit } from "../../../../types";
import { ListWipersRes } from "../../../../types";

const schema = PostAdminUpdateWiperKit;
type EditWiperKitFormData = zod.infer<typeof schema>;

type WiperKitEditProps = {
  wiperKit: {
    id: string;
    name: string;
    code: string;
    wiper: string;
    wiper_id: string;
    wiper?: { id: string; name: string };
  };
  onClose: () => void;
};

function WiperKitEditForm({ wiperKit, onClose }: WiperKitEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditWiperKitFormData>({
    defaultValues: {
      name: wiperKit.name,
      code: wiperKit.code,
      wiper: wiperKit.wiper,
      wiper_id: wiperKit.wiper_id,
    },
    resolver: zodResolver(schema),
  });

  const { data: wiperData } = useQuery<ListWipersRes>({
    queryKey: ["wipers"],
    queryFn: () => sdk.client.fetch("/admin/wipers/wipers"),
  });

  const wipers = wiperData?.wipers || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/kits/${wiperKit.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["kits"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/wipers/kits");
    } catch (error) {
      console.error("Failed to update wiper-kit:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper Kit"
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
            name="wiper"
            control={form.control}
            label="Wiper"
          />
          <SelectField
            name="wiper_id"
            control={form.control}
            label="Wiper"
            placeholder="Select wiper..."
            options={ wipers }
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperKitEdit(props: WiperKitEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-kit-description">
      <WiperKitEditForm {...{
        wiperKit: props.wiperKit,
        onClose: props.onClose
      }} />
    </Drawer.Content>
  );
} 