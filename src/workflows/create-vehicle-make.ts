import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type CreateVehicleMakeStepInput = {
  name: string;
};

export const createVehicleMakeStep = createStep(
  "create-vehicle-make-step",
  async (input: CreateVehicleMakeStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const vehicleMake = await vehiclesModuleService.createVehicleMakes(input);

    return new StepResponse(vehicleMake, vehicleMake.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleMakes(id);
  }
);

type CreateVehicleMakeWorkflowInput = {
  name: string;
};

export const createVehicleMakeWorkflow = createWorkflow(
  "create-vehicle-make-workflow",
  (input: CreateVehicleMakeWorkflowInput) => {
    const vehicleMake = createVehicleMakeStep(input);

    return new WorkflowResponse(vehicleMake);
  }
);
