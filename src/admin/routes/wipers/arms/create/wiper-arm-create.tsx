import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateWiperArm } from "../../../../../api/admin/wipers/arms/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";

import { ListWiperConnectorsRes } from "../../../../types";

const schema = PostAdminCreateWiperArm;
type CreateWiperArmFormData = zod.infer<typeof schema>;

type WiperArmCreateProps = {
  onClose: () => void;
};

export function WiperArmCreate({ onClose }: WiperArmCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateWiperArmFormData>({
    defaultValues: {
      name: "",
      code: "",
      connector_id: "",
    },
    resolver: zodResolver(schema),
  });

  const { data: wiperConnectorsData } = useQuery<ListWiperConnectorsRes>({
    queryKey: ["wiper_connectors"],
    queryFn: () => sdk.client.fetch("/admin/wipers/connectors"),
  });

  const wiperConnectors = wiperConnectorsData?.wiper_connectors || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/wipers/arms", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/wipers/arms");
    } catch (error) {
      console.error("Failed to create Wiper Arm:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Wiper Arm"
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
            name="wiper_connector_id"
            control={form.control}
            label="Wiper Connector"
            placeholder="Select a Wiper Connector..."
            options={connectors}            
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 