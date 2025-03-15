import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleBodyWorkflow } from "../../../../workflows/vehicles/create-vehicle-body";
import { PostAdminCreateVehicleBody } from "./validators";

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
      entity: "vehicle_body",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: bodies, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      bodies,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Vehicle Bodys:", error);
    res.status(500).json({ error: "An error occurred while fetching Vehicle Bodys" });
  }
};

type PostAdminCreateVehicleBodyReq = z.infer<
  typeof PostAdminCreateVehicleBody
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleBodyReq>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleBodyWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleBody: result });
};

