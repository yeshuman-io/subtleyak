import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleModelWorkflow } from "../../../../workflows/create-vehicle-model";
import { PostAdminCreateVehicleModel } from "./validators";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const {
    data: vehicle_models,
    metadata: { count, take, skip },
  } = await query.graph({
    entity: "vehicle_model",
    ...req.queryConfig,
  });

  res.json({
    vehicle_models,
    count,
    limit: take,
    offset: skip,
  });
};

type PostAdminCreateVehicleModelType = z.infer<
  typeof PostAdminCreateVehicleModel
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleModelType>,
  res: MedusaResponse
) => {
  console.log(req.validatedBody);
  const { result } = await createVehicleModelWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleModel: result });
};
