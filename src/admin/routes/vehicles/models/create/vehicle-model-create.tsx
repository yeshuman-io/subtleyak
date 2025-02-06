import * as zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { PostAdminCreateVehicleModel } from "../../../../../api/admin/vehicles/models/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectField } from "../../../../components/form/select-field";
import { InputField } from "../../../../components/form/input-field";
import { FormLayout } from "../../../../components/form/form-layout";
import { ModalForm } from "../../../../components/form/modal-form";
import { ListVehicleMakesRes } from "../../../../types";

const schema = PostAdminCreateVehicleModel;
type CreateVehicleModelFormData = zod.infer<typeof schema>;

type VehicleModelCreateProps = {
  onClose: () => void;
};

export function VehicleModelCreate({ onClose }: VehicleModelCreateProps) {
  const navigate = useNavigate();

  const form = useForm<CreateVehicleModelFormData>({
    defaultValues: {
      name: "",
      make_id: "",
    },
    resolver: zodResolver(schema),
  });

  const { data: makesData } = useQuery<ListVehicleMakesRes>({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
  });

  const makes = makesData?.vehicle_makes || [];

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/models", {
        method: "POST",
        body: data,
      });

      onClose();
      navigate("/vehicles/models");
    } catch (error) {
      console.error("Failed to create model:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <ModalForm
        title="Create Vehicle Model"
        onSubmit={handleSubmit}
        onClose={onClose}
      >
        <FormLayout>
          <SelectField
            name="make_id"
            control={form.control}
            label="Make"
            placeholder="Select a make..."
            options={makes}
          />
          
          <InputField
            name="name"
            control={form.control}
            label="Model Name"
          />
        </FormLayout>
      </ModalForm>
    </FormProvider>
  );
}
