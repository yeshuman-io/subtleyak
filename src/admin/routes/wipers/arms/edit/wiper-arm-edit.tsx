import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateWiperArm } from "../../../../../api/admin/wipers/arms/validators";
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
import { WiperArm } from "../../../../types";
import { ListWiperConnectorsRes } from "../../../../types";

const schema = PostAdminUpdateWiperArm;
type EditWiperArmFormData = zod.infer<typeof schema>;

type WiperArmEditProps = {
  wiperArm: {
    id: string;
    name: string;
    code: string;
    connector: string;
    connector_id: string;
    connector?: { id: string; name: string };
  };
  onClose: () => void;
};

function WiperArmEditForm({ wiperArm, onClose }: WiperArmEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditWiperArmFormData>({
    defaultValues: {
      name: wiperArm.name,
      code: wiperArm.code,
      connector: wiperArm.connector,
      connector_id: wiperArm.connector_id,
    },
    resolver: zodResolver(schema),
  });

  const { data: wiperconnectorData } = useQuery<ListWiperConnectorsRes>({
    queryKey: ["wiper_connectors"],
    queryFn: () => sdk.client.fetch("/admin/wipers/wiper-connectors"),
  });

  const wiperconnectors = wiperconnectorData?.wiper_connectors || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/arms/${wiperArm.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["arms"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/wipers/arms");
    } catch (error) {
      console.error("Failed to update wiper-arm:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper Arm"
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
          <SelectField
            name="connector_id"
            control={form.control}
            label="Connector"
            placeholder="Select connector..."
            options={ wiperconnectors }
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperArmEdit(props: WiperArmEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-arm-description">
      <WiperArmEditForm {...props} />
    </Drawer.Content>
  );
}