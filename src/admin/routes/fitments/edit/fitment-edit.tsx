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
import { PostAdminCreateFitment } from "../../../../api/admin/fitments/validators";
import { Fitment } from "../../../types";

const schema = PostAdminCreateFitment;
type FitmentEditFormData = zod.infer<typeof schema>;

type FitmentEditProps = {
  fitment: Fitment;
  onClose: () => void;
};

function FitmentEditForm({ fitment }: Omit<FitmentEditProps, "onClose">) {
  const { close } = useDrawer();
  const navigate = useNavigate();
  
  const form = useForm<FitmentEditFormData>({
    defaultValues: {
      code: code.code,
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/fitments/${fitment.id}`, {
        method: "POST",
        body: data,
      });
      
      close();
      navigate("/fitments");
    } catch (error) {
      console.error("Failed to update fitment:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <DrawerFormLayout
        title="Edit Fitment"
        description="Edit fitment details"
        onSubmit={handleSubmit}
      >
        <FormLayout>
          <InputField
            name="code"
            control={form.control}
            label="Code"
          />
        </FormLayout>
      </DrawerFormLayout>
    </FormProvider>
  );
}

export function FitmentEdit(props: FitmentEditProps) {
  return (
    <Drawer.Content aria-describedby="edit-fitment-description">
      <FitmentEditForm fitment={props.fitment} />
    </Drawer.Content>
  )
}
