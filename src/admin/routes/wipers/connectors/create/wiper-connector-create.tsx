import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateWiperConnector } from "../../../../../api/admin/wipers/connectors/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";


const schema = PostAdminCreateWiperConnector;
type CreateWiperConnectorFormData = zod.infer<typeof schema>;

type WiperConnectorCreateProps = {
  onClose: () => void;
};

export function WiperConnectorCreate({ onClose }: WiperConnectorCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateWiperConnectorFormData>({
    defaultValues: {
      name: "",
      code: "",
      type: "",
      media_url: "",
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/wipers/connectors", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/wipers/connectors");
    } catch (error) {
      console.error("Failed to create Wiper Connector:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Wiper Connector"
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
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 