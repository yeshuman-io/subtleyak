import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateWiperLength } from "../../../../../api/admin/wipers/lengths/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";


const schema = PostAdminCreateWiperLength;
type CreateWiperLengthFormData = zod.infer<typeof schema>;

type WiperLengthCreateProps = {
  onClose: () => void;
};

export function WiperLengthCreate({ onClose }: WiperLengthCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateWiperLengthFormData>({
    defaultValues: {
      value: 0,
      unit: "",
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/wipers/lengths", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/wipers/lengths");
    } catch (error) {
      console.error("Failed to create Wiper Length:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Wiper Length"
        onSubmit={handleSubmit}
        onClose={onClose}
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
      </ModalForm>
    </FormProvider>
  );
} 