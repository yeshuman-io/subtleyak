import { z } from "zod";

export const PostAdminCreateVehicle = z.object({
  make_id: z.string().min(1),
  model_id: z.string().min(1),
  start_year: z.number().min(1),
  end_year: z.number().min(1),
});

export const PostAdminUpdateVehicle = z.object({
  make_id: z.string().min(1).optional(),
  model_id: z.string().min(1).optional(),
  start_year: z.number().optional(),
  end_year: z.number().optional(),
});

import { z } from "zod";

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

import { z } from "zod";

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

import { z } from "zod";

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

import { z } from "zod";

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

import { z } from "zod";

export const PostAdminCreateVehicleSeries = z.object({
  start_year: z.number(),
  end_year: z.number(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});

export const PostAdminUpdateVehicleSeries = z.object({
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  vehicle_id: z.string().optional().min(1),
  model_id: z.string().optional().min(1),
});
