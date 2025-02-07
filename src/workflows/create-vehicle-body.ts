import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type CreateVehicleBodyStepInput = {
  name: string;
  model_ids?: string[];
};

export const createVehicleBodyStep = createStep(
  "create-vehicle-body-step",
  async (input: CreateVehicleBodyStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const vehicleBody = await vehiclesModuleService.createVehicleBodies({
      name: input.name,
      models: input.model_ids?.map(id => ({ id })) || [],
    });

    return new StepResponse(vehicleBody, vehicleBody.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleBodies(id);
  }
);

type CreateVehicleBodyWorkflowInput = {
  name: string;
  model_ids?: string[];
};

export const createVehicleBodyWorkflow = createWorkflow(
  "create-vehicle-body-workflow",
  (input: CreateVehicleBodyWorkflowInput) => {
    const vehicleBody = createVehicleBodyStep(input);

    return new WorkflowResponse(vehicleBody);
  }
); 