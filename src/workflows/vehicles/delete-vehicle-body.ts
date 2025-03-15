import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type DeleteVehicleBodyStepInput = {
  id: string;
};

export const deleteVehicleBodyStep = createStep(
  "delete-vehicle-body-step",
  async (input: DeleteVehicleBodyStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const original = await vehiclesModuleService.retrieveVehicleBody(input.id);
    await vehiclesModuleService.deleteVehicleBodys(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.createVehicleBodys(context.original);
  }
);

type DeleteVehicleBodyWorkflowInput = DeleteVehicleBodyStepInput;

export const deleteVehicleBodyWorkflow = createWorkflow(
  "delete-vehicle-body-workflow",
  (input: DeleteVehicleBodyWorkflowInput) => {
    const result = deleteVehicleBodyStep(input);

    return new WorkflowResponse(result);
  }
);