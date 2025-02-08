import * as zod from "zod";
import { Drawer } from "@medusajs/ui";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminUpdateWiperLength } from "../../../../../api/admin/wipers/lengths/validators";
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
import { WiperLength } from "../../../../types";

const schema = PostAdminUpdateWiperLength;
type EditWiperLengthFormData = zod.infer<typeof schema>;

type WiperLengthEditProps = {
  wiperLength: {
    id: string;
    value: number;
    unit: string;
  };
  onClose: () => void;
};

function WiperLengthEditForm({ wiperLength, onClose }: WiperLengthEditProps) {
  const navigate = useNavigate();
  const { close } = useDrawer();
  const queryClient = useQueryClient();

  const form = useForm<EditWiperLengthFormData>({
    defaultValues: {
      value: wiperLength.value,
      unit: wiperLength.unit,
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/wipers/lengths/${wiperLength.id}`, {
        method: "POST",
        body: data,
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries(["lengths"]);
      
      // Reset form
      form.reset();
      
      // Close drawer and navigate
      close();
      navigate("/wipers/lengths");
    } catch (error) {
      console.error("Failed to update wiper-length:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Wiper Length"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="value"
            control={form.control}
            label="Value"
            type="number"
          />
          <InputField
            name="unit"
            control={form.control}
            label="Unit"
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function WiperLengthEdit(props: WiperLengthEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-wiper-length-description">
      <WiperLengthEditForm {...props} />
    </Drawer.Content>
  );
}