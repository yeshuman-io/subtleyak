import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateWiperConnector } from "../../../../../api/admin/wipers/connectors/validators";
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
import { WiperConnector } from "../../../../types";
import { ListWiperArmsRes } from "../../../../types";

const schema = PostAdminUpdateWiperConnector;
type EditWiperConnectorFormData = zod.infer<typeof schema>;

type WiperConnectorEditProps = {
  wiperConnector: {
    id: string;
    name: string;
    code: string;
    type: string;
    media_url: string;
    arms: string;
    arms_ids: string[];
    arms?: { id: string; name: string }[];
  };
  onClose: () => void;
};

function WiperConnectorEditForm({ wiperConnector, onClose }: WiperConnectorEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditWiperConnectorFormData>({
    defaultValues: {
      name: wiperConnector.name,
      code: wiperConnector.code,
      type: wiperConnector.type,
      media_url: wiperConnector.media_url,
      arms: wiperConnector.arms,
      arms_ids: wiperConnector.arms_ids,
    },
    resolver: zodResolver(schema),
  });

  const { data: wiperarmData } = useQuery<ListWiperArmsRes>({
    queryKey: ["wiper_arms"],
    queryFn: () => sdk.client.fetch("/admin/wipers/wiper-arms"),
  });

  const wiperarms = wiperarmData?.wiper_arms || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/connectors/${wiperConnector.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["connectors"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/wipers/connectors");
    } catch (error) {
      console.error("Failed to update wiper-connector:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper Connector"
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
            name="type"
            control={form.control}
            label="Type"
          />
          <InputField
            name="media_url"
            control={form.control}
            label="Media Url"
          />
          <SelectField
            name="arms_ids"
            control={form.control}
            label="Arms"
            placeholder="Select arms..."
            options={ wiperarms }
            isMulti
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperConnectorEdit(props: WiperConnectorEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-connector-description">
      <WiperConnectorEditForm {...props} />
    </Drawer.Content>
  );
}