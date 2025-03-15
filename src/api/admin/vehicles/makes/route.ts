import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleMakeWorkflow } from "../../../../workflows/vehicles/create-vehicle-make";
import { PostAdminCreateVehicleMake } from "./validators";

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
      entity: "vehicle_make",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: makes, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      makes,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Vehicle Makes:", error);
    res.status(500).json({ error: "An error occurred while fetching Vehicle Makes" });
  }
};

type PostAdminCreateVehicleMakeReq = z.infer<
  typeof PostAdminCreateVehicleMake
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleMakeReq>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleMakeWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleMake: result });
};

