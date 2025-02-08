import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleModelWorkflow } from "../../../../workflows/vehicles/create-vehicle-model";
import { PostAdminCreateVehicleModel } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");
    
    const queryOptions = {
      entity: "vehicle_model",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: models, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      models,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Vehicle Models:", error);
    res.status(500).json({ error: "An error occurred while fetching Vehicle Models" });
  }
};

type PostAdminCreateVehicleModelReq = z.infer<
  typeof PostAdminCreateVehicleModel
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleModelReq>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleModelWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleModel: result });
};

