import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateWiper } from "../../../../api/admin/wipers/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { ModalForm } from "../../../components/form/modal-form";

const schema = PostAdminCreateWiper;
type CreateWiperFormData = zod.infer<typeof schema>;

type WiperCreateProps = {
  onClose: () => void;
};

export function WiperCreate({ onClose }: WiperCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateWiperFormData>({
    defaultValues: {
      name: "",
      code: "",
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/wipers", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/wipers");
    } catch (error) {
      console.error("Failed to create wiper:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Wiper"
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
        </FormLayout>
      </ModalForm>
    </FormProvider>
  )
}