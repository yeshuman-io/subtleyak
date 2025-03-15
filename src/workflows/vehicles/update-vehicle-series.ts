import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type UpdateVehicleSeriesStepInput = {
  id: string;
  start_year?: false;
  end_year?: false;
  vehicle_ids?: string[];
  model_ids?: string[];
};

export const updateVehicleSeriesStep = createStep(
  "update-vehicle-series-step",
  async (input: UpdateVehicleSeriesStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleSeries = await vehiclesModuleService.updateVehicleSeriess(input);

    return new StepResponse(vehicleSeries, vehicleSeries.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateVehicleSeriesWorkflowInput = {
  id: string;
  start_year?: false;
  end_year?: false;
  vehicle_ids?: string[];
  model_ids?: string[];
};

export const updateVehicleSeriesWorkflow = createWorkflow(
  "update-vehicle-series-workflow",
  (input: UpdateVehicleSeriesWorkflowInput) => {
    const vehicleSeries = updateVehicleSeriesStep(input);

    return new WorkflowResponse(vehicleSeries);
  }
);