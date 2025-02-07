import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type UpdateVehicleBodyStepInput = {
  id: string;
  name?: string;
  model_ids?: string[];
};

export const updateVehicleBodyStep = createStep(
  "update-vehicle-body-step",
  async (input: UpdateVehicleBodyStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    // First, get the existing body to preserve any fields we're not updating
    const existingBody = await vehiclesModuleService.retrieveVehicleBody(input.id);

    // Update only the fields that are provided
    const updateData: any = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // If model_ids are provided, we need to load the existing models
    if (input.model_ids !== undefined) {
      // Load each model individually to ensure we have the full entity
      const models = await Promise.all(
        input.model_ids.map(async (id) => {
          try {
            const query = container.resolve("query");
            const { data } = await query.graph({
              entity: "vehicle_model",
              filters: {
                id: [id]
              }
            });
            
            // Check if we have models and at least one model
            if (!data?.length) {
              console.warn(`No vehicle model found for ID: ${id}`);
              return null;
            }
            
            return data[0];
          } catch (error) {
            console.error(`Failed to load vehicle model ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out any null values from models that weren't found
      updateData.models = models.filter(Boolean);
    }

    const body = await vehiclesModuleService.updateVehicleBodies({
      id: input.id,
      ...updateData,
    });

    return new StepResponse(body, body.id);
  },
  async (id: string, { container }) => {
    // Rollback logic if needed
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);
  }
);

type UpdateVehicleBodyWorkflowInput = {
  id: string;
  name?: string;
  model_ids?: string[];
};

export const updateVehicleBodyWorkflow = createWorkflow(
  "update-vehicle-body-workflow",
  (input: UpdateVehicleBodyWorkflowInput) => {
    const body = updateVehicleBodyStep(input);

    return new WorkflowResponse(body);
  }
); 