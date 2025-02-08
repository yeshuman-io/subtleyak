import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreate } from "../../../../api/admin/vehicles/validators";
import { sdk } from "../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../components/form/select-field";
import { InputField } from "../../../components/form/input-field";
import { FormLayout } from "../../../components/form/form-layout";
import { ModalForm } from "../../../components/form/modal-form";

const schema = PostAdminCreate;
type CreateFormData = zod.infer<typeof schema>;

type CreateProps = {
  onClose: () => void;
};

export function Create({ onClose }: CreateProps) {
  const navigate = useNavigate();
  
  const form = useForm<CreateFormData>({
    defaultValues: {
    },
    resolver: zodResolver(schema),
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles", {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/vehicles");
    } catch (error) {
      console.error("Failed to create :", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create "
        onSubmit={handleSubmit}
        onClose={onClose}
      >
        <FormLayout>
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
} 