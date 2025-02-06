import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleWorkflow } from "../../../../workflows/update-vehicle";
import { PatchAdminUpdateVehicle } from "../validators";

type PatchAdminUpdateVehicleType = z.infer<
  typeof PatchAdminUpdateVehicle
>;

export const POST = async (
  req: MedusaRequest<PatchAdminUpdateVehicleType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle: result });
}; 