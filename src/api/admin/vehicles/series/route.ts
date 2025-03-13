import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleSeriesWorkflow } from "../../../../workflows/vehicles/create-vehicle-series";
import { PostAdminCreateVehicleSeries } from "./validators";

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
      entity: "vehicle_series",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: series, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      series,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Vehicle Seriess:", error);
    res.status(500).json({ error: "An error occurred while fetching Vehicle Seriess" });
  }
};

type PostAdminCreateVehicleSeriesReq = z.infer<
  typeof PostAdminCreateVehicleSeries
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleSeriesReq>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleSeriesWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleSeries: result });
};

