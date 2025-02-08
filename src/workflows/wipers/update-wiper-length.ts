import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type UpdateWiperLengthStepInput = {
  id: string;
  value?: false;
  unit?: false;
};

export const updateWiperLengthStep = createStep(
  "update-wiper-length-step",
  async (input: UpdateWiperLengthStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperLength = await wipersModuleService.updateWiperLengths(input);

    return new StepResponse(wiperLength, wiperLength.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateWiperLengthWorkflowInput = {
  id: string;
  value?: false;
  unit?: false;
};

export const updateWiperLengthWorkflow = createWorkflow(
  "update-wiper-length-workflow",
  (input: UpdateWiperLengthWorkflowInput) => {
    const wiperLength = updateWiperLengthStep(input);

    return new WorkflowResponse(wiperLength);
  }
);