import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateWiperKit } from "../../../../../api/admin/wipers/kits/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";

import { ListWipersRes } from "../../../../types";

const schema = PostAdminCreateWiperKit;
type CreateWiperKitFormData = zod.infer<typeof schema>;

type WiperKitCreateProps = {
  onClose: () => void;
};

export function WiperKitCreate({ onClose }: WiperKitCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateWiperKitFormData>({
    defaultValues: {
      name: "",
      code: "",
      wiper_id: "",
    },
    resolver: zodResolver(schema),
  });

  const { data: wipersData } = useQuery<ListWipersRes>({
    queryKey: ["wipers"],
    queryFn: () => sdk.client.fetch("/admin/wipers"),
  });

  const wipers = wipersData?.wipers || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/wipers/kits", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/wipers/kits");
    } catch (error) {
      console.error("Failed to create Wiper Kit:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Wiper Kit"
        onSubmit={handleSubmit}
        onClose={onClose}
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
            name="wiper_id"
            control={form.control}
            label="Wiper"
            placeholder="Select a Wiper..."
            options={wipers}            
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 