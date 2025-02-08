import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type CreateVehicleBodyStepInput = {
  name?: false;
  models_ids?: string[];
};

export const createVehicleBodyStep = createStep(
  "create-vehicle-body-step",
  async (input: CreateVehicleBodyStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleBody = await vehiclesModuleService.createVehicleBodys(input);

    return new StepResponse(vehicleBody, vehicleBody.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleBodys(id);
  }
);

type CreateVehicleBodyWorkflowInput = CreateVehicleBodyStepInput;

export const createVehicleBodyWorkflow = createWorkflow(
  "create-vehicle-body-workflow",
  (input: CreateVehicleBodyWorkflowInput) => {
    const vehicleBody = createVehicleBodyStep(input);

    return new WorkflowResponse(vehicleBody);
  }
); 