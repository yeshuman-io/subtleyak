import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateFitment } from "../../../../api/admin/fitments/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { ModalForm } from "../../../components/form/modal-form";

const schema = PostAdminCreateFitment;
type CreateFitmentFormData = zod.infer<typeof schema>;

type FitmentCreateProps = {
  onClose: () => void;
};

export function FitmentCreate({ onClose }: FitmentCreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateFitmentFormData>({
    defaultValues: {
      code: "",
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/fitments", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/fitments");
    } catch (error) {
      console.error("Failed to create fitment:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Fitment"
        onSubmit={handleSubmit}
        onClose={onClose}
      >
        <FormLayout>
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