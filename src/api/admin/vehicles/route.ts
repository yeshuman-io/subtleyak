import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleWorkflow } from "../../../workflows/vehicles/create-vehicle";
import { PostAdminCreateVehicle } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
}; //asdfsdfg

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

    const queryOptions = {
      entity: "vehicle",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: vehicles, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

  res.json({
    vehicles,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Vehicles:", error);
    res.status(500).json({ error: "An error occurred while fetching Vehicles" });
  }
};

type PostAdminCreateVehicleType = z.infer<
  typeof PostAdminCreateVehicle
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicles: result });
}; 