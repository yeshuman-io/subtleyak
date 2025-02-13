import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateWiper } from "../../../../../api/admin/wipers/wipers/validators";
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
import { Wiper } from "../../../../types";
import { ListWiperKitsRes } from "../../../../types";

const schema = PostAdminUpdateWiper;
type EditWiperFormData = zod.infer<typeof schema>;

type WiperEditProps = {
  wiper: {
    id: string;
    name: string;
    code: string;
    kits: string;
    kits_ids: string[];
    kits?: { id: string; name: string }[];
  };
  onClose: () => void;
};

function WiperEditForm({ wiper, onClose }: WiperEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditWiperFormData>({
    defaultValues: {
      name: wiper.name,
      code: wiper.code,
      kits: wiper.kits,
      kits_ids: wiper.kits_ids,
    },
    resolver: zodResolver(schema),
  });

  const { data: wiperkitData } = useQuery<ListWiperKitsRes>({
    queryKey: ["wiper_kits"],
    queryFn: () => sdk.client.fetch("/admin/wipers/wiper-kits"),
  });

  const wiperkits = wiperkitData?.wiper_kits || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/wipers/${wiper.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["wipers"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/wipers/wipers");
    } catch (error) {
      console.error("Failed to update wiper:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper"
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
          <SelectField
            name="kits_ids"
            control={form.control}
            label="Kits"
            placeholder="Select kits..."
            options={ wiperkits }
            isMulti
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperEdit(props: WiperEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-description">
      <WiperEditForm {...{
        wiper: props.wiper,
        onClose: props.onClose
      }} />
    </Drawer.Content>
  );
} 