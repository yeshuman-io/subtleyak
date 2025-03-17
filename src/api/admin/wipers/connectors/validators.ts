import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import WiperConnector from "../../../../modules/wipers/models/wiper-connector";

export const GetWiperConnectorSchema = createFindParams();

export const PostAdminCreateWiperConnector = z.object({
  name: z.string(),
  code: z.string(),
  type: z.string(),
  media_url: z.string(),
  arms_ids: z.array(z.string().min(1)),
});

export const PostAdminUpdateWiperConnector = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.string().optional(),
  media_url: z.string().optional(),
  arms_ids: z.array(z.string().min(1)).optional(),
});

export type AdminCreateWiperConnectorReq = z.infer<typeof PostAdminCreateWiperConnector>;
export type AdminUpdateWiperConnectorReq = z.infer<typeof PostAdminUpdateWiperConnector>;

export type WiperConnectorAdminListRes = {
  items: typeof WiperConnector;
  count: number;
  limit: number;
  offset: number;
};