import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperConnectorWorkflow } from "../../../../workflows/wipers/create-wiper-connector";
import { PostAdminCreateWiperConnector } from "./validators";

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
      entity: "wiper_connector",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: connectors, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      connectors,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Wiper Connectors:", error);
    res.status(500).json({ error: "An error occurred while fetching Wiper Connectors" });
  }
};

type PostAdminCreateWiperConnectorReq = z.infer<
  typeof PostAdminCreateWiperConnector
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperConnectorReq>,
  res: MedusaResponse
) => {
  const { result } = await createWiperConnectorWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiperConnector: result });
};

