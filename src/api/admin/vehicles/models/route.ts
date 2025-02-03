import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleModelWorkflow } from "../../../../workflows/create-vehicle-model";
import { updateVehicleModelWorkflow } from "../../../../workflows/update-vehicle-model";
import { PostAdminCreateVehicleModel, PutAdminUpdateVehicleModel } from "./validators";

// Define the query schema
export const GetAdminVehicleModelsParams = z.object({
  make_id: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}).partial();

// Add type for the request with query params
type GetAdminVehicleModelsRequest = MedusaRequest & {
  validatedQuery: z.infer<typeof GetAdminVehicleModelsParams>
};

export const GET = async (req: GetAdminVehicleModelsRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");
  const { make_id } = req.validatedQuery;

  const {
    data: vehicle_models,
    metadata: { count, take, skip },
  } = await query.graph({
    entity: "vehicle_model",
    ...req.queryConfig,
    where: {
      ...req.queryConfig?.where,
      ...(make_id && { make_id }),
    },
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

type PutAdminUpdateVehicleModelType = z.infer<
  typeof PutAdminUpdateVehicleModel
>;

export const PUT = async (
  req: MedusaRequest<PutAdminUpdateVehicleModelType>,
  res: MedusaResponse
) => {
  console.log('PUT REQUEST:', {
    params: req.params,
    body: req.validatedBody
  });

  const { result } = await updateVehicleModelWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle_model: result });
};
