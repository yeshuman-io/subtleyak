import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleModelWorkflow } from "../../../../../workflows/update-vehicle-model";
import { PostAdminUpdateVehicleModel } from "../validators";

type PostAdminUpdateVehicleModelType = z.infer<
  typeof PostAdminUpdateVehicleModel
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehicleModelType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleModelWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle_model: result });
};
