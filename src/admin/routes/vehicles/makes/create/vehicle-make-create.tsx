import { useAdminCreateMutation } from "@medusajs/admin";
import { Form } from "@medusajs/admin-ui";

export const VehicleMakeCreate = () => {
  const { mutate, isLoading } = useAdminCreateMutation(
    "vehicles/makes"
  );

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Field
        label="Models"
        name="models_ids"
        type="multiselect"
        required=
      />
      <Form.Field
        label="Vehicles"
        name="vehicles_ids"
        type="multiselect"
        required=
      />
      <Form.Submit isLoading={isLoading}>Create</Form.Submit>
    </Form>
  );
}; 