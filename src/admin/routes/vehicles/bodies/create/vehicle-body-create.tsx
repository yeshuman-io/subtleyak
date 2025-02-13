import { useAdminCreateMutation } from "@medusajs/admin";
import { Form } from "@medusajs/admin-ui";

export const VehicleBodyCreate = () => {
  const { mutate, isLoading } = useAdminCreateMutation(
    "vehicles/bodies"
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
      <Form.Submit isLoading={isLoading}>Create</Form.Submit>
    </Form>
  );
}; 