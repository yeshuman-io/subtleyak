import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import WiperArm from "../../../../modules/wipers/models/wiper-arm";

export const GetWiperArmSchema = createFindParams();

export const PostAdminCreateWiperArm = z.object({
  name: z.string(),
  code: z.string(),
  connector_id: z.string().min(1),
});

export const PostAdminUpdateWiperArm = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  connector_id: z.string().min(1).optional(),
});

export type AdminCreateWiperArmReq = z.infer<typeof PostAdminCreateWiperArm>;
export type AdminUpdateWiperArmReq = z.infer<typeof PostAdminUpdateWiperArm>;

export type WiperArmAdminListRes = {
  items: typeof WiperArm;
  count: number;
  limit: number;
  offset: number;
};